package com.ossrisk.oss.repository;

import com.ossrisk.oss.model.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    List<Challenge> findByDifficulty(String difficulty);
    List<Challenge> findByCategory(String category);
}
