package com.ossrisk.oss.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name="challenges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Challenge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(columnDefinition = "TEXT")
    private String code;
    @Column(columnDefinition = "TEXT")
    private String optionJson;
    private Integer correctAnswer;
    private String explanation;
    private String difficulty;
    private Integer points;
    private String category;

}
