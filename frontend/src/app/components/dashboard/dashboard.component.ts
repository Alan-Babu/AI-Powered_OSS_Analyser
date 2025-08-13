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
    lowRiskVulnerabilities: 0
  };

  recentScans: any[] = [];
  topVulnerabilities: any[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private toRiskBucket(score: number): 'high' | 'medium' | 'low' {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  loadDashboardData() {
    this.api.getRepositories().subscribe((repos: RepositoryMetadata[]) => {
      this.stats.totalRepositories = repos?.length || 0;
    });

    this.api.getReports().subscribe((reports: RiskReport[]) => {
      const allDeps = reports.flatMap(r => r.dependencies || []);
      const allVulns = allDeps.flatMap(d => d.vulnerabilities || []);

      this.stats.scannedRepositories = reports?.length || 0;

      const high = allVulns.filter(v => (v as any).severity === 'high' || (v.cvssScore ?? 0) >= 7).length;
      const medium = allVulns.filter(v => (v as any).severity === 'medium' || ((v.cvssScore ?? 0) >= 4 && (v.cvssScore ?? 0) < 7)).length;
      const low = allVulns.filter(v => (v as any).severity === 'low' || (v.cvssScore ?? 0) < 4).length;
      this.stats.highRiskVulnerabilities = high;
      this.stats.mediumRiskVulnerabilities = medium;
      this.stats.lowRiskVulnerabilities = low;

      this.recentScans = reports.slice(-5).map(r => ({
        id: r.id,
        name: r.repoUrl?.split('/').pop() ?? r.repoUrl,
        status: 'completed',
        risk: this.toRiskBucket(r.riskScore ?? 0),
        lastScan: 'recently'
      })).reverse();

      this.topVulnerabilities = (allVulns || [])
        .sort((a, b) => (b.cvssScore ?? 0) - (a.cvssScore ?? 0))
        .slice(0, 5)
        .map(v => ({
          name: v.cve || v.title,
          severity: (v as any).severity || this.toRiskBucket(v.cvssScore ?? 0),
          affected: 1,
          description: v.description
        }));
    });
  }

  getRiskColor(risk: string): string {
    switch (risk.toLowerCase()) {
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
}
