import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, RiskReport } from '../../services/api.service';

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
    riskScore: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0
  };

  riskFactors = [
    { name: 'Dependency Vulnerabilities', weight: 0.3, score: 0, impact: 'high' },
    { name: 'Code Quality Issues', weight: 0.25, score: 0, impact: 'medium' },
    { name: 'License Compliance', weight: 0.2, score: 0, impact: 'low' },
    { name: 'Security Practices', weight: 0.15, score: 0, impact: 'high' },
    { name: 'Maintenance Activity', weight: 0.1, score: 0, impact: 'medium' }
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

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.api.getReports().subscribe((reports: RiskReport[]) => {
      const allDeps = reports.flatMap(r => r.dependencies || []);
      const allVulns = allDeps.flatMap(d => d.vulnerabilities || []);

      this.riskMetrics.highIssues = allVulns.filter(v => (v as any).severity === 'high' || (v.cvssScore ?? 0) >= 7).length;
      this.riskMetrics.mediumIssues = allVulns.filter(v => (v as any).severity === 'medium' || ((v.cvssScore ?? 0) >= 4 && (v.cvssScore ?? 0) < 7)).length;
      this.riskMetrics.lowIssues = allVulns.filter(v => (v as any).severity === 'low' || (v.cvssScore ?? 0) < 4).length;
      this.riskMetrics.criticalIssues = allVulns.filter(v => (v as any).severity === 'critical' || (v.cvssScore ?? 0) >= 9).length;

      // Compute overall risk: average of report scores (0-10 scale)
      const scores = reports.map(r => r.riskScore ?? 0);
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      this.riskMetrics.riskScore = Number(avg.toFixed(1));

      // Map to overall risk bucket
      if (this.riskMetrics.riskScore >= 8) this.riskMetrics.overallRisk = 'critical';
      else if (this.riskMetrics.riskScore >= 6) this.riskMetrics.overallRisk = 'high';
      else if (this.riskMetrics.riskScore >= 4) this.riskMetrics.overallRisk = 'medium';
      else this.riskMetrics.overallRisk = 'low';

      // Set risk factors heuristically based on issue distribution
      const totalIssues = allVulns.length || 1;
      this.riskFactors = [
        { name: 'Dependency Vulnerabilities', weight: 0.3, score: Math.min(10, (allVulns.length / 50) * 10), impact: 'high' },
        { name: 'Code Quality Issues', weight: 0.25, score: 6.0, impact: 'medium' },
        { name: 'License Compliance', weight: 0.2, score: 4.0, impact: 'low' },
        { name: 'Security Practices', weight: 0.15, score: Math.min(10, (this.riskMetrics.highIssues / totalIssues) * 10), impact: 'high' },
        { name: 'Maintenance Activity', weight: 0.1, score: 5.0, impact: 'medium' }
      ];
    });
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
