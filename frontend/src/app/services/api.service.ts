import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RepositoryMetadata {
  id: number;
  repoUrl: string;
  owner: string;
  projectName: string;
  lastScanDate?: string;
  status?: string;
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

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  // Repository scanning
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
        catchError(this.handleError)
      );
  }

  // Repository management
  getRepositories(owner?: string): Observable<RepositoryMetadata[]> {
    const params = owner ? new HttpParams().set('owner', owner) : new HttpParams();
    return this.http.get<RepositoryMetadata[]>(`${this.baseUrl}/repo/all`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getRepositoryById(id: number): Observable<RepositoryMetadata> {
    return this.http.get<RepositoryMetadata>(`${this.baseUrl}/repo/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Risk reports
  getReports(): Observable<RiskReport[]> {
    return this.http.get<RiskReport[]>(`${this.baseUrl}/repo/reports`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getReportById(id: number): Observable<RiskReport> {
    return this.http.get<RiskReport>(`${this.baseUrl}/repo/reports/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Vulnerability management
  getAllVulnerabilities(): Observable<Vulnerability[]> {
    return this.getReports().pipe(
      map(reports => reports.flatMap(r => r.dependencies || []).flatMap(d => d.vulnerabilities || [])),
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
        catchError(this.handleError)
      );
  }

  // AI-ML Services integration
  analyzeCodeWithAI(filename: string, content: string, language: string): Observable<any> {
    const body = { filename, content, language };
    return this.http.post(`${environment.aiServices.securityScanner}/scan/security`, body)
      .pipe(
        catchError(this.handleError)
      );
  }

  explainVulnerabilityWithNLP(vulnerabilityText: string): Observable<any> {
    const body = { text: vulnerabilityText };
    return this.http.post(`${environment.aiServices.nlpExplainer}/explain`, body)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRiskPrediction(dependencies: Dependency[]): Observable<any> {
    const body = { dependencies };
    return this.http.post(`${environment.aiServices.riskModel}/predict`, body)
      .pipe(
        catchError(this.handleError)
      );
  }

  generateKnowledgeGraph(repoUrl: string): Observable<any> {
    const body = { repository_url: repoUrl };
    return this.http.post(`${environment.aiServices.knowledgeGraph}/generate`, body)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Health checks
  checkBackendHealth(): Observable<any> {
    return this.http.get(`${environment.backendUrl}/actuator/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  checkAIServicesHealth(): Observable<any> {
    const healthChecks = [
      this.http.get(`${environment.aiServices.securityScanner}/health`),
      this.http.get(`${environment.aiServices.nlpExplainer}/health`),
      this.http.get(`${environment.aiServices.riskModel}/health`),
      this.http.get(`${environment.aiServices.knowledgeGraph}/health`)
    ];
    
    return new Observable(observer => {
      Promise.all(healthChecks.map(check => check.toPromise()))
        .then(results => {
          const health = {
            securityScanner: results[0] ? 'healthy' : 'unhealthy',
            nlpExplainer: results[1] ? 'healthy' : 'unhealthy',
            riskModel: results[2] ? 'healthy' : 'unhealthy',
            knowledgeGraph: results[3] ? 'healthy' : 'unhealthy'
          };
          observer.next(health);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // Utility methods
  private getSeverityFromCvss(cvssScore: number): string {
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    if (cvssScore >= 0.1) return 'low';
    return 'none';
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.message || error.message || 'An error occurred'));
  }
}
