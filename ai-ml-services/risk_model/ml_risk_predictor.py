import pandas as pd
import numpy as np
import joblib
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.feature_extraction.text import TfidfVectorizer
import xgboost as xgb
import lightgbm as lgb
from datetime import datetime, timedelta
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DependencyFeatures:
    """Features extracted from dependency data"""
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

@dataclass
class RiskPrediction:
    """Risk prediction result"""
    package_name: str
    risk_score: float
    risk_level: str
    confidence: float
    risk_factors: List[str]
    recommendations: List[str]
    model_version: str

class MLRiskPredictor:
    """Machine Learning-based risk prediction for dependencies"""
    
    def __init__(self, model_path: str = "models/"):
        self.model_path = model_path
        self.models = {}
        self.scalers = {}
        self.label_encoders = {}
        self.feature_names = []
        self.model_version = "1.0.0"
        
        # Ensure model directory exists
        os.makedirs(model_path, exist_ok=True)
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize and load ML models"""
        try:
            # Try to load existing models
            self._load_models()
            logger.info("Existing models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load existing models: {e}")
            logger.info("Training new models...")
            self._train_models()
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        model_files = {
            'random_forest': 'random_forest_model.joblib',
            'gradient_boosting': 'gradient_boosting_model.joblib',
            'xgboost': 'xgboost_model.joblib',
            'lightgbm': 'lightgbm_model.joblib'
        }
        
        scaler_files = {
            'random_forest': 'random_forest_scaler.joblib',
            'gradient_boosting': 'gradient_boosting_scaler.joblib',
            'xgboost': 'xgboost_scaler.joblib',
            'lightgbm': 'lightgbm_scaler.joblib'
        }
        
        for model_name, model_file in model_files.items():
            model_path = os.path.join(self.model_path, model_file)
            scaler_path = os.path.join(self.model_path, scaler_files[model_name])
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.models[model_name] = joblib.load(model_path)
                self.scalers[model_name] = joblib.load(scaler_path)
                logger.info(f"Loaded {model_name} model and scaler")
        
        # Load feature names and label encoders
        feature_path = os.path.join(self.model_path, 'feature_names.json')
        if os.path.exists(feature_path):
            with open(feature_path, 'r') as f:
                self.feature_names = json.load(f)
        
        encoder_path = os.path.join(self.model_path, 'label_encoders.joblib')
        if os.path.exists(encoder_path):
            self.label_encoders = joblib.load(encoder_path)
    
    def _save_models(self):
        """Save trained models to disk"""
        for model_name, model in self.models.items():
            model_path = os.path.join(self.model_path, f'{model_name}_model.joblib')
            scaler_path = os.path.join(self.model_path, f'{model_name}_scaler.joblib')
            
            joblib.dump(model, model_path)
            joblib.dump(self.scalers[model_name], scaler_path)
            logger.info(f"Saved {model_name} model and scaler")
        
        # Save feature names
        feature_path = os.path.join(self.model_path, 'feature_names.json')
        with open(feature_path, 'w') as f:
            json.dump(self.feature_names, f)
        
        # Save label encoders
        encoder_path = os.path.join(self.model_path, 'label_encoders.joblib')
        joblib.dump(self.label_encoders, encoder_path)
    
    def _generate_synthetic_data(self, num_samples: int = 10000) -> Tuple[pd.DataFrame, np.ndarray]:
        """Generate synthetic training data for demonstration"""
        logger.info("Generating synthetic training data...")
        
        np.random.seed(42)
        
        # Generate synthetic dependency features
        data = []
        for i in range(num_samples):
            # Package characteristics
            ecosystem = np.random.choice(['npm', 'pypi', 'maven', 'nuget'], p=[0.4, 0.3, 0.2, 0.1])
            
            # Time-based features
            last_updated_days = np.random.exponential(365)
            outdated_days = np.random.exponential(180)
            
            # Popularity features
            download_count = np.random.poisson(10000) if ecosystem == 'npm' else np.random.poisson(5000)
            star_count = np.random.poisson(100)
            fork_count = np.random.poisson(20)
            issue_count = np.random.poisson(50)
            
            # Activity features
            commit_frequency = np.random.exponential(0.1)
            maintainer_count = np.random.poisson(3)
            
            # Security features
            has_security_policy = np.random.choice([True, False], p=[0.3, 0.7])
            has_code_of_conduct = np.random.choice([True, False], p=[0.4, 0.6])
            has_contributing_guide = np.random.choice([True, False], p=[0.3, 0.7])
            
            # Vulnerability features
            vulnerability_count = np.random.poisson(2)
            transitive_dependencies = np.random.poisson(15)
            dependency_depth = np.random.poisson(3)
            
            # License types
            license_type = np.random.choice(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Other'], 
                                          p=[0.3, 0.2, 0.1, 0.1, 0.3])
            
            data.append({
                'ecosystem': ecosystem,
                'last_updated_days': last_updated_days,
                'outdated_days': outdated_days,
                'download_count': download_count,
                'star_count': star_count,
                'fork_count': fork_count,
                'issue_count': issue_count,
                'commit_frequency': commit_frequency,
                'maintainer_count': maintainer_count,
                'has_security_policy': has_security_policy,
                'has_code_of_conduct': has_code_of_conduct,
                'has_contributing_guide': has_contributing_guide,
                'vulnerability_count': vulnerability_count,
                'transitive_dependencies': transitive_dependencies,
                'dependency_depth': dependency_depth,
                'license_type': license_type
            })
        
        df = pd.DataFrame(data)
        
        # Generate risk labels based on features
        risk_scores = self._calculate_risk_scores(df)
        risk_labels = self._convert_risk_scores_to_labels(risk_scores)
        
        return df, risk_labels
    
    def _calculate_risk_scores(self, df: pd.DataFrame) -> np.ndarray:
        """Calculate risk scores based on feature values"""
        risk_scores = np.zeros(len(df))
        
        # High risk factors
        risk_scores += (df['vulnerability_count'] > 5) * 0.3
        risk_scores += (df['outdated_days'] > 365) * 0.2
        risk_scores += (df['last_updated_days'] > 730) * 0.15
        risk_scores += (df['maintainer_count'] < 2) * 0.1
        risk_scores += (df['has_security_policy'] == False) * 0.1
        risk_scores += (df['commit_frequency'] < 0.01) * 0.1
        risk_scores += (df['dependency_depth'] > 5) * 0.05
        
        # Medium risk factors
        risk_scores += (df['vulnerability_count'] > 2) * 0.1
        risk_scores += (df['outdated_days'] > 180) * 0.1
        risk_scores += (df['star_count'] < 10) * 0.05
        
        # Normalize to 0-1 range
        risk_scores = np.clip(risk_scores, 0, 1)
        
        return risk_scores
    
    def _convert_risk_scores_to_labels(self, risk_scores: np.ndarray) -> np.ndarray:
        """Convert continuous risk scores to categorical labels"""
        labels = np.zeros_like(risk_scores, dtype=int)
        
        # Define risk thresholds
        labels[risk_scores < 0.3] = 0  # Low risk
        labels[(risk_scores >= 0.3) & (risk_scores < 0.6)] = 1  # Medium risk
        labels[risk_scores >= 0.6] = 2  # High risk
        
        return labels
    
    def _extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract and encode features for ML models"""
        # Encode categorical variables
        categorical_features = ['ecosystem', 'license_type']
        numerical_features = ['last_updated_days', 'outdated_days', 'download_count', 'star_count', 
                            'fork_count', 'issue_count', 'commit_frequency', 'maintainer_count',
                            'vulnerability_count', 'transitive_dependencies', 'dependency_depth']
        
        # Encode categorical features
        encoded_features = []
        for feature in categorical_features:
            if feature not in self.label_encoders:
                self.label_encoders[feature] = LabelEncoder()
                self.label_encoders[feature].fit(df[feature].unique())
            
            encoded = self.label_encoders[feature].transform(df[feature])
            encoded_features.append(encoded.reshape(-1, 1))
        
        # Add numerical features
        numerical_data = df[numerical_features].values
        encoded_features.append(numerical_data)
        
        # Add boolean features
        boolean_features = ['has_security_policy', 'has_code_of_conduct', 'has_contributing_guide']
        boolean_data = df[boolean_features].astype(int).values
        encoded_features.append(boolean_data)
        
        # Combine all features
        X = np.hstack(encoded_features)
        
        # Store feature names for later use
        self.feature_names = categorical_features + numerical_features + boolean_features
        
        return X
    
    def _train_models(self):
        """Train multiple ML models"""
        logger.info("Training ML models...")
        
        # Generate training data
        X, y = self._generate_synthetic_data()
        
        # Extract features
        X = self._extract_features(pd.DataFrame(X, columns=self.feature_names))
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Initialize models
        models = {
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
            'xgboost': xgb.XGBClassifier(n_estimators=100, random_state=42),
            'lightgbm': lgb.LGBMClassifier(n_estimators=100, random_state=42)
        }
        
        # Train each model
        for model_name, model in models.items():
            logger.info(f"Training {model_name}...")
            
            # Create and fit scaler
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test_scaled)
            accuracy = model.score(X_test_scaled, y_test)
            
            logger.info(f"{model_name} accuracy: {accuracy:.4f}")
            
            # Store model and scaler
            self.models[model_name] = model
            self.scalers[model_name] = scaler
        
        # Save models
        self._save_models()
        logger.info("All models trained and saved successfully")
    
    def predict_risk(self, dependency_features: DependencyFeatures, model_name: str = 'ensemble') -> RiskPrediction:
        """Predict risk for a dependency"""
        try:
            # Convert dependency features to feature vector
            feature_vector = self._dependency_to_features(dependency_features)
            
            if model_name == 'ensemble':
                # Use ensemble prediction
                predictions = []
                confidences = []
                
                for name, model in self.models.items():
                    if name in self.scalers:
                        scaled_features = self.scalers[name].transform(feature_vector.reshape(1, -1))
                        pred = model.predict_proba(scaled_features)[0]
                        predictions.append(pred)
                        confidences.append(np.max(pred))
                
                # Average predictions
                avg_prediction = np.mean(predictions, axis=0)
                avg_confidence = np.mean(confidences)
                predicted_class = np.argmax(avg_prediction)
                
            else:
                # Use specific model
                if model_name not in self.models or model_name not in self.scalers:
                    raise ValueError(f"Model {model_name} not available")
                
                model = self.models[model_name]
                scaler = self.scalers[model_name]
                
                scaled_features = scaler.transform(feature_vector.reshape(1, -1))
                pred_proba = model.predict_proba(scaled_features)[0]
                predicted_class = np.argmax(pred_proba)
                avg_confidence = np.max(pred_proba)
            
            # Convert class to risk level
            risk_levels = ['LOW', 'MEDIUM', 'HIGH']
            risk_level = risk_levels[predicted_class]
            
            # Calculate risk score (0-1)
            risk_score = predicted_class / 2.0
            
            # Generate risk factors and recommendations
            risk_factors = self._identify_risk_factors(dependency_features)
            recommendations = self._generate_recommendations(dependency_features, risk_level)
            
            return RiskPrediction(
                package_name=dependency_features.package_name,
                risk_score=risk_score,
                risk_level=risk_level,
                confidence=avg_confidence,
                risk_factors=risk_factors,
                recommendations=recommendations,
                model_version=self.model_version
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
                model_version=self.model_version
            )
    
    def _dependency_to_features(self, dep: DependencyFeatures) -> np.ndarray:
        """Convert dependency features to feature vector"""
        # Encode categorical features
        ecosystem_encoded = self.label_encoders.get('ecosystem', LabelEncoder()).transform([dep.ecosystem])[0]
        license_encoded = self.label_encoders.get('license_type', LabelEncoder()).transform([dep.license_type])[0]
        
        # Create feature vector
        features = [
            ecosystem_encoded,
            license_encoded,
            dep.last_updated_days,
            dep.outdated_days,
            dep.download_count or 0,
            dep.star_count or 0,
            dep.fork_count or 0,
            dep.issue_count or 0,
            dep.commit_frequency or 0.0,
            dep.maintainer_count or 0,
            dep.vulnerability_count,
            dep.transitive_dependencies,
            dep.dependency_depth,
            int(dep.has_security_policy),
            int(dep.has_code_of_conduct),
            int(dep.has_contributing_guide)
        ]
        
        return np.array(features)
    
    def _identify_risk_factors(self, dep: DependencyFeatures) -> List[str]:
        """Identify specific risk factors for a dependency"""
        risk_factors = []
        
        if dep.vulnerability_count > 0:
            risk_factors.append(f"Has {dep.vulnerability_count} known vulnerabilities")
        
        if dep.outdated_days > 365:
            risk_factors.append(f"Package is {dep.outdated_days} days outdated")
        
        if dep.last_updated_days > 730:
            risk_factors.append(f"Package hasn't been updated in {dep.last_updated_days} days")
        
        if dep.maintainer_count < 2:
            risk_factors.append("Limited number of maintainers")
        
        if not dep.has_security_policy:
            risk_factors.append("No security policy defined")
        
        if dep.dependency_depth > 5:
            risk_factors.append(f"Deep dependency chain ({dep.dependency_depth} levels)")
        
        if dep.transitive_dependencies > 50:
            risk_factors.append(f"Large number of transitive dependencies ({dep.transitive_dependencies})")
        
        return risk_factors
    
    def _generate_recommendations(self, dep: DependencyFeatures, risk_level: str) -> List[str]:
        """Generate recommendations based on risk level and features"""
        recommendations = []
        
        if risk_level == 'HIGH':
            recommendations.append("Consider replacing this dependency with a more secure alternative")
            recommendations.append("Implement additional security monitoring")
        
        if dep.vulnerability_count > 0:
            recommendations.append("Update to latest version to fix known vulnerabilities")
        
        if dep.outdated_days > 180:
            recommendations.append("Update to latest version for security patches")
        
        if not dep.has_security_policy:
            recommendations.append("Contact maintainers to request security policy")
        
        if dep.dependency_depth > 3:
            recommendations.append("Consider flattening dependency tree")
        
        if dep.maintainer_count < 2:
            recommendations.append("Monitor for maintenance activity")
        
        return recommendations
    
    def get_model_performance(self) -> Dict[str, Any]:
        """Get performance metrics for all models"""
        if not self.models:
            return {"error": "No models available"}
        
        performance = {}
        
        for model_name, model in self.models.items():
            try:
                # Generate test data
                X, y = self._generate_synthetic_data(1000)
                X = self._extract_features(pd.DataFrame(X, columns=self.feature_names))
                
                # Split data
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                
                # Scale features
                scaler = self.scalers[model_name]
                X_test_scaled = scaler.transform(X_test)
                
                # Make predictions
                y_pred = model.predict(X_test_scaled)
                y_pred_proba = model.predict_proba(X_test_scaled)
                
                # Calculate metrics
                accuracy = model.score(X_test_scaled, y_test)
                auc = roc_auc_score(y_test, y_pred_proba, multi_class='ovr')
                
                performance[model_name] = {
                    'accuracy': accuracy,
                    'auc': auc,
                    'classification_report': classification_report(y_test, y_pred, output_dict=True)
                }
                
            except Exception as e:
                performance[model_name] = {"error": str(e)}
        
        return performance

# Global instance
risk_predictor = MLRiskPredictor()

def predict_dependency_risk(dependency_data: Dict[str, Any]) -> Dict[str, Any]:
    """Main function for risk prediction"""
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
            dependency_depth=dependency_data.get('dependency_depth', 0)
        )
        
        # Predict risk
        prediction = risk_predictor.predict_risk(dep)
        
        # Convert to dictionary
        return {
            'package_name': prediction.package_name,
            'risk_score': prediction.risk_score,
            'risk_level': prediction.risk_level,
            'confidence': prediction.confidence,
            'risk_factors': prediction.risk_factors,
            'recommendations': prediction.recommendations,
            'model_version': prediction.model_version
        }
        
    except Exception as e:
        logger.error(f"Error in dependency risk prediction: {e}")
        return {
            'error': str(e),
            'package_name': dependency_data.get('package_name', 'unknown'),
            'risk_score': 0.5,
            'risk_level': 'MEDIUM',
            'confidence': 0.0
        }
