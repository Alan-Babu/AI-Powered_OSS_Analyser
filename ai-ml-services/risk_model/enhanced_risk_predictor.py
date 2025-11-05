import pandas as pd
import numpy as np
import joblib
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from transformers import pipeline
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from functools import lru_cache

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DependencyFeatures:
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
    package_name: str
    risk_score: float
    risk_level: str
    confidence: float
    risk_factors: List[str]
    recommendations: List[str]
    model_version: str
    ai_insights: Dict[str, Any]


class EnhancedRiskPredictor:
    """Optimized enhanced ML-based risk prediction with lazy model loading."""

    def __init__(self):
        self.model_version = "3.1.0"
        self.nlp_pipeline = None
        self.risk_classifier = None
        self.hf_token = os.getenv("HF_TOKEN")
        self.fast_mode = os.getenv("FAST_MODE", "False").lower() == "true"

    # ----------------------------
    # Lazy model loading functions
    # ----------------------------
    def _load_nlp_pipeline(self):
        """Lazy load NLP pipeline for description analysis."""
        if not self.nlp_pipeline:
            try:
                self.nlp_pipeline = pipeline(
                    "text-classification",
                    model="distilbert-base-uncased",
                    device=-1,
                    return_all_scores=True
                )
                logger.info("NLP pipeline loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load NLP pipeline: {e}")
                self.nlp_pipeline = None

    def _load_risk_classifier(self):
        """Lazy load classifier for risk level prediction."""
        if not self.risk_classifier:
            try:
                self.risk_classifier = pipeline(
                    "text-classification",
                    model="facebook/bart-large-mnli",
                    device=-1,
                    return_all_scores=True
                )
                logger.info("Risk classifier model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load risk classifier: {e}")
                self.risk_classifier = None

    # ----------------------------
    # Core risk prediction
    # ----------------------------
    def predict_risk(self, dep: DependencyFeatures) -> RiskPrediction:
        """Predict dependency risk efficiently with optional AI."""
        try:
            # Quick short-circuit for fast mode
            if self.fast_mode:
                return self._fast_rule_based_prediction(dep)

            risk_score = self._calculate_risk_score(dep)
            risk_level = self._classify_risk_level(dep, risk_score)
            confidence = self._calculate_confidence(dep)
            risk_factors = self._identify_enhanced_risk_factors(dep)
            recommendations = self._generate_enhanced_recommendations(dep, risk_level)
            ai_insights = self._generate_ai_insights(dep)

            return RiskPrediction(
                package_name=dep.package_name,
                risk_score=risk_score,
                risk_level=risk_level,
                confidence=confidence,
                risk_factors=risk_factors,
                recommendations=recommendations,
                model_version=self.model_version,
                ai_insights=ai_insights
            )
        except Exception as e:
            logger.error(f"Error in prediction: {e}")
            return RiskPrediction(
                package_name=dep.package_name,
                risk_score=0.5,
                risk_level="MEDIUM",
                confidence=0.0,
                risk_factors=["Prediction failed"],
                recommendations=["Unable to generate recommendations"],
                model_version=self.model_version,
                ai_insights={"error": str(e)}
            )

    def _fast_rule_based_prediction(self, dep: DependencyFeatures) -> RiskPrediction:
        """Skip NLP models for faster prediction."""
        score = self._calculate_risk_score(dep)
        level = "HIGH" if score >= 0.6 else "MEDIUM" if score >= 0.3 else "LOW"
        return RiskPrediction(
            package_name=dep.package_name,
            risk_score=score,
            risk_level=level,
            confidence=0.8,
            risk_factors=self._identify_enhanced_risk_factors(dep),
            recommendations=self._generate_enhanced_recommendations(dep, level),
            model_version=self.model_version,
            ai_insights={"mode": "FAST_RULE_ONLY"}
        )

    # ----------------------------
    # Helper methods
    # ----------------------------
    def _calculate_risk_score(self, dep: DependencyFeatures) -> float:
        score = 0.0
        if dep.vulnerability_count > 5:
            score += 0.3
        elif dep.vulnerability_count > 0:
            score += 0.15 * dep.vulnerability_count
        if dep.outdated_days > 365:
            score += 0.2
        elif dep.outdated_days > 180:
            score += 0.1
        if dep.last_updated_days > 730:
            score += 0.15
        elif dep.last_updated_days > 365:
            score += 0.1
        if dep.maintainer_count and dep.maintainer_count < 2:
            score += 0.1
        if not dep.has_security_policy:
            score += 0.1
        if dep.commit_frequency and dep.commit_frequency < 0.01:
            score += 0.1
        if dep.dependency_depth > 5:
            score += 0.05
        if dep.star_count and dep.star_count < 10:
            score += 0.05
        if dep.transitive_dependencies > 50:
            score += 0.05
        if dep.issue_count and dep.issue_count > 100:
            score += 0.03
        if dep.license_type == "Other":
            score += 0.02
        return min(score, 1.0)

    def _classify_risk_level(self, dep: DependencyFeatures, score: float) -> str:
        try:
            # Load classifier only if description exists
            if dep.description:
                self._load_risk_classifier()
                if self.risk_classifier:
                    text = f"{dep.package_name} risk analysis with {dep.vulnerability_count} vulnerabilities"
                    result = self.risk_classifier(text[:512])
                    if result:
                        best = max(result[0], key=lambda x: x["score"])
                        conf = best["score"]
                        if conf > 0.7:
                            return "HIGH" if score > 0.6 else "MEDIUM" if score > 0.3 else "LOW"
        except Exception as e:
            logger.warning(f"Risk classifier failed: {e}")
        return "HIGH" if score >= 0.6 else "MEDIUM" if score >= 0.3 else "LOW"

    def _calculate_confidence(self, dep: DependencyFeatures) -> float:
        conf = 0.5
        for attr in [dep.description, dep.star_count, dep.maintainer_count, dep.commit_frequency, dep.homepage]:
            if attr:
                conf += 0.1
        return min(conf, 1.0)

    def _identify_enhanced_risk_factors(self, dep: DependencyFeatures) -> List[str]:
        f = []
        if dep.vulnerability_count > 0:
            f.append(f"Has {dep.vulnerability_count} vulnerabilities")
        if dep.outdated_days > 365:
            f.append(f"Outdated by {dep.outdated_days} days")
        if dep.last_updated_days > 730:
            f.append(f"Inactive ({dep.last_updated_days} days since update)")
        if dep.maintainer_count and dep.maintainer_count < 2:
            f.append("Few maintainers")
        if not dep.has_security_policy:
            f.append("No security policy")
        if dep.dependency_depth > 5:
            f.append(f"Deep dependency tree ({dep.dependency_depth})")
        if dep.transitive_dependencies > 50:
            f.append(f"Too many transitive deps ({dep.transitive_dependencies})")
        return f

    def _generate_enhanced_recommendations(self, dep: DependencyFeatures, level: str) -> List[str]:
        r = []
        if level == "HIGH":
            r.append("Replace with more secure dependency")
            r.append("Enable automated patch monitoring")
        if dep.vulnerability_count > 0:
            r.append("Update to latest version to fix known vulnerabilities")
        if dep.outdated_days > 180:
            r.append("Schedule dependency updates")
        if not dep.has_security_policy:
            r.append("Request maintainers to define a security policy")
        return r

    def _generate_ai_insights(self, dep: DependencyFeatures) -> Dict[str, Any]:
        insights = {}
        try:
            if dep.description:
                self._load_nlp_pipeline()
                if self.nlp_pipeline:
                    result = self.nlp_pipeline(dep.description[:512])
                    insights["description_analysis"] = result
            insights["contextual_analysis"] = {
                "ecosystem_health": self._assess_ecosystem_health(dep.ecosystem),
                "maintenance_activity": self._assess_maintenance_activity(dep),
                "security_posture": self._assess_security_posture(dep)
            }
        except Exception as e:
            insights["error"] = str(e)
        return insights

    def _assess_ecosystem_health(self, ecosystem: str) -> str:
        return {"npm": "good", "pypi": "good", "maven": "good", "nuget": "good"}.get(ecosystem, "unknown")

    def _assess_maintenance_activity(self, dep: DependencyFeatures) -> str:
        return "very_active" if dep.last_updated_days < 30 else "active" if dep.last_updated_days < 90 else "moderate" if dep.last_updated_days < 365 else "inactive"

    def _assess_security_posture(self, dep: DependencyFeatures) -> str:
        if dep.has_security_policy and dep.vulnerability_count == 0:
            return "excellent"
        elif dep.has_security_policy or dep.vulnerability_count == 0:
            return "good"
        elif dep.vulnerability_count < 3:
            return "moderate"
        return "poor"


# Global predictor instance
enhanced_risk_predictor = EnhancedRiskPredictor()

def predict_dependency_risk_enhanced(dependency_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced main prediction interface."""
    try:
        dep = DependencyFeatures(**{**dependency_data})
        pred = enhanced_risk_predictor.predict_risk(dep)
        return {
            "package_name": pred.package_name,
            "risk_score": pred.risk_score,
            "risk_level": pred.risk_level,
            "confidence": pred.confidence,
            "risk_factors": pred.risk_factors,
            "recommendations": pred.recommendations,
            "model_version": pred.model_version,
            "ai_insights": pred.ai_insights
        }
    except Exception as e:
        logger.error(f"Enhanced risk prediction failed: {e}")
        return {"error": str(e), "package_name": dependency_data.get("package_name", "unknown")}
