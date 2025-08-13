import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, RiskReport } from '../../services/api.service';

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
  scanResults: RiskReport | null = null;
  scanHistory: any[] = [];

  constructor(private readonly fb: FormBuilder, private readonly api: ApiService) {
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
    this.api.getReports().subscribe(reports => {
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
    this.scanProgress = 0;
    this.scanResults = null;

    // Begin backend scan
    const url = this.scanForm.value.repositoryUrl as string;
    this.api.scanRepository(url).subscribe({
      next: (report) => {
        // Simulate progress to 100% once backend responds
        const interval = setInterval(() => {
          this.scanProgress = Math.min(100, this.scanProgress + 25);
          if (this.scanProgress >= 100) {
            clearInterval(interval);
            this.isScanning = false;
            this.completeScan(report);
          }
        }, 300);
      },
      error: () => {
        this.isScanning = false;
      }
    });
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
}
