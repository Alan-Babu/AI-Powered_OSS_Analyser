package com.ossrisk.oss.service;

import com.ossrisk.oss.model.RiskReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
public class NlpClient {
    
    private final RestTemplate restTemplate;
    
    public NlpClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    @Value("${ai-ml.services.nlp-explainer.url:http://localhost:8002}")
    private String nlpExplainerUrl;
    
    @Value("${ai-ml.services.chat.url:http://localhost:8000}")
    private String chatUrl;
    
    public RiskReport addAIInsights(RiskReport report) {
        try {
            // Add AI insights to vulnerabilities
            if (report.getDependencies() != null) {
                for (var dependency : report.getDependencies()) {
                    if (dependency.getVulnerabilities() != null) {
                        for (var vulnerability : dependency.getVulnerabilities()) {
                            // Get NLP explanation for vulnerability
                            Map<String, String> request = new HashMap<>();
                            request.put("text", vulnerability.getDescription());
                            
                            try {
                                Map<String, Object> nlpResult = restTemplate.postForObject(
                                    nlpExplainerUrl + "/explain",
                                    request,
                                    Map.class
                                );
                                
                                if (nlpResult != null && nlpResult.containsKey("remediation")) {
                                    vulnerability.setRemediation(nlpResult.get("remediation").toString());
                                }
                            } catch (Exception e) {
                                System.err.println("Error getting NLP insights for vulnerability: " + e.getMessage());
                            }
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error adding AI insights: " + e.getMessage());
        }
        
        return report;
    }
    
    public String chatWithAI(String message) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("message", message);
            
            Map<String, Object> response = restTemplate.postForObject(
                chatUrl + "/chat",
                request,
                Map.class
            );
            
            if (response != null && response.containsKey("response")) {
                return response.get("response").toString();
            }
            
        } catch (Exception e) {
            System.err.println("Error in chat with AI: " + e.getMessage());
        }
        
        return "Sorry, I'm unable to process your request at the moment.";
    }
    
    public String getFixVersion(String description) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("text", description);
            request.put("type", "fix_version");
            
            Map<String, Object> response = restTemplate.postForObject(
                nlpExplainerUrl + "/extract",
                request,
                Map.class
            );
            
            if (response != null && response.containsKey("fix_version")) {
                return response.get("fix_version").toString();
            }
            
        } catch (Exception e) {
            System.err.println("Error extracting fix version: " + e.getMessage());
        }
        
        return "Unknown";
    }
    
    public String getRemediation(String description) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("text", description);
            request.put("type", "remediation");
            
            Map<String, Object> response = restTemplate.postForObject(
                nlpExplainerUrl + "/extract",
                request,
                Map.class
            );
            
            if (response != null && response.containsKey("remediation")) {
                return response.get("remediation").toString();
            }
            
        } catch (Exception e) {
            System.err.println("Error extracting remediation: " + e.getMessage());
        }
        
        return "No remediation information available.";
    }
}
