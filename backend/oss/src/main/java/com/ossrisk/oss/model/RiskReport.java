package com.ossrisk.oss.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String repoUrl;
    private double riskScore;
    private Integer totalVulnerabilities;

    @OneToMany(cascade=CascadeType.ALL)
    private List<Dependency> dependencies;


}
