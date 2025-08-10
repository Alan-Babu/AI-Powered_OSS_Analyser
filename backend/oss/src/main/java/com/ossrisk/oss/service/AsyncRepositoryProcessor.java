package com.ossrisk.oss.service;

import com.ossrisk.oss.model.Dependency;
import com.ossrisk.oss.model.RepositoryMetadata;
import com.ossrisk.oss.model.RiskReport;
import com.ossrisk.oss.repository.RepositoryMetadataRepository;
import com.ossrisk.oss.repository.RiskReportRepository;
import com.ossrisk.oss.utility.GitCloner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class AsyncRepositoryProcessor {

    @Autowired 
    private DependencyAnalyzerService dependencyAnalyzer;
    
    @Autowired 
    private VulnerabilityCheckerService vulnerabilityChecker;
    
    @Autowired 
    private RiskScorerService riskScorer;
    
    @Autowired 
    private RepositoryMetadataRepository metadataRepo;
    
    @Autowired 
    private RiskReportRepository riskReportRepo;

    @Async("repositoryProcessorExecutor")
    public CompletableFuture<RiskReport> processRepositoryAsync(String repoUrl) {
        try {
            File repoDir = GitCloner.cloneRepo(repoUrl);

            String[] parts = repoUrl.replace("https://github.com/", "").split("/");
            String owner = parts[0];
            String project = parts[1];

            RepositoryMetadata metadata = new RepositoryMetadata(null, repoUrl, owner, project);
            metadataRepo.save(metadata);

            List<Dependency> deps = dependencyAnalyzer.analyze(repoDir);
            System.out.println("Dependencies found: " + deps.size());
            deps.forEach(d -> System.out.println(d.getEcosystem() + " - " + d.getName() + ":" + d.getVersion()));
            
            List<Dependency> checkedDeps = vulnerabilityChecker.check(deps);
            double score = riskScorer.calculate(checkedDeps);
            
            RiskReport report = new RiskReport(null, repoUrl, score, checkedDeps);
            RiskReport savedReport = riskReportRepo.save(report);
            
            return CompletableFuture.completedFuture(savedReport);
        } catch (Exception e) {
            System.err.println("Error processing repository: " + e.getMessage());
            e.printStackTrace();
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async("vulnerabilityCheckerExecutor")
    public CompletableFuture<List<Dependency>> checkVulnerabilitiesAsync(List<Dependency> dependencies) {
        try {
            List<Dependency> checkedDeps = vulnerabilityChecker.check(dependencies);
            return CompletableFuture.completedFuture(checkedDeps);
        } catch (Exception e) {
            System.err.println("Error checking vulnerabilities: " + e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
}
