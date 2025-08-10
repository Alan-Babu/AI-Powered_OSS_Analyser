package com.ossrisk.oss.service;

import com.ossrisk.oss.model.Dependency;
import com.ossrisk.oss.model.Vulnerability;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EnhancedRiskScorerService {

    // Cache for risk scores to avoid recalculation
    private final Map<String, Double> riskScoreCache = new ConcurrentHashMap<>();
    
    // Risk weights for different factors
    private static final double VULNERABILITY_WEIGHT = 0.4;
    private static final double OUTDATED_WEIGHT = 0.25;
    private static final double LICENSE_WEIGHT = 0.15;
    private static final double MAINTENANCE_WEIGHT = 0.2;

    @Cacheable(value = "riskScores", key = "#dependencies.hashCode()")
    public double calculateEnhancedRiskScore(List<Dependency> dependencies) {
        if (dependencies == null || dependencies.isEmpty()) {
            return 0.0;
        }

        double totalScore = 0.0;
        int totalDependencies = dependencies.size();

        for (Dependency dep : dependencies) {
            double dependencyScore = calculateDependencyRisk(dep);
            totalScore += dependencyScore;
        }

        // Normalize score to 0-100 range
        double normalizedScore = (totalScore / totalDependencies) * 100;
        return Math.min(100.0, Math.max(0.0, normalizedScore));
    }

    private double calculateDependencyRisk(Dependency dependency) {
        double riskScore = 0.0;

        // Vulnerability risk (40% weight)
        if (dependency.isVulnerable()) {
            double vulnerabilityScore = calculateVulnerabilityScore(dependency.getVulnerabilities());
            riskScore += vulnerabilityScore * VULNERABILITY_WEIGHT;
        }

        // Outdated dependency risk (25% weight)
        if (dependency.isOutdated()) {
            riskScore += 0.8 * OUTDATED_WEIGHT;
        }

        // License risk (15% weight)
        double licenseRisk = calculateLicenseRisk(dependency);
        riskScore += licenseRisk * LICENSE_WEIGHT;

        // Maintenance risk (20% weight)
        double maintenanceRisk = calculateMaintenanceRisk(dependency);
        riskScore += maintenanceRisk * MAINTENANCE_WEIGHT;

        return riskScore;
    }

    private double calculateVulnerabilityScore(List<Vulnerability> vulnerabilities) {
        if (vulnerabilities == null || vulnerabilities.isEmpty()) {
            return 0.0;
        }

        double maxCvssScore = 0.0;
        for (Vulnerability vuln : vulnerabilities) {
            if (vuln.getCvssScore() > maxCvssScore) {
                maxCvssScore = vuln.getCvssScore();
            }
        }

        // Convert CVSS score (0-10) to risk score (0-1)
        return maxCvssScore / 10.0;
    }

    private double calculateLicenseRisk(Dependency dependency) {
        // This would integrate with license checking service
        // For now, return a default risk score
        return 0.3; // Medium risk
    }

    private double calculateMaintenanceRisk(Dependency dependency) {
        // This would analyze commit frequency, last update, etc.
        // For now, return a default risk score
        return 0.2; // Low-medium risk
    }

    public Map<String, Object> getDetailedRiskAnalysis(List<Dependency> dependencies) {
        Map<String, Object> analysis = new ConcurrentHashMap<>();
        
        analysis.put("totalDependencies", dependencies.size());
        analysis.put("vulnerableDependencies", dependencies.stream().filter(Dependency::isVulnerable).count());
        analysis.put("outdatedDependencies", dependencies.stream().filter(Dependency::isOutdated).count());
        analysis.put("overallRiskScore", calculateEnhancedRiskScore(dependencies));
        
        // Risk breakdown by ecosystem
        Map<String, Long> ecosystemCounts = dependencies.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                    dep -> dep.getEcosystem() != null ? dep.getEcosystem() : "Unknown",
                    java.util.stream.Collectors.counting()
                ));
        analysis.put("ecosystemBreakdown", ecosystemCounts);
        
        return analysis;
    }

    public void clearCache() {
        riskScoreCache.clear();
    }
}
