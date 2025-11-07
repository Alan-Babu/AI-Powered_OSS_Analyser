import spacy
import re
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from functools import lru_cache
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VulnerabilityInfo:
    """Structured vulnerability information"""
    cve_id: Optional[str]
    severity: str
    cvss_score: Optional[float]
    affected_versions: List[str]
    fixed_versions: List[str]
    remediation_steps: List[str]
    references: List[str]
    confidence: float

@dataclass
class ExtractionResult:
    """Enhanced extraction result"""
    fix_version: str
    remediation: str
    confidence: float
    vulnerability_info: Optional[VulnerabilityInfo]
    extracted_entities: Dict[str, List[str]]
    risk_assessment: Dict[str, float]

class EnhancedNLPExplainer:
    """Enhanced NLP-based vulnerability explanation and extraction"""
    
    def __init__(self):
        self.nlp = None
        self.ner_pipeline = None
        self.classifier = None
        self.vectorizer = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_models()
    

    

    def async_cache(func):
        cache = {}
        @wraps(func)
        async def wrapper(self, key):
            if key in cache:
                return cache[key]
            result = await func(self, key)
            cache[key] = result
            return result
        return wrapper

    def _initialize_models(self):
        """Initialize NLP models with error handling"""
        try:
            # Load spaCy model for general NLP tasks
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("SpaCy model loaded successfully")
        except OSError:
            logger.warning("SpaCy model not found, downloading...")
            try:
                spacy.cli.download("en_core_web_sm")
                self.nlp = spacy.load("en_core_web_sm")
                logger.info("SpaCy model downloaded and loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load SpaCy model: {e}")
                self.nlp = None
        
        try:
            # Initialize NER pipeline for entity extraction
            self.ner_pipeline = pipeline(
                "ner",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                aggregation_strategy="simple"
            )
            logger.info("NER pipeline initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize NER pipeline: {e}")
            self.ner_pipeline = None
        
        try:
            # Initialize text classification for vulnerability type detection
            self.classifier = pipeline(
                "text-classification",
                model="microsoft/DialoGPT-medium"
            )
            logger.info("Text classifier initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize text classifier: {e}")
            self.classifier = None
        
        # Initialize TF-IDF vectorizer for similarity matching
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
    
    @async_cache
    async def extract_fix_and_remediation(self, description: str) -> Dict[str, any]:
        """Enhanced extraction with caching and multiple NLP techniques"""
        if not description or len(description.strip()) == 0:
            return self._create_empty_result()

        try:
            # Run all async tasks concurrently
            tasks = [
                self._extract_with_spacy(description),
                self._extract_with_bert(description),
                self._extract_with_patterns(description),
                self._extract_vulnerability_info(description)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Combine all results
            combined_result = await self._combine_extraction_results(results, description)
            return combined_result

        except Exception as e:
            logger.error(f"Error in extraction: {e}")
            return self._create_empty_result()


    async def _extract_with_spacy(self, text: str) -> Dict[str, any]:
        """Extract information using SpaCy NLP"""
        if not self.nlp:
            return {}
        
        try:
            doc = self.nlp(text)
            
            # Extract version numbers
            version_pattern = r'\b\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9]+)?\b'
            versions = re.findall(version_pattern, text)
            
            # Extract entities
            entities = {}
            for ent in doc.ents:
                if ent.label_ not in entities:
                    entities[ent.label_] = []
                entities[ent.label_].append(ent.text)
            
            # Extract sentences containing fix/remediation keywords
            fix_keywords = ['fix', 'patch', 'update', 'upgrade', 'resolve', 'remediate']
            fix_sentences = []
            
            for sent in doc.sents:
                if any(keyword in sent.text.lower() for keyword in fix_keywords):
                    fix_sentences.append(sent.text.strip())
            
            return {
                'versions': versions,
                'entities': entities,
                'fix_sentences': fix_sentences,
                'method': 'spacy'
            }
        except Exception as e:
            logger.error(f"SpaCy extraction error: {e}")
            return {}
    
    async def _extract_with_bert(self, text: str) -> Dict[str, any]:
        """Extract information using BERT-based models"""
        if not self.ner_pipeline:
            return {}
        
        try:
            # Use ThreadPoolExecutor for CPU-intensive BERT processing
            loop = asyncio.get_event_loop()
            entities = await loop.run_in_executor(
                self.executor, 
                self.ner_pipeline, 
                text
            )
            
            # Process BERT entities
            bert_entities = {}
            for entity in entities:
                label = entity['entity_group']
                if label not in bert_entities:
                    bert_entities[label] = []
                bert_entities[label].append(entity['word'])
            
            return {
                'bert_entities': bert_entities,
                'method': 'bert'
            }
        except Exception as e:
            logger.error(f"BERT extraction error: {e}")
            return {}
    
    async def _extract_with_patterns(self, text: str) -> Dict[str, any]:
        """Extract information using regex patterns and heuristics"""
        try:
            patterns = {
                'cve_id': r'CVE-\d{4}-\d{4,7}',
                'version_range': r'(\d+\.\d+(?:\.\d+)?)\s*-\s*(\d+\.\d+(?:\.\d+)?)',
                'urls': r'https?://[^\s<>"]+|www\.[^\s<>"]+',
                'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
            }
            
            extracted = {}
            for pattern_name, pattern in patterns.items():
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    extracted[pattern_name] = matches
            
            # Extract remediation steps
            remediation_patterns = [
                r'(?:update|upgrade|patch)\s+to\s+version\s+([^\s,]+)',
                r'install\s+version\s+([^\s,]+)',
                r'use\s+version\s+([^\s,]+)\s+or\s+later',
                r'minimum\s+version\s+([^\s,]+)'
            ]
            
            remediation_versions = []
            for pattern in remediation_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                remediation_versions.extend(matches)
            
            extracted['remediation_versions'] = list(set(remediation_versions))
            
            return {
                'patterns': extracted,
                'method': 'patterns'
            }
        except Exception as e:
            logger.error(f"Pattern extraction error: {e}")
            return {}
    
    async def _extract_vulnerability_info(self, text: str) -> Dict[str, any]:
        """Extract comprehensive vulnerability information"""
        try:
            # Extract CVE ID
            cve_match = re.search(r'CVE-\d{4}-\d{4,7}', text)
            cve_id = cve_match.group(0) if cve_match else None
            
            # Extract severity indicators
            severity_keywords = {
                'critical': ['critical', 'severe', 'high-risk'],
                'high': ['high', 'important', 'serious'],
                'medium': ['medium', 'moderate', 'moderate-risk'],
                'low': ['low', 'minor', 'low-risk']
            }
            
            detected_severity = 'unknown'
            for severity, keywords in severity_keywords.items():
                if any(keyword in text.lower() for keyword in keywords):
                    detected_severity = severity
                    break
            
            # Extract CVSS score if available
            cvss_match = re.search(r'CVSS\s+score[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
            cvss_score = float(cvss_match.group(1)) if cvss_match else None
            
            # Extract affected and fixed versions
            affected_versions = re.findall(r'(?:affected|vulnerable)\s+versions?[:\s]*([^.\n]+)', text, re.IGNORECASE)
            fixed_versions = re.findall(r'(?:fixed|patched)\s+versions?[:\s]*([^.\n]+)', text, re.IGNORECASE)
            
            return {
                'cve_id': cve_id,
                'severity': detected_severity,
                'cvss_score': cvss_score,
                'affected_versions': affected_versions,
                'fixed_versions': fixed_versions,
                'method': 'vulnerability_info'
            }
        except Exception as e:
            logger.error(f"Vulnerability info extraction error: {e}")
            return {}
    
    async def _call_ai_remediation_service(self, original_text: str) -> str:
        chat_api_url = "http://localhost:8000/chat"  # 🔹 Update this to your deployed chat service URL
        prompt = (
            "You are a cybersecurity assistant. "
            "Based on the following vulnerability description, "
            "write a concise remediation guideline in 3–5 sentences:\n\n"
            f"{original_text}"
        )
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(chat_api_url, json={"message": prompt}, timeout=60) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("response", "No remediation generated.")
                    else:
                        logger.warning(f"Chat API returned status {resp.status}")
                        return "Unable to generate remediation from AI."
        except Exception as e:
            logger.error(f"Error calling Chat microservice: {e}")
            return "Unable to generate remediation from AI."

    async def _combine_extraction_results(self, results: List, original_text: str) -> Dict[str, any]:
        """Combine results from different extraction methods"""
        try:
            combined = {
                'fixVersion': '',
                'remediation': '',
                'confidence': 0.0,
                'extracted_entities': {},
                'vulnerability_info': {},
                'risk_assessment': {}
            }
            
            # Combine all extracted entities
            all_entities = {}
            for result in results:
                if isinstance(result, dict):
                    if 'entities' in result:
                        for label, entities in result['entities'].items():
                            if label not in all_entities:
                                all_entities[label] = []
                            all_entities[label].extend(entities)
                    
                    if 'bert_entities' in result:
                        for label, entities in result['bert_entities'].items():
                            if label not in all_entities:
                                all_entities[label] = []
                            all_entities[label].extend(entities)
            
            combined['extracted_entities'] = all_entities
            
            # Extract fix version from patterns
            fix_version = ''
            for result in results:
                if isinstance(result, dict) and 'patterns' in result:
                    if 'remediation_versions' in result['patterns']:
                        versions = result['patterns']['remediation_versions']
                        if versions:
                            fix_version = versions[0]  # Take the first version found
            
            combined['fixVersion'] = fix_version
            
            # Generate remediation text
            remediation_parts = []
            for result in results:
                if isinstance(result, dict):
                    if 'fix_sentences' in result:
                        remediation_parts.extend(result['fix_sentences'])
            
            if remediation_parts:
                combined['remediation'] = ' '.join(remediation_parts[:3])  # Limit to 3 sentences
            else:
                combined['remediation'] = await self._call_ai_remediation_service(original_text)

                
            # Calculate confidence based on extraction success
            successful_extractions = sum(1 for r in results if isinstance(r, dict) and r)
            total_methods = len(results)
            combined['confidence'] = min(1.0, successful_extractions / total_methods)
            
            # Add vulnerability information
            for result in results:
                if isinstance(result, dict) and 'cve_id' in result:
                    combined['vulnerability_info'] = result
                    break
            
            # Calculate risk assessment
            combined['risk_assessment'] = self._calculate_risk_assessment(combined, original_text)
            
            return combined
            
        except Exception as e:
            logger.error(f"Error combining results: {e}")
            return self._create_empty_result()
    
    def _calculate_risk_assessment(self, extracted_data: Dict, original_text: str) -> Dict[str, float]:
        """Calculate risk assessment scores"""
        try:
            risk_scores = {
                'severity_score': 0.0,
                'complexity_score': 0.0,
                'exploitability_score': 0.0
            }
            
            # Severity score based on extracted severity
            severity_mapping = {
                'critical': 1.0,
                'high': 0.8,
                'medium': 0.5,
                'low': 0.2,
                'unknown': 0.5
            }
            
            if 'vulnerability_info' in extracted_data and extracted_data['vulnerability_info']:
                severity = extracted_data['vulnerability_info'].get('severity', 'unknown')
                risk_scores['severity_score'] = severity_mapping.get(severity, 0.5)
            
            # Complexity score based on text length and technical terms
            technical_terms = ['buffer', 'overflow', 'injection', 'authentication', 'authorization', 'encryption']
            technical_term_count = sum(1 for term in technical_terms if term in original_text.lower())
            risk_scores['complexity_score'] = min(1.0, technical_term_count / len(technical_terms))
            
            # Exploitability score based on available information
            info_completeness = 0.0
            if extracted_data.get('fixVersion'):
                info_completeness += 0.3
            if extracted_data.get('remediation'):
                info_completeness += 0.3
            if extracted_data.get('vulnerability_info', {}).get('cve_id'):
                info_completeness += 0.4
            
            risk_scores['exploitability_score'] = info_completeness
            
            return risk_scores
            
        except Exception as e:
            logger.error(f"Error calculating risk assessment: {e}")
            return {'severity_score': 0.5, 'complexity_score': 0.5, 'exploitability_score': 0.5}
    
    def _create_empty_result(self) -> Dict[str, any]:
        """Create empty result structure"""
        return {
            'fixVersion': '',
            'remediation': 'Unable to extract remediation information.',
            'confidence': 0.0,
            'extracted_entities': {},
            'vulnerability_info': {},
            'risk_assessment': {'severity_score': 0.5, 'complexity_score': 0.5, 'exploitability_score': 0.5}
        }

# Global instance for reuse
explainer = EnhancedNLPExplainer()

async def extract_fix_and_remediation(description: str) -> Dict[str, any]:
    """Main function for extracting fix and remediation information"""
    return await explainer.extract_fix_and_remediation(description)
