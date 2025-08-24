import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EnhancedApiService, RepositoryMetadata, RiskReport, AIServiceHealth } from '../../services/enhanced-api.service';
import { Subscription } from 'rxjs';

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
  
  // Loading states
  isLoading = true;
  isLoadingRepositories = false;
  isLoadingReports = false;
  isLoadingHealth = false;
  
  // Error states
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
    this.errorMessage = null;

    // Load repositories
    this.loadRepositories();
    
    // Load recent reports
    this.loadRecentReports();
    
    // Load services health
    this.loadServicesHealth();
  }

  loadRepositories(): void {
    this.isLoadingRepositories = true;
    
    const sub = this.apiService.getRepositories().subscribe({
      next: (repos) => {
        this.repositories = repos || [];
        this.totalRepositories = this.repositories.length;
        this.calculateDashboardStats();
        this.isLoadingRepositories = false;
      },
      error: (error) => {
        console.error('Error loading repositories:', error);
        this.errorMessage = 'Failed to load repositories';
        this.isLoadingRepositories = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  loadRecentReports(): void {
    this.isLoadingReports = true;
    
    const sub = this.apiService.getReports().subscribe({
      next: (reports) => {
        this.recentReports = (reports || []).slice(0, 5); // Get latest 5 reports
        this.calculateDashboardStats();
        this.isLoadingReports = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.errorMessage = 'Failed to load recent reports';
        this.isLoadingReports = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  loadServicesHealth(): void {
    this.isLoadingHealth = true;
    
    const sub = this.apiService.checkAIServicesHealth().subscribe({
      next: (health) => {
        this.servicesHealth = health;
        this.isLoadingHealth = false;
      },
      error: (error) => {
        console.error('Error loading services health:', error);
        this.servicesHealth = {
          securityScanner: 'unhealthy',
          nlpExplainer: 'unhealthy',
          riskModel: 'unhealthy',
          knowledgeGraph: 'unhealthy'
        };
        this.isLoadingHealth = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  startPeriodicHealthCheck(): void {
    // Check health every 30 seconds
    const healthCheckInterval = setInterval(() => {
      this.loadServicesHealth();
    }, 30000);
    
    // Clean up interval on component destroy
    this.subscriptions.push(new Subscription(() => {
      clearInterval(healthCheckInterval);
    }));
  }

  calculateDashboardStats(): void {
    // Calculate total vulnerabilities from all reports
    this.totalVulnerabilities = this.recentReports.reduce((total, report) => {
      return total + (report.totalVulnerabilities || 0);
    }, 0);
    
    // Calculate average risk score
    const validReports = this.recentReports.filter(r => r.riskScore !== undefined);
    if (validReports.length > 0) {
      this.averageRiskScore = validReports.reduce((sum, report) => sum + (report.riskScore || 0), 0) / validReports.length;
    }
    
    // Calculate critical and high vulnerabilities
    this.criticalVulnerabilities = this.recentReports.reduce((total, report) => {
      return total + (report.criticalVulnerabilities || 0);
    }, 0);
    
    this.highVulnerabilities = this.recentReports.reduce((total, report) => {
      return total + (report.highVulnerabilities || 0);
    }, 0);
    
    // Update loading state
    if (!this.isLoadingRepositories && !this.isLoadingReports && !this.isLoadingHealth) {
      this.isLoading = false;
    }
  }

  getRiskLevel(riskScore: number): string {
    if (riskScore >= 8.0) return 'critical';
    if (riskScore >= 6.0) return 'high';
    if (riskScore >= 4.0) return 'medium';
    if (riskScore >= 2.0) return 'low';
    return 'minimal';
  }

  getRiskColor(riskScore: number): string {
    const level = this.getRiskLevel(riskScore);
    switch (level) {
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
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }
}
