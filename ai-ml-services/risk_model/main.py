from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
from typing import List, Dict, Any, Optional
from enhanced_risk_predictor import predict_dependency_risk_enhanced, DependencyFeatures
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Enhanced Risk Model Service",
    description="AI-powered dependency risk assessment using pre-trained models",
    version="3.0.0"
)

class DependencyData(BaseModel):
    package_name: str = Field(..., description="Name of the package")
    version: str = Field(..., description="Package version")
    ecosystem: str = Field(..., description="Package ecosystem (npm, pypi, maven, nuget)")
    last_updated_days: int = Field(default=0, description="Days since last update")
    download_count: Optional[int] = Field(None, description="Number of downloads")
    star_count: Optional[int] = Field(None, description="Number of stars on repository")
    fork_count: Optional[int] = Field(None, description="Number of forks")
    issue_count: Optional[int] = Field(None, description="Number of open issues")
    commit_frequency: Optional[float] = Field(None, description="Commit frequency")
    maintainer_count: Optional[int] = Field(None, description="Number of maintainers")
    license_type: str = Field(default="Unknown", description="License type")
    has_security_policy: bool = Field(default=False, description="Has security policy")
    has_code_of_conduct: bool = Field(default=False, description="Has code of conduct")
    has_contributing_guide: bool = Field(default=False, description="Has contributing guide")
    vulnerability_count: int = Field(default=0, description="Number of vulnerabilities")
    outdated_days: int = Field(default=0, description="Days since latest version")
    transitive_dependencies: int = Field(default=0, description="Number of transitive dependencies")
    dependency_depth: int = Field(default=0, description="Depth in dependency tree")
    description: Optional[str] = Field(None, description="Package description")
    homepage: Optional[str] = Field(None, description="Package homepage")
    repository: Optional[str] = Field(None, description="Repository URL")

class RiskAssessmentRequest(BaseModel):
    dependencies: List[DependencyData] = Field(..., max_items=100, description="List of dependencies to assess")

class RiskAssessmentResponse(BaseModel):
    assessments: List[Dict[str, Any]]
    summary: Dict[str, Any]
    model_version: str

@app.post("/risk/assess", response_model=Dict[str, Any])
async def assess_dependency_risk(dependency: DependencyData):
    """
    Assess risk for a single dependency using pre-trained AI models.
    
    - **dependency**: Dependency information to assess
    
    Returns comprehensive risk assessment with AI insights.
    """
    try:
        logger.info(f"Assessing risk for dependency: {dependency.package_name}")
        
        # Convert to dictionary format
        dependency_dict = dependency.dict()
        
        # Get risk assessment using pre-trained models
        result = predict_dependency_risk_enhanced(dependency_dict)
        
        logger.info(f"Risk assessment completed for {dependency.package_name}: {result.get('risk_level', 'UNKNOWN')}")
        return result
        
    except Exception as e:
        logger.error(f"Error assessing dependency risk: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error assessing dependency risk: {str(e)}")

@app.post("/risk/batch-assess", response_model=RiskAssessmentResponse)
async def batch_assess_dependencies(request: RiskAssessmentRequest):
    """
    Batch assess multiple dependencies for risk using pre-trained AI models.
    
    - **request**: List of dependencies to assess
    
    Returns comprehensive risk assessments for all dependencies.
    """
    try:
        logger.info(f"Starting batch risk assessment for {len(request.dependencies)} dependencies")
        
        assessments = []
        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0
        total_risk_score = 0.0
        
        for i, dependency in enumerate(request.dependencies):
            try:
                logger.info(f"Processing dependency {i+1}/{len(request.dependencies)}: {dependency.package_name}")
                
                # Convert to dictionary format
                dependency_dict = dependency.dict()
                
                # Get risk assessment
                result = predict_dependency_risk_enhanced(dependency_dict)
                assessments.append(result)
                
                # Update summary statistics
                risk_level = result.get('risk_level', 'MEDIUM')
                if risk_level == 'HIGH':
                    high_risk_count += 1
                elif risk_level == 'MEDIUM':
                    medium_risk_count += 1
                else:
                    low_risk_count += 1
                
                total_risk_score += result.get('risk_score', 0.5)
                
            except Exception as e:
                logger.error(f"Error processing dependency {dependency.package_name}: {str(e)}")
                # Add error result
                assessments.append({
                    'package_name': dependency.package_name,
                    'error': str(e),
                    'risk_score': 0.5,
                    'risk_level': 'MEDIUM',
                    'confidence': 0.0
                })
        
        # Calculate summary
        avg_risk_score = total_risk_score / len(request.dependencies) if request.dependencies else 0.0
        
        summary = {
            'total_dependencies': len(request.dependencies),
            'high_risk_count': high_risk_count,
            'medium_risk_count': medium_risk_count,
            'low_risk_count': low_risk_count,
            'average_risk_score': avg_risk_score,
            'high_risk_percentage': (high_risk_count / len(request.dependencies)) * 100 if request.dependencies else 0.0
        }
        
        logger.info(f"Batch assessment completed: {len(request.dependencies)} dependencies processed")
        
        return RiskAssessmentResponse(
            assessments=assessments,
            summary=summary,
            model_version="3.0.0"
        )
        
    except Exception as e:
        logger.error(f"Error in batch risk assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in batch risk assessment: {str(e)}")

