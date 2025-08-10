from transformers import pipeline
import re
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Load NER pipeline globally to avoid reloading each time
ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", grouped_entities=True)

def extract_fix_and_remediation(text):
    """
    Extract fix version and remediation information from vulnerability text.
    Uses both NER and regex patterns for comprehensive extraction.
    """
    logger.info(f"Processing text: {text[:100]}...")
    
    # Initialize results
    fix_version = "No Fix Yet"
    remediation = "No Remediation Provided"
    confidence = 0.0
    
    # Convert to lowercase for pattern matching
    text_lower = text.lower()
    
    # Pattern-based extraction (more reliable for technical text)
    fix_patterns = [
        r'fix(?:ed)?\s+(?:in\s+)?version\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)',
        r'version\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)\s+(?:fixes|addresses)',
        r'patch(?:ed)?\s+in\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)',
        r'upgrade\s+to\s+(?:version\s+)?([0-9]+\.[0-9]+(?:\.[0-9]+)?)',
        r'update\s+to\s+(?:version\s+)?([0-9]+\.[0-9]+(?:\.[0-9]+)?)'
    ]
    
    remediation_patterns = [
        r'recommend(?:ed)?\s+(upgrading?|updating?|patching?)\s*(?:to\s+[\w\s.]+)?',
        r'should\s+(upgrade|update|patch|disable)\s*(?:the\s+[\w\s]+)?',
        r'(disable|remove|uninstall)\s+(?:the\s+)?(?:vulnerable\s+)?(?:component|feature|module)[\w\s]*',
        r'(upgrade|update)\s+(?:to\s+)?(?:the\s+)?latest\s*(?:version)?',
        r'apply\s+(?:the\s+)?(patch|fix|update)\s*(?:immediately)?'
    ]
    
    # Extract fix version
    fix_confidence = 0.0
    for pattern in fix_patterns:
        match = re.search(pattern, text_lower)
        if match:
            fix_version = match.group(1)
            fix_confidence = 0.8
            logger.info(f"Found fix version: {fix_version}")
            break
    
    # Extract remediation
    remediation_confidence = 0.0
    for pattern in remediation_patterns:
        match = re.search(pattern, text_lower)
        if match:
            action = match.group(1).lower()
            # Convert single word actions to proper remediation messages
            remediation_map = {
                'upgrade': 'Upgrade to the latest version',
                'upgrading': 'Upgrade to the latest version', 
                'update': 'Update to the latest version',
                'updating': 'Update to the latest version',
                'patch': 'Apply the latest security patch',
                'patching': 'Apply the latest security patch',
                'disable': 'Disable the vulnerable component until a fix is available',
                'remove': 'Remove the vulnerable component',
                'uninstall': 'Uninstall the vulnerable component'
            }
            
            remediation = remediation_map.get(action, f"Recommend {action}")
            remediation_confidence = 0.7
            logger.info(f"Found remediation action '{action}' -> '{remediation}'")
            break
    
    # Fallback: Use NER for additional context
    try:
        entities = ner_pipeline(text)
        logger.info(f"NER found {len(entities)} entities")
        
        for ent in entities:
            word = ent["word"].lower()
            entity_score = ent.get("score", 0.0)
            logger.info(f"Entity: {word} (score: {entity_score})")
            
            # Look for version-like patterns in entities
            if re.search(r'[0-9]+\.[0-9]+', word) and fix_version == "No Fix Yet":
                fix_version = word
                fix_confidence = min(0.6, entity_score)
                
            # Look for action words
            if any(kw in word for kw in ["upgrade", "update", "patch", "disable"]) and remediation == "No Remediation Provided":
                # Convert to proper remediation message
                if "upgrade" in word:
                    remediation = "Upgrade to the latest version"
                elif "update" in word:
                    remediation = "Update to the latest version" 
                elif "patch" in word:
                    remediation = "Apply the latest security patch"
                elif "disable" in word:
                    remediation = "Disable the vulnerable component until a fix is available"
                else:
                    remediation = f"Consider {word}"
                    
                remediation_confidence = min(0.5, entity_score)
                
    except Exception as e:
        logger.warning(f"NER processing failed: {e}")
    
    # Calculate overall confidence
    confidence = (fix_confidence + remediation_confidence) / 2.0
    
    # Additional keyword-based fallback
    if fix_version == "No Fix Yet":
        if any(word in text_lower for word in ["fix available", "patch available", "update available"]):
            fix_version = "Fix Available (version not specified)"
            confidence += 0.3
    
    if remediation == "No Remediation Provided":
        # Final keyword-based fallback with proper messages
        if "upgrade" in text_lower:
            remediation = "Upgrade to the latest version"
            confidence += 0.3
        elif "update" in text_lower:
            remediation = "Update to the latest version"
            confidence += 0.3
        elif "patch" in text_lower:
            remediation = "Apply the latest security patch"
            confidence += 0.3
        elif "disable" in text_lower:
            remediation = "Disable the vulnerable component until a fix is available"
            confidence += 0.3
        elif any(word in text_lower for word in ["fix", "resolve", "mitigate"]):
            remediation = "See vulnerability description for remediation details"
            confidence += 0.2
    
    # Ensure confidence is between 0 and 1
    confidence = min(1.0, confidence)
    
    result = {
        "fixVersion": fix_version,
        "remediation": remediation,
        "confidence": round(confidence, 2)
    }
    
    logger.info(f"Extraction result: {result}")
    return result
