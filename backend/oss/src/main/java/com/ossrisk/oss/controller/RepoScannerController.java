package com.ossrisk.oss.controller;

import com.ossrisk.oss.model.RiskReport;
import com.ossrisk.oss.repository.RiskReportRepository;
import com.ossrisk.oss.service.GitHubService;
import com.ossrisk.oss.model.RepositoryMetadata;
import com.ossrisk.oss.repository.RepositoryMetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repo")

public class RepoScannerController {
    @Autowired
    private GitHubService gitHubService;

    @Autowired
    private RepositoryMetadataRepository repositoryMetadataRepository;

    @Autowired
    private RiskReportRepository riskReportRepository;

    @PostMapping("/scan")
    public ResponseEntity<RiskReport> scanRepository(@RequestParam String url){
        RiskReport report = gitHubService.processRepository(url);
        return ResponseEntity.ok(report);
    }
    @GetMapping("/all")
    public ResponseEntity<List<RepositoryMetadata>> getRepositories(@RequestParam(required = false) String owner){
        List<RepositoryMetadata> repositories = (owner == null || owner.isEmpty())
                ? repositoryMetadataRepository.findAll()
                : repositoryMetadataRepository.findByOwner(owner);
        return ResponseEntity.ok(repositories);
    }
    @GetMapping("/reports")
    public ResponseEntity<List<RiskReport>> getAllReports(){
        return ResponseEntity.ok(riskReportRepository.findAll());
    }
}
