package com.ossrisk.oss.repository;

import com.ossrisk.oss.model.User;
import com.ossrisk.oss.model.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.util.Optional;

public interface UserProgressRepository extends JpaRepository<UserProgress,Long> {
    Optional<UserProgress> findByUser(User user);
}
