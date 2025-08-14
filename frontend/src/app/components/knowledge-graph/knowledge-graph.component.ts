import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge-graph.component.html',
  styleUrl: './knowledge-graph.component.scss'
})
export class KnowledgeGraphComponent implements OnInit {
  
  @ViewChild('graphContainer') private graphContainer!: ElementRef;

  graphData = {
    nodes: [
      { id: 'repo1', label: 'Spring Boot App', type: 'repository', risk: 'medium' },
      { id: 'dep1', label: 'Spring Security', type: 'dependency', risk: 'low' },
      { id: 'dep2', label: 'MySQL Connector', type: 'dependency', risk: 'medium' },
      { id: 'vuln1', label: 'CVE-2023-1234', type: 'vulnerability', risk: 'high' },
      { id: 'vuln2', label: 'CVE-2023-5678', type: 'vulnerability', risk: 'medium' }
    ],
    edges: [
      { source: 'repo1', target: 'dep1', type: 'depends_on' },
      { source: 'repo1', target: 'dep2', type: 'depends_on' },
      { source: 'dep1', target: 'vuln1', type: 'has_vulnerability' },
      { source: 'dep2', target: 'vuln2', type: 'has_vulnerability' }
    ]
  };

  selectedNode: any = null;
  selectedLayout = 'force';
  graphFilters = {
    showRepositories: true,
    showDependencies: true,
    showVulnerabilities: true,
    riskLevel: 'all'
  };

  isLoading = false;
  errorMessage = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadGraphData();
  }

  async loadGraphData() {
    this.isLoading = true;
    try {
      // Load repositories and reports using observables
      this.apiService.getRepositories().subscribe({
        next: (repositories) => {
          this.apiService.getReports().subscribe({
            next: (reports) => {
              // Build graph data from repositories and reports
              this.buildGraphFromData(repositories, reports);
            },
            error: (error) => {
              console.error('Error loading reports:', error);
              this.buildGraphFromData(repositories, []);
            }
          });
        },
        error: (error) => {
          console.error('Error loading repositories:', error);
          this.buildGraphFromData([], []);
        }
      });
      
    } catch (error) {
      this.errorMessage = 'Failed to load graph data. Using sample data instead.';
      console.error('Error loading graph data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  buildGraphFromData(repositories: any[], reports: any[]) {
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Add repository nodes
    repositories.forEach((repo, index) => {
      nodes.push({
        id: `repo_${repo.id}`,
        label: repo.name || repo.repoUrl?.split('/').pop() || `Repository ${index + 1}`,
        type: 'repository',
        risk: this.getRiskLevel(repo.riskScore || 0),
        data: repo
      });
    });

    // Add dependency and vulnerability nodes from reports
    reports.forEach((report, reportIndex) => {
      if (report.dependencies) {
        report.dependencies.forEach((dep: any, depIndex: number) => {
          const depId = `dep_${reportIndex}_${depIndex}`;
          nodes.push({
            id: depId,
            label: dep.name || `Dependency ${depIndex + 1}`,
            type: 'dependency',
            risk: this.getRiskLevel(dep.riskScore || 0),
            data: dep
          });
          
          // Connect to repository
          edges.push({
            source: `repo_${report.id || reportIndex}`,
            target: depId,
            type: 'depends_on'
          });
        });
      }

      if (report.vulnerabilities) {
        report.vulnerabilities.forEach((vuln: any, vulnIndex: number) => {
          const vulnId = `vuln_${reportIndex}_${vulnIndex}`;
          nodes.push({
            id: vulnId,
            label: vuln.cve || vuln.title || `Vulnerability ${vulnIndex + 1}`,
            type: 'vulnerability',
            risk: this.getRiskLevel(vuln.cvssScore || 0),
            data: vuln
          });
          
          // Connect to dependency if available
          if (vuln.dependencyId) {
            edges.push({
              source: `dep_${reportIndex}_${vuln.dependencyId}`,
              target: vulnId,
              type: 'has_vulnerability'
            });
          }
        });
      }
    });

    this.graphData = { nodes, edges };
  }

  getRiskLevel(score: number): string {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  initializeGraph() {
    // Initialize the knowledge graph visualization
    // This would typically use a library like D3.js or ngx-graph
    console.log('Initializing graph with', this.graphData.nodes.length, 'nodes');
  }

  onNodeClick(node: any) {
    this.selectedNode = node;
  }

  getNodeColor(node: any): string {
    switch (node.type) {
      case 'repository': return 'bg-blue-500';
      case 'dependency': return 'bg-green-500';
      case 'vulnerability': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getRiskColor(risk: string): string {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  applyFilters() {
    // Apply graph filters
    this.initializeGraph();
  }

  refreshGraph() {
    this.loadGraphData();
  }

  exportGraph() {
    const dataStr = JSON.stringify(this.graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'knowledge-graph.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  getNodeConnections(nodeId: string): any[] {
    return this.graphData.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );
  }

  getNodeLabel(nodeId: string): string {
    const node = this.graphData.nodes.find(n => n.id === nodeId);
    return node ? node.label : 'Unknown';
  }

  async analyzeNode(node: any) {
    try {
      let result;
      switch (node.type) {
        case 'repository':
          // For repository analysis, we need to provide sample content since we don't have actual code
          result = await this.apiService.analyzeCodeWithAI(
            'sample.java', 
            '// Sample code for analysis\npublic class Sample {\n  // Code would be here\n}', 
            'java'
          ).toPromise();
          break;
        case 'dependency':
          result = await this.apiService.explainVulnerabilityWithNLP(node.data.name || '').toPromise();
          break;
        case 'vulnerability':
          result = await this.apiService.explainVulnerabilityWithNLP(node.data.cve || node.data.title || '').toPromise();
          break;
        default:
          result = 'Analysis not available for this node type.';
      }
      
      // Show analysis result (you could implement a modal or notification)
      console.log('AI Analysis Result:', result);
      alert(`AI Analysis for ${node.label}:\n\n${result}`);
      
    } catch (error) {
      console.error('Error analyzing node:', error);
      alert('Failed to analyze node. Please try again.');
    }
  }

  generateReport(node: any) {
    // Generate a detailed report for the selected node
    const report = {
      node: node,
      timestamp: new Date().toISOString(),
      analysis: `Detailed analysis for ${node.label} (${node.type})`,
      recommendations: this.getRecommendations(node)
    };
    
    // Export report as JSON
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.type}-${node.id}-report.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getRecommendations(node: any): string[] {
    const recommendations: string[] = [];
    
    switch (node.type) {
      case 'repository':
        recommendations.push('Regular security audits', 'Dependency updates', 'Code review processes');
        break;
      case 'dependency':
        if (node.risk === 'high') {
          recommendations.push('Update to latest version', 'Check for alternatives', 'Review security advisories');
        }
        break;
      case 'vulnerability':
        recommendations.push('Apply security patches', 'Update affected dependencies', 'Implement security controls');
        break;
    }
    
    return recommendations;
  }

  getHighRiskCount(): number {
    return this.graphData.nodes.filter(node => node.risk === 'high').length;
  }

  calculateSecurityScore(): number {
    const totalNodes = this.graphData.nodes.length;
    if (totalNodes === 0) return 100;
    
    const highRisk = this.graphData.nodes.filter(node => node.risk === 'high').length;
    const mediumRisk = this.graphData.nodes.filter(node => node.risk === 'medium').length;
    
    // Calculate score: 100 - (high * 20 + medium * 10)
    const score = Math.max(0, 100 - (highRisk * 20 + mediumRisk * 10));
    return Math.round(score);
  }
}
