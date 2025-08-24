package com.ossrisk.oss.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Dependency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String version;
    private boolean outdated;
    private boolean vulnerable;
    private String ecosystem;
    
    // Enhanced fields for API data
    private String lastUpdated;
    private Integer downloadCount;
    private Integer starCount;
    private Integer maintainerCount;
    private String description;
    private String homepage;
    private String repository;
    private Integer issueCount;
    private Integer forkCount;
    private String licenseType;
    private Boolean hasSecurityPolicy;
    private Boolean hasCodeOfConduct;
    private Boolean hasContributingGuide;
    private Integer vulnerabilityCount;
    private Integer outdatedDays;
    private Integer transitiveDependencies;
    private Integer dependencyDepth;
    
    // AI-enhanced risk fields
    private Double riskScore;
    private String riskLevel;
    private List<String> recommendations;

    @OneToMany(mappedBy = "dependency", cascade=CascadeType.ALL, orphanRemoval = true)
    private List<Vulnerability> vulnerabilities = new ArrayList<>();

    public Dependency(String name, String version, boolean outdated, boolean vulnerable, String ecosystem) {
        this.name = name;
        this.version = version;
        this.outdated = outdated;
        this.vulnerable = vulnerable;
        this.ecosystem = ecosystem;
        this.vulnerabilities = new ArrayList<>();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Dependency)) return false;
        Dependency that = (Dependency) o;
        return Objects.equals(name, that.name) &&
                Objects.equals(version, that.version) &&
                Objects.equals(ecosystem, that.ecosystem);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, version, ecosystem);
    }
}
