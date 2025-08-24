import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RepositoryMetadata {
  id: number;
  repoUrl: string;
  owner: string;
  projectName: string;
  lastScanDate?: string;
  status?: string;
  riskScore?: number;
  vulnerabilityCount?: number;
  dependencyCount?: number;
}

export interface Vulnerability {
  id: number;
  cve: string;
  title: string;
  description: string;
  cvssScore: number;
  reference: string;
  fixVersion: string;
  remediation: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'fixed' | 'investigating';
  aiInsights?: any;
}

export interface Dependency {
  id: number;
  name: string;
  version: string;
  outdated: boolean;
  vulnerable: boolean;
  ecosystem: string;
  vulnerabilities: Vulnerability[];
  latestVersion?: string;
  license?: string;
  riskScore?: number;
  riskLevel?: string;
  aiInsights?: any;
  recommendations?: string[];
}

export interface RiskReport {
  id: number;
  repoUrl: string;
  riskScore: number;
  dependencies: Dependency[];
  scanDate?: string;
  scanDuration?: number;
  totalVulnerabilities?: number;
  criticalVulnerabilities?: number;
  highVulnerabilities?: number;
  mediumVulnerabilities?: number;
  lowVulnerabilities?: number;
  aiInsights?: any;
  recommendations?: string[];
}

export interface ScanRequest {
  url: string;
  scanType?: 'full' | 'quick' | 'security-only';
  includeDependencies?: boolean;
  includeVulnerabilities?: boolean;
  includeLicenseCheck?: boolean;
  includeCodeAnalysis?: boolean;
}

export interface ScanProgress {
  status: 'scanning' | 'analyzing' | 'generating-report' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
}

export interface AIServiceHealth {
  securityScanner: string;
  nlpExplainer: string;
  riskModel: string;
  knowledgeGraph: string;
}

export interface ChatMessage {
  message: string;
  response?: string;
  timestamp: Date;
  type: 'user' | 'ai';
}

