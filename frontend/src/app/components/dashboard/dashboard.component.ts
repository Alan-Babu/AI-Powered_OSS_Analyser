import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Mock data for now - will be replaced with actual API calls
    this.stats = {
      totalRepositories: 156,
      scannedRepositories: 142,
      highRiskVulnerabilities: 23,
      mediumRiskVulnerabilities: 67,
      lowRiskVulnerabilities: 134
    };

    this.recentScans = [
      { id: 1, name: 'spring-boot-starter', status: 'completed', risk: 'medium', lastScan: '2 hours ago' },
      { id: 2, name: 'react-security', status: 'completed', risk: 'high', lastScan: '4 hours ago' },
      { id: 3, name: 'node-express-api', status: 'scanning', risk: 'low', lastScan: '6 hours ago' },
      { id: 4, name: 'python-django-app', status: 'completed', risk: 'low', lastScan: '1 day ago' }
    ];

    this.topVulnerabilities = [
      { name: 'CVE-2023-1234', severity: 'high', affected: 45, description: 'SQL Injection vulnerability' },
      { name: 'CVE-2023-5678', severity: 'medium', affected: 32, description: 'Cross-site scripting (XSS)' },
      { name: 'CVE-2023-9012', severity: 'high', affected: 28, description: 'Remote code execution' },
      { name: 'CVE-2023-3456', severity: 'medium', affected: 19, description: 'Authentication bypass' }
    ];
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
