import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnhancedApiService, RepositoryMetadata, RiskReport, AIServiceHealth } from '../../services/enhanced-api.service';
import { Subscription, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  // Real data from APIs
  repositories: RepositoryMetadata[] = [];
  recentReports: RiskReport[] = [];
  servicesHealth: AIServiceHealth | null = null;

  // Dashboard statistics
  totalRepositories = 0;
  totalVulnerabilities = 0;
  averageRiskScore = 0;
  criticalVulnerabilities = 0;
  highVulnerabilities = 0;

  // Loading state
  isLoading = true;
  isLoadingReports=true;
  isLoadingRepositories=true;
  isLoadingHealth = true;

  // Error state
  errorMessage: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private apiService: EnhancedApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.startPeriodicHealthCheck();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.isLoadingRepositories = true;
    this.isLoadingReports = true;
    this.isLoadingHealth = true;
    this.errorMessage = null;

    const sub = forkJoin({
      repos: this.apiService.getRepositories(),
      reports: this.apiService.getReports(),
      health: this.apiService.checkAIServicesHealth()
    })
    .pipe(finalize(() => {
      this.isLoading = false
      this.isLoadingReports = false;
      this.isLoadingRepositories = false;
      this.isLoadingHealth = false;
    
    }))
    
    .subscribe({
      next: ({ repos, reports, health }) => {
        this.repositories = repos || [];
        this.recentReports = (reports || []).slice(0, 5);
        this.servicesHealth = health;

        this.totalRepositories = this.repositories.length;
        this.calculateDashboardStats();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.errorMessage = 'Failed to load dashboard data';
      }
    });

    this.subscriptions.push(sub);
  }

  startPeriodicHealthCheck(): void {
    // Check health every 30 seconds
    const healthCheckInterval = setInterval(() => {
      const sub = this.apiService.checkAIServicesHealth().subscribe({
        next: (health) => this.servicesHealth = health,
        error: () => {
          this.servicesHealth = {
            securityScanner: 'unhealthy',
            nlpExplainer: 'unhealthy',
            riskModel: 'unhealthy',
            knowledgeGraph: 'unhealthy'
          };
        }
      });
      this.subscriptions.push(sub);
    }, 30000);

    // Clean up interval on component destroy
    this.subscriptions.push(new Subscription(() => clearInterval(healthCheckInterval)));
  }

  calculateDashboardStats(): void {
    // Total vulnerabilities
    console.log(this.recentReports);
    this.totalVulnerabilities = this.recentReports.reduce(
      (total, r) => total + (r.totalVulnerabilities || 0), 0
    );

    // Average risk score
    const validReports = this.recentReports.filter(r => r.riskScore !== undefined);
    if (validReports.length > 0) {
      this.averageRiskScore = validReports.reduce(
        (sum, r) => sum + (r.riskScore || 0), 0
      ) / validReports.length;
    }

    // Critical & high vulnerabilities
    this.criticalVulnerabilities = this.recentReports.reduce(
      (total, r) => total + (r.criticalVulnerabilities || 0), 0
    );
    this.highVulnerabilities = this.recentReports.reduce(
      (total, r) => total + (r.highVulnerabilities || 0), 0
    );
  }

  getRiskLevel(score: number): string {
    if (score >= 8.0) return 'critical';
    if (score >= 6.0) return 'high';
    if (score >= 4.0) return 'medium';
    if (score >= 2.0) return 'low';
    return 'minimal';
  }

  getRiskColor(score: number): string {
    switch (this.getRiskLevel(score)) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getServiceHealthColor(service: string): string {
    if (!this.servicesHealth) return 'text-gray-600 bg-gray-100';
    const health = this.servicesHealth[service as keyof AIServiceHealth];
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getServiceHealthIcon(service: string): string {
    if (!this.servicesHealth) return 'question-circle';
    const health = this.servicesHealth[service as keyof AIServiceHealth];
    switch (health) {
      case 'healthy': return 'check-circle';
      case 'unhealthy': return 'times-circle';
      default: return 'question-circle';
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  clearError(): void {
    this.errorMessage = null;
  }

  getRepositoryName(repoUrl: string): string {
    return repoUrl.split('/').pop() || repoUrl;
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
