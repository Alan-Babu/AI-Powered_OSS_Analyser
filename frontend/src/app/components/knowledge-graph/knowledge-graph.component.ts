import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './knowledge-graph.component.html',
  styleUrl: './knowledge-graph.component.scss'
})
export class KnowledgeGraphComponent implements OnInit {
  
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
  graphFilters = {
    showRepositories: true,
    showDependencies: true,
    showVulnerabilities: true,
    riskLevel: 'all'
  };

  ngOnInit() {
    this.initializeGraph();
  }

  initializeGraph() {
    // Initialize the knowledge graph visualization
    // This would typically use a library like D3.js or ngx-graph
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
}
