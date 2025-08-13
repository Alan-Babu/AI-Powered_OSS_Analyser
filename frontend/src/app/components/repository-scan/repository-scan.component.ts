import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-repository-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './repository-scan.component.html',
  styleUrl: './repository-scan.component.scss'
})
export class RepositoryScanComponent {
  
  scanForm: FormGroup;
  isScanning = false;
  scanProgress = 0;
  scanResults: any = null;
  scanHistory: any[] = [];

  constructor(private fb: FormBuilder) {
    this.scanForm = this.fb.group({
      repositoryUrl: ['', [Validators.required, Validators.pattern('https?://.*')]],
      scanType: ['full', Validators.required],
      includeDependencies: [true],
      includeVulnerabilities: [true],
      includeLicenseCheck: [true]
    });

    this.loadScanHistory();
  }

  loadScanHistory() {
    // Mock data - will be replaced with actual API calls
    this.scanHistory = [
      {
        id: 1,
        name: 'spring-boot-starter',
        url: 'https://github.com/spring-projects/spring-boot-starter-parent',
        status: 'completed',
        risk: 'medium',
        lastScan: '2 hours ago',
        vulnerabilities: 12,
        dependencies: 156
      },
      {
        id: 2,
        name: 'react-security',
        url: 'https://github.com/facebook/react',
        status: 'completed',
        risk: 'high',
        lastScan: '4 hours ago',
        vulnerabilities: 23,
        dependencies: 89
      }
    ];
  }

  onSubmit() {
    if (this.scanForm.valid) {
      this.startScan();
    }
  }

  startScan() {
    this.isScanning = true;
    this.scanProgress = 0;
    this.scanResults = null;

    // Simulate scan progress
    const interval = setInterval(() => {
      this.scanProgress += Math.random() * 15;
      if (this.scanProgress >= 100) {
        this.scanProgress = 100;
        this.isScanning = false;
        this.completeScan();
        clearInterval(interval);
      }
    }, 500);
  }

  completeScan() {
    // Mock scan results
    this.scanResults = {
      repository: {
        name: 'sample-repo',
        url: this.scanForm.value.repositoryUrl,
        language: 'JavaScript',
        size: '2.4 MB',
        stars: 1250,
        forks: 89
      },
      security: {
        overallRisk: 'medium',
        vulnerabilities: [
          { id: 'CVE-2023-1234', severity: 'high', description: 'SQL Injection vulnerability', affected: 'database.js' },
          { id: 'CVE-2023-5678', severity: 'medium', description: 'Cross-site scripting (XSS)', affected: 'ui.js' }
        ],
        riskScore: 7.2
      },
      dependencies: {
        total: 45,
        direct: 12,
        transitive: 33,
        outdated: 8,
        vulnerable: 3
      },
      license: {
        type: 'MIT',
        compatible: true,
        risk: 'low'
      }
    };
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
