package com.ossrisk.oss.service;

import com.ossrisk.oss.model.Dependency;
import com.ossrisk.oss.model.RepositoryMetadata;
import com.ossrisk.oss.model.RiskReport;
import com.ossrisk.oss.model.Vulnerability;
import com.ossrisk.oss.repository.RepositoryMetadataRepository;
import com.ossrisk.oss.repository.RiskReportRepository;
import com.ossrisk.oss.utility.GitCloner;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class GitHubService {
    private final EnhancedDependencyAnalyzerService dependencyAnalyzer;
    private final VulnerabilityCheckerService vulnerabilityChecker;
    private final EnhancedRiskScorerService riskScorer;
    private final RepositoryMetadataRepository metadataRepo;
    private final RiskReportRepository riskReportRepo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GitHubService(
            EnhancedDependencyAnalyzerService dependencyAnalyzer,
            VulnerabilityCheckerService vulnerabilityChecker,
            EnhancedRiskScorerService riskScorer,
            RepositoryMetadataRepository metadataRepo,
            RiskReportRepository riskReportRepo,
            RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.dependencyAnalyzer = dependencyAnalyzer;
        this.vulnerabilityChecker = vulnerabilityChecker;
        this.riskScorer = riskScorer;
        this.metadataRepo = metadataRepo;
        this.riskReportRepo = riskReportRepo;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public RiskReport processRepository(String repoUrl) {
        File repoDir = null;
        try {
            // Clone repository
            repoDir = GitCloner.cloneRepo(repoUrl);
            
            // Extract repository info
            String[] parts = repoUrl.replace("https://github.com/", "").split("/");
            String owner = parts[0];
            String project = parts[1];

            // Check vulnerabilities
            List<Dependency> deps = dependencyAnalyzer.analyze(repoDir);
            List<Dependency> checkedDeps = vulnerabilityChecker.check(deps);

            int totalVulns = checkedDeps.stream()
                    .mapToInt(d -> d.getVulnerabilities() != null ? d.getVulnerabilities().size() : 0)
                    .sum();
            RepositoryMetadata repoMeta = new RepositoryMetadata();
            repoMeta.setRepoUrl(repoUrl);
            repoMeta.setOwner(owner);
            repoMeta.setProjectName(project);
            repoMeta.setVulnerabilityCount(totalVulns);
            metadataRepo.save(repoMeta);

            
            // Calculate risk score using enhanced risk scorer
            double score = calculateRiskScore(checkedDeps);
            
            // Create and save risk report
            RiskReport report = new RiskReport();
            report.setRepoUrl(repoUrl);
            report.setRiskScore(score);
            report.setTotalVulnerabilities(totalVulns);

            for (Dependency dep : checkedDeps) {
                dep.setReport(report);
                for (Vulnerability vuln : dep.getVulnerabilities()) {
                    vuln.setDependency(dep);
                }
            }
            report.setDependencies(checkedDeps);

            return riskReportRepo.save(report);
            
        } catch (Exception e) {
            System.err.println("Error processing repository: " + e.getMessage());
            e.printStackTrace();
            
            // Return error report
            RiskReport errorReport = new RiskReport();
            errorReport.setRepoUrl(repoUrl);
            errorReport.setRiskScore(0.0);
            return errorReport;
        } finally {
            if (repoDir != null && repoDir.exists()) {
                try {
                    FileUtils.deleteDirectory(repoDir); // or your deleteDirectoryRecursively()
                    System.out.println("✅ Deleted cloned repository: " + repoDir.getAbsolutePath());
                } catch (IOException e) {
                    System.err.println("⚠️ Failed to delete repo: " + e.getMessage());
                }
            }
        }
    }

    public RiskReport processRepositoryWithAI(String repoUrl) {
        try {
            // Process repository normally first
            RiskReport report = processRepository(repoUrl);
            
            // Enhance with AI services
            report = enhanceWithAIServices(report);
            
            return report;
            
        } catch (Exception e) {
            System.err.println("Error processing repository with AI: " + e.getMessage());
            e.printStackTrace();
            
            // Return error report
            RiskReport errorReport = new RiskReport();
            errorReport.setRepoUrl(repoUrl);
            errorReport.setRiskScore(0.0);
            return errorReport;
        }
    }

    private RiskReport enhanceWithAIServices(RiskReport report) {
        try {
            // Enhance with AI risk model
            if (report.getDependencies() != null && !report.getDependencies().isEmpty()) {
                List<Dependency> enhancedDeps = new ArrayList<>();
                
                for (Dependency dep : report.getDependencies()) {
                    // Convert to AI service format
                    Map<String, Object> dependencyData = convertDependencyToAIFormat(dep);
                    
                    // Call AI risk model service
                    Map<String, Object> aiRiskAssessment = callAIRiskModel(dependencyData);
                    
                    // Update dependency with AI insights
                    Dependency enhancedDep = enhanceDependencyWithAI(dep, aiRiskAssessment);
                    enhancedDeps.add(enhancedDep);
                }
                
                report.setDependencies(enhancedDeps);
                
                // Recalculate overall risk score
                double enhancedScore = calculateRiskScore(enhancedDeps);
                report.setRiskScore(enhancedScore);
            }
            
        } catch (Exception e) {
            System.err.println("Error enhancing with AI services: " + e.getMessage());
        }
        
        return report;
    }

    private Map<String, Object> convertDependencyToAIFormat(Dependency dep) {
        Map<String, Object> data = new HashMap<>();
        data.put("package_name", dep.getName());
        data.put("version", dep.getVersion());
        data.put("ecosystem", dep.getEcosystem());
        data.put("last_updated_days", calculateDaysSinceUpdate(dep.getLastUpdated()));
        data.put("download_count", dep.getDownloadCount());
        data.put("star_count", dep.getStarCount());
        data.put("fork_count", dep.getForkCount());
        data.put("issue_count", dep.getIssueCount());
        data.put("maintainer_count", dep.getMaintainerCount());
        data.put("license_type", dep.getLicenseType() != null ? dep.getLicenseType() : "Unknown");
        data.put("has_security_policy", dep.getHasSecurityPolicy() != null ? dep.getHasSecurityPolicy() : false);
        data.put("has_code_of_conduct", dep.getHasCodeOfConduct() != null ? dep.getHasCodeOfConduct() : false);
        data.put("has_contributing_guide", dep.getHasContributingGuide() != null ? dep.getHasContributingGuide() : false);
        data.put("vulnerability_count", dep.getVulnerabilityCount() != null ? dep.getVulnerabilities().size() : 0);
        data.put("outdated_days", dep.getOutdatedDays() != null ? dep.getOutdatedDays() : 0);
        data.put("transitive_dependencies", dep.getTransitiveDependencies() != null ? dep.getTransitiveDependencies() : 0);
        data.put("dependency_depth", dep.getDependencyDepth() != null ? dep.getDependencyDepth() : 0);
        data.put("description", dep.getDescription());
        data.put("homepage", dep.getHomepage());
        data.put("repository", dep.getRepository());
        
        return data;
    }

    private Map<String, Object> callAIRiskModel(Map<String, Object> dependencyData) {
        try {
            String url = "http://localhost:8003/risk/assess";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(dependencyData, headers);
            
            ResponseEntity<JsonNode> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                JsonNode.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return objectMapper.convertValue(response.getBody(), Map.class);
            }
            
        } catch (Exception e) {
            System.err.println("Error calling AI risk model: " + e.getMessage());
        }
        
        // Return default assessment if AI service fails
        Map<String, Object> defaultAssessment = new HashMap<>();
        defaultAssessment.put("risk_score", 0.5);
        defaultAssessment.put("risk_level", "MEDIUM");
        defaultAssessment.put("confidence", 0.0);
        defaultAssessment.put("risk_factors", new ArrayList<>());
        defaultAssessment.put("recommendations", new ArrayList<>());
        
        return defaultAssessment;
    }

    private Dependency enhanceDependencyWithAI(Dependency dep, Map<String, Object> aiAssessment) {
        // Update dependency with AI insights
        if (aiAssessment.containsKey("risk_score")) {
            // You might want to store AI risk score separately or use it to adjust existing fields
            // For now, we'll just log the AI assessment
            System.out.println("AI Assessment for " + dep.getName() + ": " + aiAssessment.get("risk_level"));
        }
        
        return dep;
    }

    private int calculateDaysSinceUpdate(String lastUpdated) {
        if (lastUpdated == null || lastUpdated.isEmpty()) {
            return 0;
        }
        
        try {
            // Parse the date string and calculate days since update
            // This is a simplified implementation
            return 30; // Default to 30 days
        } catch (Exception e) {
            return 0;
        }
    }

    private double calculateRiskScore(List<Dependency> dependencies) {
        if (dependencies == null || dependencies.isEmpty()) {
            return 0.0;
        }

        double totalRisk = 0.0;
        int scoredDependencies = 0;

        for (Dependency dep : dependencies) {
            double dependencyRisk = 0.0;

            int vulnCount = 0;
            double maxCvss = 0.0;
            if (dep.getVulnerabilities() != null) {
                vulnCount = dep.getVulnerabilities().size();
                for (var v : dep.getVulnerabilities()) {
                    if (v.getCvssScore() != null) {
                        maxCvss = Math.max(maxCvss, v.getCvssScore());
                    }
                }
            }

            // Base on CVSS severity (normalize to 0-10)
            dependencyRisk += maxCvss; // already 0-10

            // Additional penalty per vulnerability beyond the first
            if (vulnCount > 1) {
                dependencyRisk += Math.min((vulnCount - 1) * 0.5, 3.0);
            }

            // Outdated penalty
            if (dep.isOutdated()) {
                dependencyRisk += 1.0;
            }

            // Known vulnerable flag penalty
            if (dep.isVulnerable()) {
                dependencyRisk += 1.0;
            }

            // License penalty if unknown or problematic
            if (dep.getLicenseType() == null || dep.getLicenseType().isBlank()) {
                dependencyRisk += 0.5;
            }

            // Cap per dependency between 0 and 10
            dependencyRisk = Math.max(0.0, Math.min(10.0, dependencyRisk));

            totalRisk += dependencyRisk;
            scoredDependencies++;
        }

        // Average across dependencies
        return scoredDependencies > 0 ? Math.round((totalRisk / scoredDependencies) * 10.0) / 10.0 : 0.0;
    }
}
