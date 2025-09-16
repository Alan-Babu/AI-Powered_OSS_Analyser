import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EnhancedApiService, RiskReport, Vulnerability, Dependency } from '../../services/enhanced-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-risk-assessment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-assessment.component.html',
  styleUrl: './risk-assessment.component.scss'
})
export class RiskAssessmentComponent implements OnInit, OnDestroy {
  
  riskForm: any; // FormGroup removed, replaced with any for now
  riskReports: RiskReport[] = [];
  selectedReport: RiskReport | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  
  // Risk Analysis
  riskMetrics = {
    overallRisk: 0,
    dependencyRisk: 0,
    vulnerabilityRisk: 0,
    licenseRisk: 0,
    codeQualityRisk: 0
  };
  
  // AI Predictions
  aiRiskPrediction: any = null;
  isPredicting = false;
  
  // Filters
  riskLevelFilter: string = 'all';
  dateRangeFilter: string = 'all';
  
  // Charts data
  riskDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private readonly api: EnhancedApiService
  ) {
    this.riskForm = {
      riskLevel: 'all',
      dateRange: 'all',
      searchTerm: ''
    };
  }

  ngOnInit(): void {
    this.loadRiskReports();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupFormListeners() {
    // this.riskForm.valueChanges.subscribe(() => {
    //   this.applyFilters();
    // });
  }

  loadRiskReports(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const sub = this.api.getReports().subscribe({
      next: (reports) => {
        this.riskReports = reports;
        this.calculateRiskMetrics();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading risk reports:', error);
        this.errorMessage = 'Failed to load risk assessment data';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  calculateRiskMetrics(): void {
    if (this.riskReports.length === 0) return;

    // Calculate overall risk from all reports
    const totalRisk = this.riskReports.reduce((sum, report) => sum + (report.riskScore || 0), 0);
    this.riskMetrics.overallRisk = totalRisk / this.riskReports.length;

    // Calculate dependency risk
    const allDependencies = this.riskReports.flatMap(r => r.dependencies || []);
    const vulnerableDeps = allDependencies.filter(d => d.vulnerable);
    this.riskMetrics.dependencyRisk = (vulnerableDeps.length / allDependencies.length) * 10;

    // Calculate vulnerability risk
    const allVulns = allDependencies.flatMap(d => d.vulnerabilities || []);
    const highRiskVulns = allVulns.filter(v => (v.cvssScore || 0) >= 7.0);
    this.riskMetrics.vulnerabilityRisk = (highRiskVulns.length / allVulns.length) * 10;

    // Calculate risk distribution
    this.riskDistribution = {
      critical: allVulns.filter(v => (v.cvssScore || 0) >= 9.0).length,
      high: allVulns.filter(v => (v.cvssScore || 0) >= 7.0 && (v.cvssScore || 0) < 9.0).length,
      medium: allVulns.filter(v => (v.cvssScore || 0) >= 4.0 && (v.cvssScore || 0) < 7.0).length,
      low: allVulns.filter(v => (v.cvssScore || 0) >= 0.1 && (v.cvssScore || 0) < 4.0).length
    };
  }

  applyFilters(): void {
    const filters = this.riskForm;
    
    // Apply risk level filter
    if (filters.riskLevel !== 'all') {
      this.riskReports = this.riskReports.filter(report => {
        const risk = this.getRiskLevel(report.riskScore || 0);
        return risk === filters.riskLevel;
      });
    }

    // Apply date range filter (if implemented)
    // This would require date fields in the RiskReport model
  }

  getRiskLevel(riskScore: number): string {
    if (riskScore >= 8.0) return 'critical';
    if (riskScore >= 6.0) return 'high';
    if (riskScore >= 4.0) return 'medium';
    if (riskScore >= 2.0) return 'low';
    return 'minimal';
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return 'text-red-800 bg-red-200 border-red-300';
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      case 'minimal': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  }

  selectReport(report: RiskReport) {
    this.selectedReport = report;
    this.aiRiskPrediction = null;
  }

  generateAIPrediction(report?: RiskReport): void {
    const target = report || this.selectedReport;
    if (!target) return;

    this.isPredicting = true;
    const sub = this.api.getRiskPrediction(target.dependencies || []).subscribe({
      next: (prediction) => {
        this.aiRiskPrediction = prediction;
        this.isPredicting = false;
      },
      error: (error) => {
        console.error('AI prediction error:', error);
        this.aiRiskPrediction = { error: 'AI prediction failed. Please try again.' };
        this.isPredicting = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  generateKnowledgeGraph(repoUrl: string): void {
    const sub = this.api.generateKnowledgeGraph(repoUrl).subscribe({
      next: (graph) => {
        console.log('Knowledge graph generated:', graph);
        // Navigate to knowledge graph component or display graph
      },
      error: (error) => {
        console.error('Knowledge graph generation error:', error);
        this.errorMessage = 'Failed to generate knowledge graph';
      }
    });
    
    this.subscriptions.push(sub);
  }

  exportRiskReport(report: RiskReport) {
    const csvContent = this.generateRiskCSV(report);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risk-report-${report.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateCombinedReport() {
    if (!this.riskReports || this.riskReports.length === 0) return;
    const headers = ['Repository','Risk Score','Dependencies','Total Vulnerabilities'];
    const rows = this.riskReports.map(r => [
      r.repoUrl || '',
      r.riskScore || 0,
      (r.dependencies || []).length,
      (r.dependencies || []).reduce((acc, d) => acc + (d.vulnerabilities?.length || 0), 0)
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'risk-reports.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generateRiskCSV(report: RiskReport): string {
    const headers = ['Repository', 'Risk Score', 'Dependencies', 'Vulnerabilities', 'Scan Date'];
    const rows = [
      [
        report.repoUrl || '',
        report.riskScore || '',
        (report.dependencies || []).length,
        (report.dependencies || []).reduce((acc, d) => acc + (d.vulnerabilities?.length || 0), 0),
        report.scanDate || ''
      ]
    ];
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  getRiskTrend(reports: RiskReport[]): string {
    if (reports.length < 2) return 'stable';
    
    const recent = reports.slice(-3);
    const older = reports.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, r) => sum + (r.riskScore || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + (r.riskScore || 0), 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'increasing';
    if (recentAvg < olderAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  }

  clearFilters(): void {
    this.riskForm = {
      riskLevel: 'all',
      dateRange: 'all',
      searchTerm: ''
    };
  }

  refreshData(): void {
    this.loadRiskReports();
  }

  clearError(): void {
    this.errorMessage = null;
  }

  // Helper methods for template
  getTotalVulnerabilities(report: RiskReport): number {
    return (report.dependencies || []).reduce((acc, dep) => acc + (dep.vulnerabilities?.length || 0), 0);
  }
}
