package com.ossrisk.oss.service;

import com.ossrisk.oss.model.Dependency;
import com.ossrisk.oss.model.RepositoryMetadata;
import com.ossrisk.oss.model.RiskReport;
import com.ossrisk.oss.repository.RepositoryMetadataRepository;
import com.ossrisk.oss.repository.RiskReportRepository;
import com.ossrisk.oss.utility.GitCloner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
public class GitHubService {
    @Autowired private DependencyAnalyzerService dependencyAnalyzer;
    @Autowired private VulnerabilityCheckerService vulnerabilityChecker;
    @Autowired private RiskScorerService riskScorer;
    @Autowired private RepositoryMetadataRepository metadataRepo;
    @Autowired private RiskReportRepository riskReportRepo;

    public RiskReport processRepository(String repoUrl){
        File repoDir = GitCloner.cloneRepo(repoUrl);

        String[] parts = repoUrl.replace("https://github.com/","").split("/");
        String owner = parts[0];
        String project = parts[1];

        metadataRepo.save(new RepositoryMetadata(null,repoUrl,owner,project));

        List<Dependency> deps = dependencyAnalyzer.analyze(repoDir);
        List<Dependency> checkedDeps = vulnerabilityChecker.check(deps);
        double score = riskScorer.calculate(checkedDeps);
        RiskReport report = new RiskReport(null,repoUrl,score,checkedDeps);
        return riskReportRepo.save(report);
    }

}
