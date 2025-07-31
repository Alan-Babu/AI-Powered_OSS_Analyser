package com.ossrisk.oss.repository;

import com.ossrisk.oss.model.Dependency;
import org.springframework.data.jpa.repository.JpaRepository;


public interface DependencyRepository extends JpaRepository<Dependency,Long>{ }
