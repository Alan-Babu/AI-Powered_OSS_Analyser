package com.ossrisk.oss.controller;

import com.ossrisk.oss.model.RiskReport;
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

    @PostMapping("/scan")
    public ResponseEntity<RiskReport> scanRepository(@RequestParam String url){
        RiskReport report = gitHubService.processRepository(url);
        return ResponseEntity.ok(report);
    }
    @GetMapping("/all")
    public ResponseEntity<List<RepositoryMetadata>> getAllRepositories(){
        List<RepositoryMetadata> repositories = repositoryMetadataRepository.findAll();
        return ResponseEntity.ok(repositories);
    }
}