@app.post("/risk/ecosystem-analysis")
async def analyze_ecosystem_risk(ecosystem: str, dependencies: List[DependencyData]):
    """
    Analyze risk patterns across an entire ecosystem.
    
    - **ecosystem**: The ecosystem to analyze (npm, pypi, maven, nuget)
    - **dependencies**: Dependencies in the ecosystem
    
    Returns ecosystem-wide risk analysis and patterns.
    """
    try:
        logger.info(f"Analyzing ecosystem risk for {ecosystem} with {len(dependencies)} dependencies")
        
        # Filter dependencies by ecosystem
        ecosystem_deps = [dep for dep in dependencies if dep.ecosystem.lower() == ecosystem.lower()]
        
        if not ecosystem_deps:
            raise HTTPException(status_code=400, detail=f"No dependencies found for ecosystem: {ecosystem}")
        
        # Assess all dependencies
        assessments = []
        for dep in ecosystem_deps:
            dependency_dict = dep.dict()
            result = predict_dependency_risk_enhanced(dependency_dict)
            assessments.append(result)
        
        # Analyze patterns
        risk_levels = [a.get('risk_level', 'MEDIUM') for a in assessments]
        risk_scores = [a.get('risk_score', 0.5) for a in assessments]
        
        ecosystem_analysis = {
            'ecosystem': ecosystem,
            'total_dependencies': len(ecosystem_deps),
            'risk_distribution': {
                'high': risk_levels.count('HIGH'),
                'medium': risk_levels.count('MEDIUM'),
                'low': risk_levels.count('LOW')
            },
            'average_risk_score': sum(risk_scores) / len(risk_scores) if risk_scores else 0.0,
            'high_risk_packages': [a['package_name'] for a in assessments if a.get('risk_level') == 'HIGH'],
            'common_risk_factors': _extract_common_risk_factors(assessments),
            'ecosystem_health_score': _calculate_ecosystem_health(assessments)
        }
        
        return ecosystem_analysis
        
    except Exception as e:
        logger.error(f"Error analyzing ecosystem risk: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing ecosystem risk: {str(e)}")

def _extract_common_risk_factors(assessments: List[Dict[str, Any]]) -> List[str]:
    """Extract common risk factors across assessments"""
    all_factors = []
    for assessment in assessments:
        factors = assessment.get('risk_factors', [])
        all_factors.extend(factors)
    
    # Count frequency of each factor
    factor_counts = {}
    for factor in all_factors:
        factor_counts[factor] = factor_counts.get(factor, 0) + 1
    
    # Return most common factors
    sorted_factors = sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)
    return [factor for factor, count in sorted_factors[:5]]

def _calculate_ecosystem_health(assessments: List[Dict[str, Any]]) -> float:
    """Calculate overall ecosystem health score"""
    if not assessments:
        return 0.0
    
    total_score = 0.0
    for assessment in assessments:
        risk_score = assessment.get('risk_score', 0.5)
        # Invert score (lower risk = higher health)
        health_score = 1.0 - risk_score
        total_score += health_score
    
    return total_score / len(assessments)

@app.get("/health")
def health_check():
    """Health check endpoint for service monitoring"""
    return {
        "status": "healthy",
        "service": "enhanced-risk-model",
        "version": "3.0.0",
        "model_type": "pre-trained",
        "features": [
            "AI-powered risk assessment",
            "Pre-trained model integration",
            "Batch processing",
            "Ecosystem analysis"
        ]
    }

@app.get("/")
def root():
    """Root endpoint with service information"""
    return {
        "service": "Enhanced Risk Model Service",
        "version": "3.0.0",
        "description": "AI-powered dependency risk assessment using pre-trained models",
        "endpoints": {
            "single_assessment": "/risk/assess",
            "batch_assessment": "/risk/batch-assess",
            "ecosystem_analysis": "/risk/ecosystem-analysis",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
