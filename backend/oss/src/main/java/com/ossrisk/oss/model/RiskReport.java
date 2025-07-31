package com.ossrisk.oss.model;

import lombok.*;
import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskReport {
    private String repoUrl;
    private List<Dependency> dependencies;
    private double riskScore;
}
