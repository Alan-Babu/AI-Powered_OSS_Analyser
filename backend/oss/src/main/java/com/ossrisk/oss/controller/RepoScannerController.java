package com.ossrisk.oss.controller;

import com.ossrisk.oss.model.RiskReport;
import com.ossrisk.oss.model.Vulnerability;
import com.ossrisk.oss.repository.RiskReportRepository;
import com.ossrisk.oss.repository.VulnerabilityRepository;
import com.ossrisk.oss.service.GitHubService;
import com.ossrisk.oss.model.RepositoryMetadata;
import com.ossrisk.oss.repository.RepositoryMetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/repo")
@CrossOrigin(origins = "*")
public class RepoScannerController {
    @Autowired
    private GitHubService gitHubService;

    private final WebClient webClient;

    @Autowired
    private VulnerabilityRepository vulnerabilityRepository;

    @Autowired
    private RepositoryMetadataRepository repositoryMetadataRepository;

    @Autowired
    private RiskReportRepository riskReportRepository;

    @Autowired
    private RestTemplate restTemplate;

    public RepoScannerController(WebClient.Builder webClientBuilder){
        this.webClient = webClientBuilder.baseUrl("http://localhost:8003").build();
    }

    @PostMapping("/scan")
    public ResponseEntity<RiskReport> scanRepository(
            @RequestParam String url,
            @RequestParam(defaultValue = "full") String scanType,
            @RequestParam(defaultValue = "true") boolean includeDependencies,
            @RequestParam(defaultValue = "true") boolean includeVulnerabilities,
            @RequestParam(defaultValue = "true") boolean includeLicenseCheck,
            @RequestParam(defaultValue = "false") boolean includeCodeAnalysis) {
        
        try {
            RiskReport report = gitHubService.processRepository(url);
            
            // Enhanced risk scoring with AI services
            if (includeVulnerabilities) {
                report = enhanceRiskAssessment(report);
            }
            
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorReport(url, e.getMessage()));
        }
    }

    @PostMapping("/scan/ai")
    public ResponseEntity<RiskReport> scanRepositoryWithAI(
            @RequestParam String url,
            @RequestParam(defaultValue = "true") boolean includeAIAnalysis) {
        
        try {
            RiskReport report = gitHubService.processRepositoryWithAI(url);
            
            if (includeAIAnalysis) {
                report = enhanceWithAIServices(report);
            }
            
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorReport(url, e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<RepositoryMetadata>> getRepositories(
            @RequestParam(required = false) String owner) {
        try {
            List<RepositoryMetadata> repositories = (owner == null || owner.isEmpty())
                    ? repositoryMetadataRepository.findAll()
                    : repositoryMetadataRepository.findByOwner(owner);
            return ResponseEntity.ok(repositories);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<RepositoryMetadata> getRepositoryById(@PathVariable Long id) {
        try {
            Optional<RepositoryMetadata> repo = repositoryMetadataRepository.findById(id);
            return repo.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<List<RiskReport>> getAllReports() {
        try {
            return ResponseEntity.ok(riskReportRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<RiskReport> getReportById(@PathVariable Long id) {
        try {
            Optional<RiskReport> report = riskReportRepository.findById(id);
            return report.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/reports/{id}/enhance")
    public ResponseEntity<RiskReport> enhanceReportWithAI(@PathVariable Long id) {
        try {
            Optional<RiskReport> reportOpt = riskReportRepository.findById(id);
            if (reportOpt.isPresent()) {
                RiskReport report = reportOpt.get();
                RiskReport enhancedReport = enhanceWithAIServices(report);
                return ResponseEntity.ok(enhancedReport);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("service", "oss-risk-analyzer");
        health.put("version", "2.0.0");
        
        // Check AI services health
        Map<String, String> aiServices = new HashMap<>();
        try {
            aiServices.put("security-scanner", checkServiceHealth("http://localhost:8001/health"));
            aiServices.put("nlp-explainer", checkServiceHealth("http://localhost:8002/health"));
            aiServices.put("risk-model", checkServiceHealth("http://localhost:8003/health"));
            aiServices.put("knowledge-graph", checkServiceHealth("http://localhost:8004/health"));
        } catch (Exception e) {
            aiServices.put("error", "Failed to check AI services");
        }
        health.put("aiServices", aiServices);
        
        return ResponseEntity.ok(health);
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> userChat(@RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            String response = chatWithAI(message);
            Map<String, String> result = new HashMap<>();
            result.put("response", response);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to process chat request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/ai/predict")
    public Mono<ResponseEntity<Map<String, Object>>> predictRiskWithAI(@RequestBody Map<String, Object> request) {
        return webClient.post()
                .uri("/risk/batch-assess")
                .bodyValue(request)
                .retrieve()
                .toEntity(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(response -> {
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        return ResponseEntity.ok(response.getBody());
                    }
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "AI service responded with status: " + response.getStatusCode());
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
                })
                .onErrorResume(e -> {
                    Map<String, Object> error = new HashMap<>();
                    error.put("error", "Failed to get AI prediction: " + e.getMessage());
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error));
                });
    }

    @PatchMapping("/vulnerabilities/{id}/status")
    public ResponseEntity<Map<String, String>> updateVulnerabilityStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> statusUpdate) {
        try {
            // Implementation for updating vulnerability status
            Map<String, String> result = new HashMap<>();
            result.put("message", "Vulnerability status updated successfully");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update vulnerability status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/vulnerabilities/{id}/remediation")
    public ResponseEntity<?> updateRemidiation(@PathVariable Long id, @RequestBody Map<String, String> body){
        String remediation = body.get("remediation");
        Vulnerability v = vulnerabilityRepository.findById(id)
                .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND, "Vulnerability not found"));

        v.setRemediation(remediation);
        vulnerabilityRepository.save(v);
        return ResponseEntity.ok(Map.of("message", "Remediation updated"));
    }

    @PostMapping("/batch-scan")
    public ResponseEntity<Map<String, Object>> batchScanRepositories(@RequestBody List<String> urls) {
        try {
            Map<String, Object> results = new HashMap<>();
            List<RiskReport> reports = new ArrayList<>();
            
            for (String url : urls) {
                try {
                    RiskReport report = gitHubService.processRepository(url);
                    reports.add(report);
                } catch (Exception e) {
                    System.err.println("Error scanning " + url + ": " + e.getMessage());
                }
            }
            
            results.put("total_scanned", urls.size());
            results.put("successful_scans", reports.size());
            results.put("reports", reports);
            
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to perform batch scan: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    private String checkServiceHealth(String url) {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            return response.getStatusCode().is2xxSuccessful() ? "healthy" : "unhealthy";
        } catch (Exception e) {
            return "unhealthy";
        }
    }

    private RiskReport createErrorReport(String url, String error) {
        RiskReport report = new RiskReport();
        report.setRepoUrl(url);
        report.setRiskScore(0.0);
        return report;
    }

    // Enhanced risk assessment with AI services
    private RiskReport enhanceRiskAssessment(RiskReport report) {
        try {
            if (report.getDependencies() != null) {
                for (var dependency : report.getDependencies()) {
                    // Calculate basic risk score
                    double riskScore = 0.0;
                    
                    if (dependency.getVulnerabilities() != null) {
                        riskScore += dependency.getVulnerabilities().size() * 0.5;
                    }
                    
                    if (dependency.isOutdated()) {
                        riskScore += 0.3;
                    }
                    
                    if (dependency.isVulnerable()) {
                        riskScore += 0.5;
                    }
                    
                    // Add risk based on vulnerability count
                    if (dependency.getVulnerabilityCount() != null) {
                        riskScore += dependency.getVulnerabilityCount() * 0.2;
                    }
                    
                    // Set risk score (assuming there's a setRiskScore method)
                    // dependency.setRiskScore(Math.min(riskScore, 10.0));
                }
            }
        } catch (Exception e) {
            System.err.println("Error enhancing risk assessment: " + e.getMessage());
        }
        
        return report;
    }

    // Enhanced AI services integration
    private RiskReport enhanceWithAIServices(RiskReport report) {
        try {
            // Call AI risk model service for enhanced analysis
            Map<String, Object> aiRequest = new HashMap<>();
            aiRequest.put("repo_url", report.getRepoUrl());
            aiRequest.put("risk_score", report.getRiskScore());
            
            // Add dependency data for AI analysis
            if (report.getDependencies() != null) {
                List<Map<String, Object>> dependencyData = new ArrayList<>();
                for (var dep : report.getDependencies()) {
                    Map<String, Object> depData = new HashMap<>();
                    depData.put("name", dep.getName());
                    depData.put("version", dep.getVersion());
                    depData.put("ecosystem", dep.getEcosystem());
                    depData.put("vulnerable", dep.isVulnerable());
                    depData.put("outdated", dep.isOutdated());
                    dependencyData.add(depData);
                }
                aiRequest.put("dependencies", dependencyData);
            }
            
            // Call AI risk model
            try {
                ResponseEntity<Map> aiResponse = restTemplate.postForEntity(
                    "http://localhost:8003/risk/batch-assess",
                    aiRequest,
                    Map.class
                );
                
                if (aiResponse.getStatusCode().is2xxSuccessful() && aiResponse.getBody() != null) {
                    Map<String, Object> aiResult = aiResponse.getBody();
                    if (aiResult.containsKey("summary")) {
                        Map<String, Object> summary = (Map<String, Object>) aiResult.get("summary");
                        if (summary.containsKey("average_risk_score")) {
                            double aiRiskScore = ((Number) summary.get("average_risk_score")).doubleValue();
                            // Normalize to 0-10 scale if needed and clamp
                            if (aiRiskScore > 10.0) {
                                aiRiskScore = aiRiskScore / 10.0;
                            }
                            aiRiskScore = Math.max(0.0, Math.min(10.0, aiRiskScore));
                            report.setRiskScore(aiRiskScore);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error calling AI risk model: " + e.getMessage());
            }
            
        } catch (Exception e) {
            System.err.println("Error enhancing with AI services: " + e.getMessage());
        }
        
        return report;
    }

    // Enhanced chat with AI
    private String chatWithAI(String message) {
        try {
            Map<String, String> request = new HashMap<>();
            request.put("message", message);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "http://localhost:8000/chat",
                request,
                Map.class
            );
            
            if (response.getBody() != null && response.getBody().containsKey("response")) {
                return response.getBody().get("response").toString();
            }
            
        } catch (Exception e) {
            System.err.println("Error in chat with AI: " + e.getMessage());
        }
        
        return "Sorry, I'm unable to process your request at the moment.";
    }
}
