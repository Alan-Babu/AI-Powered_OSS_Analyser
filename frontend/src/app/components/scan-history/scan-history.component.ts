import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnhancedApiService, RiskReport } from '../../services/enhanced-api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scan-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scan-history.component.html',
  styleUrls: ['./scan-history.component.scss']
})
export class ScanHistoryComponent implements OnInit, OnDestroy {
  reports: RiskReport[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private readonly api: EnhancedApiService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadReports(): void {
    this.isLoading = true;
    const sub = this.api.getReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load reports', err);
        this.errorMessage = 'Failed to load scan history';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getRepoName(url: string): string {
    return url?.split('/').pop() || url;
  }

  getDependencyCount(report: RiskReport): number {
    return (report?.dependencies || []).length;
  }

  getVulnerabilityCount(report: RiskReport): number {
    const deps = report?.dependencies || [];
    let total = 0;
    for (const dep of deps) {
      total += (dep?.vulnerabilities || []).length;
    }
    return total;
  }
}