@Injectable({ providedIn: 'root' })
export class EnhancedApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  
  // Observable for real-time updates
  private scanProgressSubject = new BehaviorSubject<ScanProgress | null>(null);
  public scanProgress$ = this.scanProgressSubject.asObservable();
  
  private servicesHealthSubject = new BehaviorSubject<AIServiceHealth | null>(null);
  public servicesHealth$ = this.servicesHealthSubject.asObservable();

  // Repository scanning with enhanced features
  scanRepository(request: ScanRequest): Observable<RiskReport> {
    const params = new HttpParams()
      .set('url', request.url)
      .set('scanType', request.scanType || 'full')
      .set('includeDependencies', request.includeDependencies?.toString() || 'true')
      .set('includeVulnerabilities', request.includeVulnerabilities?.toString() || 'true')
      .set('includeLicenseCheck', request.includeLicenseCheck?.toString() || 'true')
      .set('includeCodeAnalysis', request.includeCodeAnalysis?.toString() || 'false');
    
    return this.http.post<RiskReport>(`${this.baseUrl}/repo/scan`, null, { params })
      .pipe(
        map(report => this.enhanceReportWithAIInsights(report)),
        catchError(this.handleError)
      );
  }

  // Enhanced repository management
  getRepositories(owner?: string): Observable<RepositoryMetadata[]> {
    const params = owner ? new HttpParams().set('owner', owner) : new HttpParams();
    return this.http.get<RepositoryMetadata[]>(`${this.baseUrl}/repo/all`, { params })
      .pipe(
        map(repos => repos.map(repo => this.enhanceRepositoryMetadata(repo))),
        catchError(this.handleError)
      );
  }

  getRepositoryById(id: number): Observable<RepositoryMetadata> {
    return this.http.get<RepositoryMetadata>(`${this.baseUrl}/repo/${id}`)
      .pipe(
        map(repo => this.enhanceRepositoryMetadata(repo)),
        catchError(this.handleError)
      );
  }

  // Enhanced risk reports
  getReports(): Observable<RiskReport[]> {
    return this.http.get<RiskReport[]>(`${this.baseUrl}/repo/reports`)
      .pipe(
        map(reports => reports.map(report => this.enhanceReportWithAIInsights(report))),
        catchError(this.handleError)
      );
  }

  getReportById(id: number): Observable<RiskReport> {
    return this.http.get<RiskReport>(`${this.baseUrl}/repo/reports/${id}`)
      .pipe(
        map(report => this.enhanceReportWithAIInsights(report)),
        catchError(this.handleError)
      );
  }

  // Enhanced vulnerability management
  getAllVulnerabilities(): Observable<Vulnerability[]> {
    return this.getReports().pipe(
      map(reports => reports.flatMap(r => r.dependencies || []).flatMap(d => d.vulnerabilities || [])),
      map(vulns => vulns.map(vuln => this.enhanceVulnerabilityWithAI(vuln))),
      catchError(this.handleError)
    );
  }

  getVulnerabilitiesBySeverity(severity: string): Observable<Vulnerability[]> {
    return this.getAllVulnerabilities().pipe(
      map(vulns => vulns.filter(v => v.severity === severity || this.getSeverityFromCvss(v.cvssScore) === severity)),
      catchError(this.handleError)
    );
  }

  updateVulnerabilityStatus(vulnId: number, status: string): Observable<Vulnerability> {
    return this.http.patch<Vulnerability>(`${this.baseUrl}/vulnerabilities/${vulnId}/status`, { status })
      .pipe(
        map(vuln => this.enhanceVulnerabilityWithAI(vuln)),
        catchError(this.handleError)
      );
  }

  // Enhanced AI-ML Services integration
  analyzeCodeWithAI(filename: string, content: string, language: string): Observable<any> {
    const body = { filename, content, language };
    return this.http.post(`${environment.aiServices.securityScanner}/scan/security`, body)
      .pipe(
        map(result => this.enhanceSecurityScanResult(result)),
        catchError(this.handleError)
      );
  }

  explainVulnerabilityWithNLP(vulnerabilityText: string): Observable<any> {
    const body = { text: vulnerabilityText };
    return this.http.post(`${environment.aiServices.nlpExplainer}/explain`, body)
      .pipe(
        map(result => this.enhanceNLPResult(result)),
        catchError(this.handleError)
      );
  }

  getRiskPrediction(dependencies: Dependency[]): Observable<any> {
    const body = { dependencies };
    return this.http.post(`${environment.aiServices.riskModel}/predict`, body)
      .pipe(
        map(result => this.enhanceRiskPrediction(result)),
        catchError(this.handleError)
      );
  }

  generateKnowledgeGraph(repoUrl: string): Observable<any> {
    const body = { repository_url: repoUrl };
    return this.http.post(`${environment.aiServices.knowledgeGraph}/generate`, body)
      .pipe(
        map(result => this.enhanceKnowledgeGraphResult(result)),
        catchError(this.handleError)
      );
  }

  // Enhanced chat functionality
  chatWithAI(message: string): Observable<ChatMessage> {
    const body = { message };
    return this.http.post<{response: string}>(`${this.baseUrl}/chat`, body)
      .pipe(
        map(response => ({
          message: message,
          response: response.response,
          timestamp: new Date(),
          type: 'ai' as const
        })),
        catchError(this.handleError)
      );
  }

  // Enhanced health checks
  checkBackendHealth(): Observable<any> {
    return this.http.get(`${environment.backendUrl}/api/repo/health`)
      .pipe(
        map(health => this.enhanceHealthData(health)),
        catchError(this.handleError)
      );
  }

  checkAIServicesHealth(): Observable<AIServiceHealth> {
    const healthChecks = [
      this.http.get(`${environment.aiServices.securityScanner}/health`),
      this.http.get(`${environment.aiServices.nlpExplainer}/health`),
      this.http.get(`${environment.aiServices.riskModel}/health`),
      this.http.get(`${environment.aiServices.knowledgeGraph}/health`)
    ];
    
    return new Observable(observer => {
      Promise.all(healthChecks.map(check => check.toPromise()))
        .then(results => {
          const health: AIServiceHealth = {
            securityScanner: results[0] ? 'healthy' : 'unhealthy',
            nlpExplainer: results[1] ? 'healthy' : 'unhealthy',
            riskModel: results[2] ? 'healthy' : 'unhealthy',
            knowledgeGraph: results[3] ? 'healthy' : 'unhealthy'
          };
          
          this.servicesHealthSubject.next(health);
          observer.next(health);
          observer.complete();
        })
        .catch(error => {
          const health: AIServiceHealth = {
            securityScanner: 'unhealthy',
            nlpExplainer: 'unhealthy',
            riskModel: 'unhealthy',
            knowledgeGraph: 'unhealthy'
          };
          this.servicesHealthSubject.next(health);
          observer.next(health);
          observer.complete();
        });
    });
  }

  // Data enhancement methods
  private enhanceReportWithAIInsights(report: RiskReport): RiskReport {
    if (!report) return report;
    
    // Calculate vulnerability counts
    const allVulns = (report.dependencies || []).flatMap(d => d.vulnerabilities || []);
    report.totalVulnerabilities = allVulns.length;
    report.criticalVulnerabilities = allVulns.filter(v => this.getSeverityFromCvss(v.cvssScore) === 'critical').length;
    report.highVulnerabilities = allVulns.filter(v => this.getSeverityFromCvss(v.cvssScore) === 'high').length;
    report.mediumVulnerabilities = allVulns.filter(v => this.getSeverityFromCvss(v.cvssScore) === 'medium').length;
    report.lowVulnerabilities = allVulns.filter(v => this.getSeverityFromCvss(v.cvssScore) === 'low').length;
    
    // Add AI insights if not present
    if (!report.aiInsights) {
      report.aiInsights = {
        overallRiskLevel: this.getRiskLevel(report.riskScore),
        recommendations: this.generateRecommendations(report)
      };
    }
    
    return report;
  }

  private enhanceRepositoryMetadata(repo: RepositoryMetadata): RepositoryMetadata {
    if (!repo) return repo;
    
    // Add calculated fields if not present
    if (!repo.riskScore) repo.riskScore = 0;
    if (!repo.vulnerabilityCount) repo.vulnerabilityCount = 0;
    if (!repo.dependencyCount) repo.dependencyCount = 0;
    
    return repo;
  }

  private enhanceVulnerabilityWithAI(vuln: Vulnerability): Vulnerability {
    if (!vuln) return vuln;
    
    // Add AI insights if not present
    if (!vuln.aiInsights) {
      vuln.aiInsights = {
        severity: this.getSeverityFromCvss(vuln.cvssScore),
        riskFactors: this.identifyRiskFactors(vuln),
        recommendations: this.generateVulnerabilityRecommendations(vuln)
      };
    }
    
    return vuln;
  }

  private enhanceSecurityScanResult(result: any): any {
    return {
      ...result,
      enhanced: true,
      timestamp: new Date().toISOString()
    };
  }

  private enhanceNLPResult(result: any): any {
    return {
      ...result,
      enhanced: true,
      timestamp: new Date().toISOString()
    };
  }

  private enhanceRiskPrediction(result: any): any {
    return {
      ...result,
      enhanced: true,
      timestamp: new Date().toISOString()
    };
  }

  private enhanceKnowledgeGraphResult(result: any): any {
    return {
      ...result,
      enhanced: true,
      timestamp: new Date().toISOString()
    };
  }

  private enhanceHealthData(health: any): any {
    return {
      ...health,
      enhanced: true,
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  private getSeverityFromCvss(cvssScore: number): string {
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    if (cvssScore >= 0.1) return 'low';
    return 'none';
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 8.0) return 'critical';
    if (riskScore >= 6.0) return 'high';
    if (riskScore >= 4.0) return 'medium';
    if (riskScore >= 2.0) return 'low';
    return 'minimal';
  }

  private generateRecommendations(report: RiskReport): string[] {
    const recommendations: string[] = [];
    
    if (report.criticalVulnerabilities && report.criticalVulnerabilities > 0) {
      recommendations.push(`Address ${report.criticalVulnerabilities} critical vulnerabilities immediately`);
    }
    
    if (report.highVulnerabilities && report.highVulnerabilities > 0) {
      recommendations.push(`Review and fix ${report.highVulnerabilities} high-severity vulnerabilities`);
    }
    
    if (report.riskScore && report.riskScore > 7.0) {
      recommendations.push('Consider implementing additional security measures');
    }
    
    return recommendations;
  }

  private identifyRiskFactors(vuln: Vulnerability): string[] {
    const factors: string[] = [];
    
    if (vuln.cvssScore >= 9.0) {
      factors.push('Critical severity vulnerability');
    }
    
    if (vuln.description && vuln.description.toLowerCase().includes('remote')) {
      factors.push('Remote code execution possible');
    }
    
    if (vuln.description && vuln.description.toLowerCase().includes('authentication')) {
      factors.push('Authentication bypass possible');
    }
    
    return factors;
  }

  private generateVulnerabilityRecommendations(vuln: Vulnerability): string[] {
    const recommendations: string[] = [];
    
    if (vuln.fixVersion) {
      recommendations.push(`Update to version ${vuln.fixVersion} or later`);
    }
    
    if (vuln.remediation) {
      recommendations.push(vuln.remediation);
    }
    
    if (vuln.cvssScore >= 7.0) {
      recommendations.push('Implement additional security monitoring');
    }
    
    return recommendations;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.message || error.message || 'An error occurred'));
  }

  // Update scan progress
  updateScanProgress(progress: ScanProgress): void {
    this.scanProgressSubject.next(progress);
  }

  // Clear scan progress
  clearScanProgress(): void {
    this.scanProgressSubject.next(null);
  }
}
