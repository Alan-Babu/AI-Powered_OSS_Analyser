import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface RepositoryMetadata {
  id: number;
  repoUrl: string;
  owner: string;
  projectName: string;
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
  severity: string;
  status: string;
  discovered: string;
  affected: string[];
  cvss: number;
}

export interface Dependency {
  id: number;
  name: string;
  version: string;
  outdated: boolean;
  vulnerable: boolean;
  ecosystem: string;
  vulnerabilities: Vulnerability[];
}

export interface RiskReport {
  id: number;
  repoUrl: string;
  riskScore: number;
  dependencies: Dependency[];
  dependenciestemp:{
    total: number;
    vulnerable: number;
    direct: number;
    outdated: number;
  };
  repository: {
    name: string;
    language: string;
    size: number;
  };
  security:{
    overallRisk: string;
    riskScore: number;
    vulnerabilities: Vulnerability[];
  };
  license: {
    type: string;
    risk: string;
    compatible: boolean;
  }

}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  // Backend base URL; switch to environment variable for multi-env setups
  private readonly baseUrl = 'http://localhost:8080/api';

  scanRepository(url: string): Observable<RiskReport> {
    const params = new HttpParams().set('url', url);
    return this.http.post<RiskReport>(`${this.baseUrl}/repo/scan`, null, { params });
  }

  getRepositories(owner?: string): Observable<RepositoryMetadata[]> {
    const params = owner ? new HttpParams().set('owner', owner) : undefined as unknown as HttpParams | undefined;
    return this.http.get<RepositoryMetadata[]>(`${this.baseUrl}/repo/all`, { params });
  }

  getReports(): Observable<RiskReport[]> {
    return this.http.get<RiskReport[]>(`${this.baseUrl}/repo/reports`);
  }

  // Helpers
  getAllVulnerabilities(): Observable<Vulnerability[]> {
    return this.getReports().pipe(
      map(reports => reports.flatMap(r => r.dependencies || []).flatMap(d => d.vulnerabilities || []))
    );
  }
}
