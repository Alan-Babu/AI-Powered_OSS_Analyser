from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
from extractor import extract_fix_and_remediation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OSS Security NLP Explainer",
    description="AI-powered extraction of fix and remediation information from vulnerability descriptions",
    version="1.0.0"
)

class VulnerabilityText(BaseModel):
    description: str = Field(..., min_length=1, max_length=10000, description="Vulnerability description text")

class ExtractionResult(BaseModel):
    fixVersion: str = Field(..., description="Extracted fix version information")
    remediation: str = Field(..., description="Extracted remediation steps")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Confidence score of extraction")

@app.post("/nlp/extract", response_model=ExtractionResult)
def extract_from_description(vulnerability: VulnerabilityText):
    """
    Extract fix version and remediation information from vulnerability description.
    
    - **description**: The vulnerability description text to analyze
    
    Returns structured information about fix versions and remediation steps with confidence scores.
    """
    try:
        logger.info(f"Processing vulnerability description of length: {len(vulnerability.description)}")
        result = extract_fix_and_remediation(vulnerability.description)
        logger.info(f"Successfully extracted information with confidence: {result.get('confidence', 0.0)}")
        return result
    except Exception as e:
        logger.error(f"Error processing vulnerability description: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing description: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint for service monitoring"""
    return {"status": "healthy", "service": "nlp-explainer", "version": "1.0.0"}

@app.get("/")
def root():
    """Root endpoint with service information"""
    return {
        "service": "OSS Security NLP Explainer",
        "version": "1.0.0",
        "description": "AI-powered extraction of fix and remediation information",
        "endpoints": {
            "extract": "/nlp/extract",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.post("/nlp/batch-extract")
def batch_extract_from_descriptions(vulnerabilities: list[VulnerabilityText]):
    """
    Batch process multiple vulnerability descriptions.
    
    - **vulnerabilities**: List of vulnerability descriptions to analyze
    """
    if len(vulnerabilities) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 vulnerabilities per batch request")
    
    results = []
    for i, vulnerability in enumerate(vulnerabilities):
        try:
            logger.info(f"Processing batch item {i+1}/{len(vulnerabilities)}")
            result = extract_fix_and_remediation(vulnerability.description)
            results.append({"index": i, "result": result, "status": "success"})
        except Exception as e:
            logger.error(f"Error processing batch item {i+1}: {str(e)}")
            results.append({
                "index": i, 
                "result": None, 
                "status": "error", 
                "error": str(e)
            })
    
    return {"results": results, "total": len(vulnerabilities)}

