package com.ossrisk.oss.repository;

import  com.ossrisk.oss.model.RiskReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface RiskReportRepository extends JpaRepository<RiskReport, Long>  { }
