import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, RepositoryMetadata, RiskReport } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  
  stats = {
    totalRepositories: 0,
    scannedRepositories: 0,
    highRiskVulnerabilities: 0,
    mediumRiskVulnerabilities: 0,
    lowRiskVulnerabilities: 0,
    criticalVulnerabilities: 0
  };

  recentScans: any[] = [];
  topVulnerabilities: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  servicesHealth: any = {};

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.checkServicesHealth();
  }

  private toRiskBucket(score: number): 'high' | 'medium' | 'low' {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  loadDashboardData() {
    this.isLoading = true;
    this.errorMessage = null;

    // Load repositories
    this.api.getRepositories().subscribe({
      next: (repos: RepositoryMetadata[]) => {
        this.stats.totalRepositories = repos?.length || 0;
      },
      error: (error) => {
        console.error('Error loading repositories:', error);
        this.errorMessage = 'Failed to load repository data';
      }
    });

    // Load risk reports
    this.api.getReports().subscribe({
      next: (reports: RiskReport[]) => {
        const allDeps = reports.flatMap(r => r.dependencies || []);
        const allVulns = allDeps.flatMap(d => d.vulnerabilities || []);

        this.stats.scannedRepositories = reports?.length || 0;

        // Count vulnerabilities by severity
        const critical = allVulns.filter(v => (v.severity === 'critical' || (v.cvssScore ?? 0) >= 9.0)).length;
        const high = allVulns.filter(v => (v.severity === 'high' || ((v.cvssScore ?? 0) >= 7.0 && (v.cvssScore ?? 0) < 9.0))).length;
        const medium = allVulns.filter(v => (v.severity === 'medium' || ((v.cvssScore ?? 0) >= 4.0 && (v.cvssScore ?? 0) < 7.0))).length;
        const low = allVulns.filter(v => (v.severity === 'low' || ((v.cvssScore ?? 0) >= 0.1 && (v.cvssScore ?? 0) < 4.0))).length;
        
        this.stats.criticalVulnerabilities = critical;
        this.stats.highRiskVulnerabilities = high;
        this.stats.mediumRiskVulnerabilities = medium;
        this.stats.lowRiskVulnerabilities = low;

        // Recent scans
        this.recentScans = reports.slice(-5).map(r => ({
          id: r.id,
          name: r.repoUrl?.split('/').pop() ?? r.repoUrl,
          status: 'completed',
          risk: this.toRiskBucket(r.riskScore ?? 0),
          lastScan: r.scanDate || 'recently',
          riskScore: r.riskScore,
          vulnerabilities: allVulns.filter(v => 
            allDeps.some(d => d.vulnerabilities?.some(vuln => vuln.id === v.id))
          ).length
        })).reverse();

        // Top vulnerabilities
        this.topVulnerabilities = (allVulns || [])
          .sort((a, b) => (b.cvssScore ?? 0) - (a.cvssScore ?? 0))
          .slice(0, 5)
          .map(v => ({
            name: v.cve || v.title,
            severity: v.severity || this.toRiskBucket(v.cvssScore ?? 0),
            cvssScore: v.cvssScore,
            affected: 1,
            description: v.description
          }));

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.errorMessage = 'Failed to load risk assessment data';
        this.isLoading = false;
      }
    });
  }

  checkServicesHealth() {
    this.api.checkAIServicesHealth().subscribe({
      next: (health) => {
        this.servicesHealth = health;
      },
      error: (error) => {
        console.error('Error checking services health:', error);
        this.servicesHealth = {
          securityScanner: 'unknown',
          nlpExplainer: 'unknown',
          riskModel: 'unknown',
          knowledgeGraph: 'unknown'
        };
      }
    });
  }

  getRiskColor(risk: string): string {
    switch (risk.toLowerCase()) {
      case 'critical': return 'text-red-800 bg-red-200';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'scanning': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getServiceHealthColor(service: string): string {
    const health = this.servicesHealth[service];
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }


  refreshData() {
    this.loadDashboardData();
    this.checkServicesHealth();
  }

  clearError() {
    this.errorMessage = null;
  }
}
