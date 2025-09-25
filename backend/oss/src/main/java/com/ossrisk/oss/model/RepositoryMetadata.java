package com.ossrisk.oss.model;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryMetadata {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String repoUrl;
    private String owner;
    private String projectName;
    private Integer vulnerabilityCount;
}
