package com.ossrisk.oss.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name="userprogress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable = false)
    private User user;

    private int score = 0;
    private int level = 1;
    private int livesRemaining = 3;
    private int challengesCompleted = 0;
    private int totalTimeSpent = 0;
    private Instant updatedAt = Instant.now();
}
