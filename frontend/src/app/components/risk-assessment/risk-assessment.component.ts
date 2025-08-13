import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-risk-assessment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-assessment.component.html',
  styleUrl: './risk-assessment.component.scss'
})
export class RiskAssessmentComponent implements OnInit {
  
  riskMetrics = {
    overallRisk: 'medium',
    riskScore: 6.8,
    criticalIssues: 3,
    highIssues: 7,
    mediumIssues: 12,
    lowIssues: 8
  };

  riskFactors = [
    { name: 'Dependency Vulnerabilities', weight: 0.3, score: 7.5, impact: 'high' },
    { name: 'Code Quality Issues', weight: 0.25, score: 6.2, impact: 'medium' },
    { name: 'License Compliance', weight: 0.2, score: 4.8, impact: 'low' },
    { name: 'Security Practices', weight: 0.15, score: 8.1, impact: 'high' },
    { name: 'Maintenance Activity', weight: 0.1, score: 5.5, impact: 'medium' }
  ];

  recommendations = [
    {
      priority: 'high',
      title: 'Update vulnerable dependencies',
      description: 'Immediately update packages with known security vulnerabilities',
      effort: 'low',
      impact: 'high'
    },
    {
      priority: 'high',
      title: 'Implement input validation',
      description: 'Add proper input sanitization to prevent injection attacks',
      effort: 'medium',
      impact: 'high'
    },
    {
      priority: 'medium',
      title: 'Add security headers',
      description: 'Implement security headers to protect against common attacks',
      effort: 'low',
      impact: 'medium'
    },
    {
      priority: 'medium',
      title: 'Code review process',
      description: 'Establish mandatory security code review for all changes',
      effort: 'high',
      impact: 'medium'
    }
  ];

  ngOnInit() {
    this.calculateRiskScore();
  }

  calculateRiskScore() {
    let weightedScore = 0;
    let totalWeight = 0;
    
    this.riskFactors.forEach(factor => {
      weightedScore += factor.score * factor.weight;
      totalWeight += factor.weight;
    });
    
    this.riskMetrics.riskScore = weightedScore / totalWeight;
    
    // Determine overall risk level
    if (this.riskMetrics.riskScore >= 8) {
      this.riskMetrics.overallRisk = 'critical';
    } else if (this.riskMetrics.riskScore >= 6) {
      this.riskMetrics.overallRisk = 'high';
    } else if (this.riskMetrics.riskScore >= 4) {
      this.riskMetrics.overallRisk = 'medium';
    } else {
      this.riskMetrics.overallRisk = 'low';
    }
  }

  getRiskColor(risk: string): string {
    switch (risk.toLowerCase()) {
      case 'critical': return 'text-red-800 bg-red-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getImpactColor(impact: string): string {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }

  getEffortColor(effort: string): string {
    switch (effort.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }
}
