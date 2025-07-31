package com.ossrisk.oss.service;

import com.ossrisk.oss.model.Dependency;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RiskScorerService {
    public double calculate(List<Dependency> deps){
        double score = 0.0;
        for(Dependency d: deps){
            if(d.isOutdated()) score+=1.5;
            if(d.isVulnerable()) score+=2.0;
        }
        return Math.min(100.0,score*10);
    }
}
