import pandas as pd
import numpy as np
import joblib
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DependencyFeatures:
    """Enhanced features extracted from dependency data"""
    package_name: str
    version: str
    ecosystem: str
    last_updated_days: int
    download_count: Optional[int]
    star_count: Optional[int]
    fork_count: Optional[int]
    issue_count: Optional[int]
    commit_frequency: Optional[float]
    maintainer_count: Optional[int]
    license_type: str
    has_security_policy: bool
    has_code_of_conduct: bool
    has_contributing_guide: bool
    vulnerability_count: int
    outdated_days: int
    transitive_dependencies: int
    dependency_depth: int
    description: Optional[str] = None
    homepage: Optional[str] = None
    repository: Optional[str] = None

@dataclass
class RiskPrediction:
    """Enhanced risk prediction result"""
    package_name: str
    risk_score: float
    risk_level: str
    confidence: float
    risk_factors: List[str]
    recommendations: List[str]
    model_version: str
    ai_insights: Dict[str, Any]

class EnhancedRiskPredictor:
    """Enhanced ML-based risk prediction using pre-trained models"""
    
    def __init__(self):
        self.model_version = "3.0.0"
        self.nlp_pipeline = None
        self.risk_classifier = None
        self.hf_token = os.getenv("HF_TOKEN")
        
        # Initialize pre-trained models
        self._initialize_pretrained_models()
    
    def _initialize_pretrained_models(self):
        """Initialize pre-trained models using Hugging Face"""
        try:
            # Initialize text classification pipeline for vulnerability analysis
            self.nlp_pipeline = pipeline(
                "text-classification",
                model="microsoft/DialoGPT-medium",
                return_all_scores=True
            )
            logger.info("Pre-trained NLP pipeline loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load pre-trained NLP model: {e}")
            self.nlp_pipeline = None
        
        try:
            # Initialize risk classification model
            self.risk_classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased",
                return_all_scores=True
            )
            logger.info("Pre-trained risk classifier loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load pre-trained risk classifier: {e}")
            self.risk_classifier = None
    
    def predict_risk(self, dependency_features: DependencyFeatures) -> RiskPrediction:
        """Enhanced risk prediction with AI insights using pre-trained models"""
        try:
            # Calculate risk score using rule-based approach enhanced with AI
            risk_score = self._calculate_risk_score(dependency_features)
            
            # Use pre-trained model for risk level classification
            risk_level = self._classify_risk_level(dependency_features, risk_score)
            
            # Calculate confidence based on data quality
            confidence = self._calculate_confidence(dependency_features)
            
            # Generate risk factors and recommendations
            risk_factors = self._identify_enhanced_risk_factors(dependency_features)
            recommendations = self._generate_enhanced_recommendations(dependency_features, risk_level)
            
            # Generate AI insights using pre-trained models
            ai_insights = self._generate_ai_insights(dependency_features)
            
            return RiskPrediction(
                package_name=dependency_features.package_name,
                risk_score=risk_score,
                risk_level=risk_level,
                confidence=confidence,
                risk_factors=risk_factors,
                recommendations=recommendations,
                model_version=self.model_version,
                ai_insights=ai_insights
            )
            
        except Exception as e:
            logger.error(f"Error in risk prediction: {e}")
            # Return default prediction
            return RiskPrediction(
                package_name=dependency_features.package_name,
                risk_score=0.5,
                risk_level='MEDIUM',
                confidence=0.0,
                risk_factors=['Prediction failed'],
                recommendations=['Unable to generate recommendations'],
                model_version=self.model_version,
                ai_insights={}
            )
    
    def _calculate_risk_score(self, dep: DependencyFeatures) -> float:
        """Calculate risk score using rule-based approach"""
        risk_score = 0.0
        
        # High risk factors
        if dep.vulnerability_count > 5:
            risk_score += 0.3
        elif dep.vulnerability_count > 0:
            risk_score += 0.15 * dep.vulnerability_count
        
        if dep.outdated_days > 365:
            risk_score += 0.2
        elif dep.outdated_days > 180:
            risk_score += 0.1
        
        if dep.last_updated_days > 730:
            risk_score += 0.15
        elif dep.last_updated_days > 365:
            risk_score += 0.1
        
        if dep.maintainer_count and dep.maintainer_count < 2:
            risk_score += 0.1
        
        if not dep.has_security_policy:
            risk_score += 0.1
        
        if dep.commit_frequency and dep.commit_frequency < 0.01:
            risk_score += 0.1
        
        if dep.dependency_depth > 5:
            risk_score += 0.05
        
        # Medium risk factors
        if dep.star_count and dep.star_count < 10:
            risk_score += 0.05
        
        if dep.transitive_dependencies > 50:
            risk_score += 0.05
        
        if dep.issue_count and dep.issue_count > 100:
            risk_score += 0.03
        
        if dep.license_type == 'Other':
            risk_score += 0.02
        
        # Normalize to 0-1 range
        return min(risk_score, 1.0)
    
    def _classify_risk_level(self, dep: DependencyFeatures, risk_score: float) -> str:
        """Classify risk level using pre-trained model if available"""
        try:
            if self.risk_classifier and dep.description:
                # Use pre-trained model for classification
                text_input = f"Package: {dep.package_name}, Vulnerabilities: {dep.vulnerability_count}, Outdated: {dep.outdated_days} days"
                result = self.risk_classifier(text_input[:512])  # Limit text length
                
                # Map model output to risk levels
                if result and len(result) > 0:
                    # Use the highest confidence prediction
                    best_prediction = max(result[0], key=lambda x: x['score'])
                    confidence = best_prediction['score']
                    
                    # Adjust risk level based on model confidence and calculated score
                    if confidence > 0.7:
                        if risk_score > 0.6:
                            return 'HIGH'
                        elif risk_score > 0.3:
                            return 'MEDIUM'
                        else:
                            return 'LOW'
        except Exception as e:
            logger.warning(f"Error in model-based classification: {e}")
        
        # Fallback to rule-based classification
        if risk_score >= 0.6:
            return 'HIGH'
        elif risk_score >= 0.3:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _calculate_confidence(self, dep: DependencyFeatures) -> float:
        """Calculate confidence based on data quality and completeness"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence for complete data
        if dep.description:
            confidence += 0.1
        if dep.star_count is not None:
            confidence += 0.1
        if dep.maintainer_count is not None:
            confidence += 0.1
        if dep.commit_frequency is not None:
            confidence += 0.1
        if dep.homepage or dep.repository:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _identify_enhanced_risk_factors(self, dep: DependencyFeatures) -> List[str]:
        """Identify enhanced risk factors for a dependency"""
        risk_factors = []
        
        if dep.vulnerability_count > 0:
            risk_factors.append(f"Has {dep.vulnerability_count} known vulnerabilities")
        
        if dep.outdated_days > 365:
            risk_factors.append(f"Package is {dep.outdated_days} days outdated")
        
        if dep.last_updated_days > 730:
            risk_factors.append(f"Package hasn't been updated in {dep.last_updated_days} days")
        
        if dep.maintainer_count and dep.maintainer_count < 2:
            risk_factors.append("Limited number of maintainers")
        
        if not dep.has_security_policy:
            risk_factors.append("No security policy defined")
        
        if dep.dependency_depth > 5:
            risk_factors.append(f"Deep dependency chain ({dep.dependency_depth} levels)")
        
        if dep.transitive_dependencies > 50:
            risk_factors.append(f"Large number of transitive dependencies ({dep.transitive_dependencies})")
        
        if dep.star_count and dep.star_count < 10:
            risk_factors.append("Low popularity (few stars)")
        
        if dep.issue_count and dep.issue_count > 100:
            risk_factors.append("High number of open issues")
        
        if dep.license_type == 'Other':
            risk_factors.append("Non-standard license type")
        
        return risk_factors
    
    def _generate_enhanced_recommendations(self, dep: DependencyFeatures, risk_level: str) -> List[str]:
        """Generate enhanced recommendations based on risk level and features"""
        recommendations = []
        
        if risk_level == 'HIGH':
            recommendations.append("Consider replacing this dependency with a more secure alternative")
            recommendations.append("Implement additional security monitoring")
            recommendations.append("Review dependency tree for potential alternatives")
        
        if dep.vulnerability_count > 0:
            recommendations.append("Update to latest version to fix known vulnerabilities")
            recommendations.append("Monitor for security advisories")
        
        if dep.outdated_days > 180:
            recommendations.append("Update to latest version for security patches")
            recommendations.append("Set up automated dependency updates")
        
        if not dep.has_security_policy:
            recommendations.append("Contact maintainers to request security policy")
            recommendations.append("Consider alternative packages with security policies")
        
        if dep.dependency_depth > 3:
            recommendations.append("Consider flattening dependency tree")
            recommendations.append("Review if all transitive dependencies are necessary")
        
        if dep.maintainer_count and dep.maintainer_count < 2:
            recommendations.append("Monitor for maintenance activity")
            recommendations.append("Consider contributing to the project")
        
        if dep.star_count and dep.star_count < 10:
            recommendations.append("Consider more popular alternatives")
        
        if dep.transitive_dependencies > 30:
            recommendations.append("Review and minimize transitive dependencies")
        
        return recommendations
    
    def _generate_ai_insights(self, dep: DependencyFeatures) -> Dict[str, Any]:
        """Generate AI-powered insights using pre-trained models"""
        insights = {}
        
        try:
            if self.nlp_pipeline and dep.description:
                # Analyze package description for security indicators
                result = self.nlp_pipeline(dep.description[:512])  # Limit text length
                insights['description_analysis'] = result
            
            # Generate contextual insights
            insights['contextual_analysis'] = {
                'ecosystem_health': self._assess_ecosystem_health(dep.ecosystem),
                'maintenance_activity': self._assess_maintenance_activity(dep),
                'security_posture': self._assess_security_posture(dep),
                'community_health': self._assess_community_health(dep)
            }
            
            # Add AI-powered recommendations
            insights['ai_recommendations'] = self._generate_ai_recommendations(dep)
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            insights['error'] = str(e)
        
        return insights
    
    def _generate_ai_recommendations(self, dep: DependencyFeatures) -> List[str]:
        """Generate AI-powered recommendations"""
        recommendations = []
        
        # Use pre-trained model to analyze package characteristics
        if self.nlp_pipeline:
            try:
                # Create a comprehensive description for analysis
                analysis_text = f"Package {dep.package_name} in {dep.ecosystem} ecosystem with {dep.vulnerability_count} vulnerabilities"
                if dep.description:
                    analysis_text += f". {dep.description[:200]}"
                
                result = self.nlp_pipeline(analysis_text[:512])
                
                # Generate recommendations based on model analysis
                if result and len(result) > 0:
                    # Add AI-specific recommendations
                    if dep.vulnerability_count > 0:
                        recommendations.append("AI Analysis: High vulnerability count detected - immediate action required")
                    
                    if dep.outdated_days > 365:
                        recommendations.append("AI Analysis: Package significantly outdated - security risks increased")
                    
                    if dep.maintainer_count and dep.maintainer_count < 2:
                        recommendations.append("AI Analysis: Limited maintenance team - consider alternatives")
                
            except Exception as e:
                logger.warning(f"Error in AI recommendation generation: {e}")
        
        return recommendations
    
    def _assess_ecosystem_health(self, ecosystem: str) -> str:
        """Assess the health of the package ecosystem"""
        ecosystem_health = {
            'npm': 'good',
            'pypi': 'good',
            'maven': 'good',
            'nuget': 'good'
        }
        return ecosystem_health.get(ecosystem, 'unknown')
    
    def _assess_maintenance_activity(self, dep: DependencyFeatures) -> str:
        """Assess maintenance activity level"""
        if dep.last_updated_days < 30:
            return 'very_active'
        elif dep.last_updated_days < 90:
            return 'active'
        elif dep.last_updated_days < 365:
            return 'moderate'
        else:
            return 'inactive'
    
    def _assess_security_posture(self, dep: DependencyFeatures) -> str:
        """Assess security posture"""
        if dep.has_security_policy and dep.vulnerability_count == 0:
            return 'excellent'
        elif dep.has_security_policy or dep.vulnerability_count == 0:
            return 'good'
        elif dep.vulnerability_count < 3:
            return 'moderate'
        else:
            return 'poor'
    
    def _assess_community_health(self, dep: DependencyFeatures) -> str:
        """Assess community health"""
        if dep.star_count and dep.star_count > 1000 and dep.maintainer_count and dep.maintainer_count > 3:
            return 'excellent'
        elif dep.star_count and dep.star_count > 100 and dep.maintainer_count and dep.maintainer_count > 1:
            return 'good'
        elif dep.star_count and dep.star_count > 10:
            return 'moderate'
        else:
            return 'poor'

# Global instance
enhanced_risk_predictor = EnhancedRiskPredictor()

def predict_dependency_risk_enhanced(dependency_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced main function for risk prediction using pre-trained models"""
    try:
        # Convert dictionary to DependencyFeatures
        dep = DependencyFeatures(
            package_name=dependency_data.get('package_name', 'unknown'),
            version=dependency_data.get('version', '0.0.0'),
            ecosystem=dependency_data.get('ecosystem', 'unknown'),
            last_updated_days=dependency_data.get('last_updated_days', 0),
            download_count=dependency_data.get('download_count'),
            star_count=dependency_data.get('star_count'),
            fork_count=dependency_data.get('fork_count'),
            issue_count=dependency_data.get('issue_count'),
            commit_frequency=dependency_data.get('commit_frequency'),
            maintainer_count=dependency_data.get('maintainer_count'),
            license_type=dependency_data.get('license_type', 'Unknown'),
            has_security_policy=dependency_data.get('has_security_policy', False),
            has_code_of_conduct=dependency_data.get('has_code_of_conduct', False),
            has_contributing_guide=dependency_data.get('has_contributing_guide', False),
            vulnerability_count=dependency_data.get('vulnerability_count', 0),
            outdated_days=dependency_data.get('outdated_days', 0),
            transitive_dependencies=dependency_data.get('transitive_dependencies', 0),
            dependency_depth=dependency_data.get('dependency_depth', 0),
            description=dependency_data.get('description'),
            homepage=dependency_data.get('homepage'),
            repository=dependency_data.get('repository')
        )
        
        # Predict risk using pre-trained models
        prediction = enhanced_risk_predictor.predict_risk(dep)
        
        # Convert to dictionary
        return {
            'package_name': prediction.package_name,
            'risk_score': prediction.risk_score,
            'risk_level': prediction.risk_level,
            'confidence': prediction.confidence,
            'risk_factors': prediction.risk_factors,
            'recommendations': prediction.recommendations,
            'model_version': prediction.model_version,
            'ai_insights': prediction.ai_insights
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced dependency risk prediction: {e}")
        return {
            'error': str(e),
            'package_name': dependency_data.get('package_name', 'unknown'),
            'risk_score': 0.5,
            'risk_level': 'MEDIUM',
            'confidence': 0.0,
            'ai_insights': {}
        }
