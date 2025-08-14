import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, RiskReport, ScanRequest, ScanProgress } from '../../services/api.service';

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
  scanProgress: ScanProgress = {
    status: 'scanning',
    progress: 0,
    currentStep: 'Initializing scan...'
  };
  scanResults: RiskReport | null = null;
  scanHistory: any[] = [];
  errorMessage: string | null = null;
  servicesHealth: any = {};

  constructor(private readonly fb: FormBuilder, private readonly api: ApiService) {
    this.scanForm = this.fb.group({
      repositoryUrl: ['', [Validators.required, Validators.pattern('https?://.*')]],
      scanType: ['full', Validators.required],
      includeDependencies: [true],
      includeVulnerabilities: [true],
      includeLicenseCheck: [true],
      includeCodeAnalysis: [false]
    });

    this.loadScanHistory();
    this.checkServicesHealth();
  }

  loadScanHistory() {
    this.api.getReports().subscribe({
      next: (reports) => {
        this.scanHistory = (reports || []).map((r, idx) => ({
          id: r.id ?? idx,
          name: r.repoUrl?.split('/').pop() ?? r.repoUrl,
          url: r.repoUrl,
          status: 'completed',
          risk: this.toRiskBucket(r.riskScore ?? 0),
          lastScan: 'recently',
          vulnerabilities: (r.dependencies || []).reduce((acc, d) => acc + (d.vulnerabilities?.length || 0), 0),
          dependencies: r.dependencies?.length || 0
        }));
      },
      error: (error) => {
        console.error('Error loading scan history:', error);
        this.errorMessage = 'Failed to load scan history';
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

  private toRiskBucket(score: number): 'high' | 'medium' | 'low' {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  onSubmit() {
    if (this.scanForm.valid) {
      this.startScan();
    }
  }

  startScan() {
    this.isScanning = true;
    this.errorMessage = null;
    this.scanProgress = {
      status: 'scanning',
      progress: 0,
      currentStep: 'Initializing scan...'
    };
    this.scanResults = null;

    const scanRequest: ScanRequest = {
      url: this.scanForm.value.repositoryUrl,
      scanType: this.scanForm.value.scanType,
      includeDependencies: this.scanForm.value.includeDependencies,
      includeVulnerabilities: this.scanForm.value.includeVulnerabilities,
      includeLicenseCheck: this.scanForm.value.includeLicenseCheck,
      includeCodeAnalysis: this.scanForm.value.includeCodeAnalysis
    };

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      if (this.scanProgress.progress < 90) {
        this.scanProgress.progress += Math.random() * 15;
        this.updateProgressStep();
      }
    }, 1000);

    // Begin backend scan
    this.api.scanRepository(scanRequest).subscribe({
      next: (report) => {
        clearInterval(progressInterval);
        this.scanProgress.progress = 100;
        this.scanProgress.status = 'completed';
        this.scanProgress.currentStep = 'Scan completed successfully!';
        
        setTimeout(() => {
          this.isScanning = false;
          this.completeScan(report);
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isScanning = false;
        this.scanProgress.status = 'failed';
        this.errorMessage = error.message || 'Scan failed. Please try again.';
        console.error('Scan error:', error);
      }
    });
  }

  private updateProgressStep() {
    if (this.scanProgress.progress < 20) {
      this.scanProgress.currentStep = 'Cloning repository...';
    } else if (this.scanProgress.progress < 40) {
      this.scanProgress.currentStep = 'Analyzing dependencies...';
    } else if (this.scanProgress.progress < 60) {
      this.scanProgress.currentStep = 'Checking for vulnerabilities...';
    } else if (this.scanProgress.progress < 80) {
      this.scanProgress.currentStep = 'Generating risk assessment...';
    } else if (this.scanProgress.progress < 90) {
      this.scanProgress.currentStep = 'Finalizing report...';
    }
  }

  completeScan(report: RiskReport) {
    this.scanResults = report;
    this.loadScanHistory();
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

  getServiceHealthColor(service: string): string {
    const health = this.servicesHealth[service];
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  clearError() {
    this.errorMessage = null;
  }

  retryScan() {
    if (this.scanForm.valid) {
      this.startScan();
    }
  }

  // Helper methods for template
  getRiskLevel(riskScore: number): string {
    if (riskScore >= 8.0) return 'critical';
    if (riskScore >= 6.0) return 'high';
    if (riskScore >= 4.0) return 'medium';
    if (riskScore >= 2.0) return 'low';
    return 'minimal';
  }

  getSeverity(vulnerability: any): string {
    if (vulnerability.severity) return vulnerability.severity;
    
    const cvss = vulnerability.cvssScore || 0;
    if (cvss >= 9.0) return 'critical';
    if (cvss >= 7.0) return 'high';
    if (cvss >= 4.0) return 'medium';
    if (cvss >= 0.1) return 'low';
    return 'none';
  }

  getTotalVulnerabilities(report: RiskReport): number {
    return (report.dependencies || []).reduce((acc, dep) => acc + (dep.vulnerabilities?.length || 0), 0);
  }

  getVulnerableDependencies(report: RiskReport): number {
    return (report.dependencies || []).filter(dep => dep.vulnerable).length;
  }

  getSecureDependencies(report: RiskReport): number {
    return (report.dependencies || []).filter(dep => !dep.vulnerable).length;
  }

  getOutdatedDependencies(report: RiskReport): number {
    return (report.dependencies || []).filter(dep => dep.outdated).length;
  }

  getAllVulnerabilities(report: RiskReport): any[] {
    return (report.dependencies || []).flatMap(dep => 
      (dep.vulnerabilities || []).map(vuln => ({ ...vuln, dependencyName: dep.name, dependencyVersion: dep.version }))
    );
  }

  getDependencyName(vulnerability: any, report: RiskReport): string {
    const dep = (report.dependencies || []).find(d => 
      (d.vulnerabilities || []).some(v => v.id === vulnerability.id)
    );
    return dep ? `${dep.name}@${dep.version}` : 'Unknown';
  }
}
