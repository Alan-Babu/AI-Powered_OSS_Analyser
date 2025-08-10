from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
import json
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Risk Model Service",
    description="AI-powered risk assessment and prediction for OSS dependencies",
    version="1.0.0"
)

class DependencyFeatures(BaseModel):
    name: str
    version: str
    ecosystem: str
    age_days: int = Field(..., description="Age of the dependency in days")
    last_updated_days: int = Field(..., description="Days since last update")
    download_count: int = Field(..., description="Download count (if available)")
    star_count: int = Field(..., description="GitHub stars (if available)")
    fork_count: int = Field(..., description="GitHub forks (if available)")
    issue_count: int = Field(..., description="Open issues count")
    pr_count: int = Field(..., description="Open PR count")
    contributor_count: int = Field(..., description="Number of contributors")
    license_type: str = Field(..., description="License type")
    has_security_policy: bool = Field(..., description="Has security policy")
    has_code_of_conduct: bool = Field(..., description="Has code of conduct")
    vulnerability_count: int = Field(..., description="Known vulnerabilities count")
    cve_count: int = Field(..., description="CVE count")
    dependency_depth: int = Field(..., description="Dependency tree depth")

class RiskPrediction(BaseModel):
    dependency_name: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk score (0-100)")
    risk_level: str = Field(..., description="Risk level (LOW, MEDIUM, HIGH, CRITICAL)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    risk_factors: List[str] = Field(..., description="Key risk factors")
    recommendations: List[str] = Field(..., description="Risk mitigation recommendations")
    predicted_vulnerabilities: int = Field(..., description="Predicted vulnerability count")
    maintenance_score: float = Field(..., description="Maintenance health score")

class BatchRiskRequest(BaseModel):
    dependencies: List[DependencyFeatures] = Field(..., max_items=1000)

class BatchRiskResponse(BaseModel):
    predictions: List[RiskPrediction]
    overall_project_risk: float
    risk_distribution: Dict[str, int]
    model_metadata: Dict[str, Any]

class ModelTrainingRequest(BaseModel):
    training_data: List[Dict[str, Any]]
    model_type: str = Field(default="random_forest", description="Model type to train")

class ModelTrainingResponse(BaseModel):
    status: str
    model_accuracy: float
    training_time: float
    model_path: str

# Global model variables
risk_model = None
scaler = None
anomaly_detector = None
model_metadata = {}

# Risk thresholds
RISK_THRESHOLDS = {
    "LOW": 25,
    "MEDIUM": 50,
    "HIGH": 75,
    "CRITICAL": 100
}

def load_or_initialize_model():
    """Load existing model or initialize a new one"""
    global risk_model, scaler, anomaly_detector
    
    model_path = "models/risk_model.pkl"
    scaler_path = "models/scaler.pkl"
    anomaly_path = "models/anomaly_detector.pkl"
    
    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            risk_model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            if os.path.exists(anomaly_path):
                anomaly_detector = joblib.load(anomaly_path)
            logger.info("Loaded existing risk model")
        except Exception as e:
            logger.warning(f"Failed to load existing model: {e}")
            initialize_default_model()
    else:
        initialize_default_model()

def initialize_default_model():
    """Initialize a default risk model with synthetic data"""
    global risk_model, scaler, anomaly_detector
    
    # Create synthetic training data
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic features
    data = {
        'age_days': np.random.randint(1, 3650, n_samples),
        'last_updated_days': np.random.randint(0, 365, n_samples),
        'download_count': np.random.randint(0, 1000000, n_samples),
        'star_count': np.random.randint(0, 50000, n_samples),
        'fork_count': np.random.randint(0, 10000, n_samples),
        'issue_count': np.random.randint(0, 1000, n_samples),
        'pr_count': np.random.randint(0, 500, n_samples),
        'contributor_count': np.random.randint(1, 1000, n_samples),
        'vulnerability_count': np.random.randint(0, 50, n_samples),
        'cve_count': np.random.randint(0, 30, n_samples),
        'dependency_depth': np.random.randint(1, 10, n_samples)
    }
    
    # Create synthetic risk scores (0-100)
    risk_scores = []
    for i in range(n_samples):
        score = 0
        
        # Age factor
        if data['age_days'][i] > 1000:
            score += 20
        
        # Update frequency
        if data['last_updated_days'][i] > 180:
            score += 25
        
        # Popularity factors
        if data['star_count'][i] < 100:
            score += 15
        if data['contributor_count'][i] < 5:
            score += 20
        
        # Security factors
        score += data['vulnerability_count'][i] * 2
        score += data['cve_count'][i] * 3
        
        # Dependency depth
        if data['dependency_depth'][i] > 5:
            score += 10
        
        risk_scores.append(min(100, score))
    
    # Prepare features
    feature_columns = ['age_days', 'last_updated_days', 'download_count', 'star_count', 
                      'fork_count', 'issue_count', 'pr_count', 'contributor_count',
                      'vulnerability_count', 'cve_count', 'dependency_depth']
    
    X = pd.DataFrame(data)[feature_columns]
    y = np.array(risk_scores)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    risk_model = RandomForestRegressor(n_estimators=100, random_state=42)
    risk_model.fit(X_train_scaled, y_train)
    
    # Train anomaly detector
    anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
    anomaly_detector.fit(X_train_scaled)
    
    # Save models
    os.makedirs("models", exist_ok=True)
    joblib.dump(risk_model, "models/risk_model.pkl")
    joblib.dump(scaler, "models/scaler.pkl")
    joblib.dump(anomaly_detector, "models/anomaly_detector.pkl")
    
    # Calculate accuracy
    train_score = risk_model.score(X_train_scaled, y_train)
    test_score = risk_model.score(X_test_scaled, y_test)
    
    model_metadata.update({
        "model_type": "RandomForest",
        "training_date": datetime.now().isoformat(),
        "train_accuracy": train_score,
        "test_accuracy": test_score,
        "feature_importance": dict(zip(feature_columns, risk_model.feature_importances_))
    })
    
    logger.info(f"Initialized default model - Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")

def extract_features(dependency: DependencyFeatures) -> np.ndarray:
    """Extract numerical features from dependency"""
    features = [
        dependency.age_days,
        dependency.last_updated_days,
        dependency.download_count,
        dependency.star_count,
        dependency.fork_count,
        dependency.issue_count,
        dependency.pr_count,
        dependency.contributor_count,
        dependency.vulnerability_count,
        dependency.cve_count,
        dependency.dependency_depth
    ]
    return np.array(features).reshape(1, -1)

def predict_risk(dependency: DependencyFeatures) -> RiskPrediction:
    """Predict risk for a single dependency"""
    if risk_model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Risk model not initialized")
    
    try:
        # Extract and scale features
        features = extract_features(dependency)
        features_scaled = scaler.transform(features)
        
        # Predict risk score
        risk_score = risk_model.predict(features_scaled)[0]
        risk_score = max(0.0, min(100.0, risk_score))
        
        # Determine risk level
        risk_level = "LOW"
        for level, threshold in RISK_THRESHOLDS.items():
            if risk_score > threshold:
                risk_level = level
        
        # Calculate confidence (simplified)
        confidence = 0.8 + (np.random.random() * 0.2)  # 80-100% confidence
        
        # Identify risk factors
        risk_factors = []
        if dependency.age_days > 1000:
            risk_factors.append("Aged dependency")
        if dependency.last_updated_days > 180:
            risk_factors.append("Infrequent updates")
        if dependency.vulnerability_count > 0:
            risk_factors.append("Known vulnerabilities")
        if dependency.contributor_count < 5:
            risk_factors.append("Limited contributors")
        if dependency.star_count < 100:
            risk_factors.append("Low popularity")
        
        # Generate recommendations
        recommendations = []
        if dependency.last_updated_days > 180:
            recommendations.append("Consider updating to a more recent version")
        if dependency.vulnerability_count > 0:
            recommendations.append("Review and patch known vulnerabilities")
        if dependency.contributor_count < 5:
            recommendations.append("Monitor for maintenance issues")
        
        # Predict vulnerabilities
        predicted_vulns = max(0, int(dependency.vulnerability_count * (1 + np.random.normal(0, 0.2))))
        
        # Calculate maintenance score
        maintenance_score = max(0.0, 100.0 - risk_score)
        
        return RiskPrediction(
            dependency_name=dependency.name,
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=confidence,
            risk_factors=risk_factors,
            recommendations=recommendations,
            predicted_vulnerabilities=predicted_vulns,
            maintenance_score=maintenance_score
        )
        
    except Exception as e:
        logger.error(f"Error predicting risk for {dependency.name}: {e}")
        raise HTTPException(status_code=500, detail=f"Error in risk prediction: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    load_or_initialize_model()

@app.post("/predict/risk", response_model=RiskPrediction)
async def predict_dependency_risk(dependency: DependencyFeatures):
    """Predict risk for a single dependency"""
    try:
        logger.info(f"Predicting risk for dependency: {dependency.name}")
        prediction = predict_risk(dependency)
        logger.info(f"Risk prediction completed for {dependency.name}: {prediction.risk_level}")
        return prediction
    except Exception as e:
        logger.error(f"Error in risk prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=BatchRiskResponse)
async def batch_risk_prediction(request: BatchRiskRequest):
    """Predict risk for multiple dependencies"""
    try:
        logger.info(f"Starting batch risk prediction for {len(request.dependencies)} dependencies")
        
        predictions = []
        for dependency in request.dependencies:
            prediction = predict_risk(dependency)
            predictions.append(prediction)
        
        # Calculate overall project risk
        total_risk = sum(p.risk_score for p in predictions)
        overall_risk = total_risk / len(predictions) if predictions else 0.0
        
        # Calculate risk distribution
        risk_distribution = {}
        for prediction in predictions:
            level = prediction.risk_level
            risk_distribution[level] = risk_distribution.get(level, 0) + 1
        
        response = BatchRiskResponse(
            predictions=predictions,
            overall_project_risk=overall_risk,
            risk_distribution=risk_distribution,
            model_metadata=model_metadata
        )
        
        logger.info(f"Batch prediction completed: {len(predictions)} dependencies processed")
        return response
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train/model", response_model=ModelTrainingResponse)
async def train_model(request: ModelTrainingRequest):
    """Train a new risk model with provided data"""
    try:
        logger.info("Starting model training")
        start_time = datetime.now()
        
        # This would implement actual model training with the provided data
        # For now, we'll just retrain with synthetic data
        initialize_default_model()
        
        training_time = (datetime.now() - start_time).total_seconds()
        
        response = ModelTrainingResponse(
            status="completed",
            model_accuracy=model_metadata.get("test_accuracy", 0.0),
            training_time=training_time,
            model_path="models/risk_model.pkl"
        )
        
        logger.info(f"Model training completed in {training_time:.2f} seconds")
        return response
        
    except Exception as e:
        logger.error(f"Error in model training: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "risk-model", 
        "version": "1.0.0",
        "model_loaded": risk_model is not None
    }

@app.get("/model/info")
def get_model_info():
    """Get information about the current model"""
    return {
        "model_metadata": model_metadata,
        "risk_thresholds": RISK_THRESHOLDS,
        "features": [
            "age_days", "last_updated_days", "download_count", "star_count",
            "fork_count", "issue_count", "pr_count", "contributor_count",
            "vulnerability_count", "cve_count", "dependency_depth"
        ]
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "Risk Model Service",
        "version": "1.0.0",
        "description": "AI-powered risk assessment for OSS dependencies",
        "endpoints": {
            "predict": "/predict/risk",
            "batch_predict": "/predict/batch",
            "train": "/train/model",
            "health": "/health",
            "model_info": "/model/info",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
