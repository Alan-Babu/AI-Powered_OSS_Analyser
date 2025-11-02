import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EnhancedApiService, RiskReport, ScanRequest,  RepositoryMetadata } from '../../services/enhanced-api.service';
import { Subscription, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { startScan } from '../../statemanagement/scan/scan.actions';
import { selectIsScanning, selectProgress, selectCurrentStep, selectResults, selectError } from '../../statemanagement/scan/scan.selectors';
import { ScanState } from '../../statemanagement/scan/scan.state';


@Component({
  selector: 'app-repository-scan',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './repository-scan.component.html',
  styleUrl: './repository-scan.component.scss'
})
export class RepositoryScanComponent implements OnInit, OnDestroy {
  
  scanForm: FormGroup;
  scanHistory: RepositoryMetadata[] = [];
  servicesHealth: any = {};
  isScanning$: Observable<boolean> = new Observable<boolean>();
  progress$: Observable<number> = new Observable<number>();
  currentStep$: Observable<string> = new Observable<string>();
  scanResults$: Observable<any> = new Observable<any>();
  errorMessage$: Observable<string | null> = new Observable<string | null>();

  vulnCurrentPage = 1;
  vulnItemsPerPage = 5;
  
  
  // Real-time data
  repositories: RepositoryMetadata[] = [];
  recentReports: RiskReport[] = [];
  
  // Loading states
  isLoadingHistory = false;
  isLoadingHealth = false;
  isLoadingRepositories = false;
  currentPage = 1;
  itemsPerPage = 3;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly fb: FormBuilder, 
    private readonly api: EnhancedApiService,
    private readonly store: Store<{ scan: ScanState }>
  ) {
    this.scanForm = this.fb.group({
      repositoryUrl: ['', [Validators.required, Validators.pattern('https?://.*')]],
      scanType: ['full', Validators.required],
      includeDependencies: [true],
      includeVulnerabilities: [true],
      includeLicenseCheck: [true],
      includeCodeAnalysis: [false]
    });
  }

  ngOnInit(): void {
    this.isScanning$ = this.store.select(selectIsScanning);
    this.progress$ = this.store.select(selectProgress);
    this.currentStep$ = this.store.select(selectCurrentStep);
    this.scanResults$ = this.store.select(selectResults);
    this.errorMessage$ = this.store.select(selectError);
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadInitialData(): void {
    this.loadScanHistory();
    this.checkServicesHealth();
    this.loadRepositories();
  }

  get paginatedScanHistory(): RepositoryMetadata[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.scanHistory.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.scanHistory.length / this.itemsPerPage);
  }


  loadScanHistory(): void {
    this.isLoadingHistory = true;
    
    const sub = this.api.getReports().subscribe({
      next: (reports) => {
        this.scanHistory = (reports || []).map((r, idx) => ({
          id: r.id ?? idx,
          repoUrl: r.repoUrl,
          owner: this.extractOwner(r.repoUrl),
          projectName: this.extractProjectName(r.repoUrl),
          lastScanDate: r.scanDate,
          status: 'completed',
          riskScore: r.riskScore,
          vulnerabilityCount: r.totalVulnerabilities,
          dependencyCount: r.dependencies?.length || 0
        }));
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading scan history:', error);
        console.error('Failed to load scan history');
        this.isLoadingHistory = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  loadRepositories(): void {
    this.isLoadingRepositories = true;
    
    const sub = this.api.getRepositories().subscribe({
      next: (repos) => {
        this.repositories = repos || [];
        this.isLoadingRepositories = false;
      },
      error: (error) => {
        console.error('Error loading repositories:', error);
        this.isLoadingRepositories = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  checkServicesHealth(): void {
    this.isLoadingHealth = true;
    
    const sub = this.api.checkAIServicesHealth().subscribe({
      next: (health) => {
        this.servicesHealth = health;
        this.isLoadingHealth = false;
      },
      error: (error) => {
        console.error('Error checking services health:', error);
        this.servicesHealth = {
          securityScanner: 'unknown',
          nlpExplainer: 'unknown',
          riskModel: 'unknown',
          knowledgeGraph: 'unknown'
        };
        this.isLoadingHealth = false;
      }
    });
    
    this.subscriptions.push(sub);
  }


  onSubmit(): void {
    if (this.scanForm.valid) {
      const repoUrl = this.scanForm.value.repositoryUrl;
      this.store.dispatch(startScan({ repoUrl }));
    }
  }


  private getProgressStep(progress: number): string {
    if (progress < 20) return 'Cloning repository...';
    if (progress < 40) return 'Analyzing dependencies...';
    if (progress < 60) return 'Checking for vulnerabilities...';
    if (progress < 80) return 'Generating risk assessment...';
    if (progress < 90) return 'Finalizing report...';
    return 'Completing scan...';
  }
/*
  completeScan(report: RiskReport): void {
    this.store.dispatch({ type: '[Scan] Complete', results: report });
    this.loadScanHistory();
  }*/

  // Utility methods
  private extractOwner(repoUrl: string): string {
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    return parts[0] || 'unknown';
  }

  private extractProjectName(repoUrl: string): string {
    const parts = repoUrl.replace('https://github.com/', '').split('/');
    return parts[1] || repoUrl;
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

  clearError(): void {
     this.store.dispatch({ type: '[Scan] Clear Error' }); 
  }

  retryScan(): void {
    if (this.scanForm.valid) {
    const repoUrl = this.scanForm.value.repositoryUrl;
    this.store.dispatch(startScan({ repoUrl }));
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
    return report.totalVulnerabilities || 0;
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

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  //pagination methods

  // Computed indexes
  get vulnStartIndex(): number {
    return (this.vulnCurrentPage - 1) * this.vulnItemsPerPage;
  }

  get vulnEndIndex(): number {
    return this.vulnCurrentPage * this.vulnItemsPerPage;
  }

  // Compute total pages dynamically
  get vulnTotalPages(): number {
    if (!this.lastVulnListLength) return 1;
    return Math.ceil(this.lastVulnListLength / this.vulnItemsPerPage);
  }

  private lastVulnListLength = 0;

  // Returns paginated vulnerabilities
  paginatedVulnerabilities(report: RiskReport): any[] {
    const all = this.getAllVulnerabilities(report);
    this.lastVulnListLength = all.length;
    const start = this.vulnStartIndex;
    const end = this.vulnEndIndex;
    return all.slice(start, end);
  }

  // Navigation handlers
  vulnNextPage(): void {
    if (this.vulnCurrentPage < this.vulnTotalPages) {
      this.vulnCurrentPage++;
    }
  }

  vulnPrevPage(): void {
    if (this.vulnCurrentPage > 1) {
      this.vulnCurrentPage--;
    }
  }

}
