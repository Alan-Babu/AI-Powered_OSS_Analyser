package com.ossrisk.oss.service;

import com.ossrisk.oss.model.RiskReport;
import com.ossrisk.oss.model.Dependency;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class EnhancedRiskScorerService {
    
    private final RestTemplate restTemplate;
    
    public EnhancedRiskScorerService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    @Value("${ai-ml.services.risk-model.url:http://localhost:8003}")
    private String riskModelUrl;
    
    public RiskReport enhanceRiskAssessment(RiskReport report) {
        try {
            // Enhance each dependency with AI risk prediction
            List<Dependency> enhancedDependencies = report.getDependencies();
            if (enhancedDependencies != null) {
                for (Dependency dep : enhancedDependencies) {
                    Map<String, Object> dependencyData = new HashMap<>();
                    dependencyData.put("package_name", dep.getName());
                    dependencyData.put("version", dep.getVersion());
                    dependencyData.put("ecosystem", dep.getEcosystem());
                    dependencyData.put("vulnerability_count", dep.getVulnerabilities() != null ? dep.getVulnerabilities().size() : 0);
                    dependencyData.put("outdated", dep.isOutdated());
                    dependencyData.put("vulnerable", dep.isVulnerable());
                    
                    // Call AI service for risk prediction
                    try {
                        Map<String, Object> prediction = restTemplate.postForObject(
                            riskModelUrl + "/predict", 
                            dependencyData, 
                            Map.class
                        );
                        
                        if (prediction != null) {
                            // Update dependency with AI insights
                            if (prediction.containsKey("risk_score")) {
                                dep.setRiskScore(((Number) prediction.get("risk_score")).doubleValue());
                            }
                            if (prediction.containsKey("risk_level")) {
                                dep.setRiskLevel(prediction.get("risk_level").toString());
                            }
                            if (prediction.containsKey("recommendations")) {
                                List<String> recommendations = (List<String>) prediction.get("recommendations");
                                dep.setRecommendations(recommendations);
                            }
                        }
                    } catch (Exception e) {
                        // Log error but continue with other dependencies
                        System.err.println("Error enhancing dependency " + dep.getName() + ": " + e.getMessage());
                    }
                }
            }
            
            // Recalculate overall risk score
            double enhancedRiskScore = calculateEnhancedRiskScore(enhancedDependencies);
            report.setRiskScore(enhancedRiskScore);
            
        } catch (Exception e) {
            System.err.println("Error enhancing risk assessment: " + e.getMessage());
        }
        
        return report;
    }
    
    private double calculateEnhancedRiskScore(List<Dependency> dependencies) {
        if (dependencies == null || dependencies.isEmpty()) {
            return 0.0;
        }
        
        double totalRisk = 0.0;
        int dependencyCount = 0;
        
        for (Dependency dep : dependencies) {
            double dependencyRisk = dep.getRiskScore() != null ? dep.getRiskScore() : 0.0;
            
            // Add risk based on vulnerabilities
            if (dep.getVulnerabilities() != null) {
                dependencyRisk += dep.getVulnerabilities().size() * 0.5;
            }
            
            // Add risk based on outdated status
            if (dep.isOutdated()) {
                dependencyRisk += 0.3;
            }
            
            // Add risk based on vulnerable status
            if (dep.isVulnerable()) {
                dependencyRisk += 0.5;
            }
            
            totalRisk += Math.min(dependencyRisk, 10.0); // Cap at 10.0
            dependencyCount++;
        }
        
        return dependencyCount > 0 ? totalRisk / dependencyCount : 0.0;
    }
}
