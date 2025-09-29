import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnhancedApiService } from '../../services/enhanced-api.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge-graph.component.html',
  styleUrl: './knowledge-graph.component.scss'
})
export class KnowledgeGraphComponent implements OnInit {
  
  @ViewChild('graphContainer') private graphContainer!: ElementRef;

  graphData: { nodes: any[]; edges: any[] } = { nodes: [], edges: [] };
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

  private simulation: d3.Simulation<any, undefined> | null = null;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoom: any;

  constructor(private apiService: EnhancedApiService) {}

  ngOnInit() {
    this.loadGraphData();
  }

  async loadGraphData() {
    this.isLoading = true;
    try {
      this.apiService.getRepositories().subscribe({
        next: (repositories) => {
          this.apiService.getReports().subscribe({
            next: (reports) => {
              this.buildGraphFromData(repositories, reports);
              setTimeout(() => this.initializeGraph());
            },
            error: (error) => {
              console.error('Error loading reports:', error);
              this.buildGraphFromData(repositories, []);
              setTimeout(() => this.initializeGraph());
            }
          });
        },
        error: (error) => {
          console.error('Error loading repositories:', error);
          this.buildGraphFromData([], []);
          setTimeout(() => this.initializeGraph());
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
    
    // Repo nodes
    repositories.forEach((repo, index) => {
      nodes.push({
        id: `repo_${repo.id}`,
        label: repo.name || repo.repoUrl?.split('/').pop() || `Repository ${index + 1}`,
        type: 'repository',
        risk: this.getRiskLevel(repo.riskScore || 0),
        data: repo
      });
    });

    // Dependencies + vulnerabilities
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
          edges.push({ source: `repo_${report.id || reportIndex}`, target: depId, type: 'depends_on' });
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
          if (vuln.dependencyId) {
            edges.push({ source: `dep_${reportIndex}_${vuln.dependencyId}`, target: vulnId, type: 'has_vulnerability' });
          }
        });
      }
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    const safeEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    this.graphData = { nodes, edges: safeEdges };
  }

  getRiskLevel(score: number): string {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  initializeGraph() {
    const container = this.graphContainer?.nativeElement as HTMLElement;
    if (!container) return;

    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 400;

    this.svg = d3.select(container).append('svg').attr('width', '100%').attr('height', '100%');
    this.g = this.svg.append('g');

    this.zoom = d3.zoom().on('zoom', (event) => {
      this.g.attr('transform', event.transform);
      // Hide labels when zoomed out
      labels.style('display', event.transform.k > 0.7 ? 'block' : 'none');
    });
    this.svg.call(this.zoom);

    const color = (type: string) => {
      switch (type) {
        case 'repository': return '#3b82f6';
        case 'dependency': return '#10b981';
        case 'vulnerability': return '#ef4444';
        default: return '#9ca3af';
      }
    };

    const link = this.g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.graphData.edges)
      .enter().append('line')
      .attr('stroke-width', 1.5);

    const node = this.g.append('g')
      .selectAll('circle')
      .data(this.graphData.nodes)
      .enter().append('circle')
      .attr('r', 6)
      .attr('fill', d => color(d.type))
      .call(
        d3.drag<SVGCircleElement, any>()
          .on('start', (event, d) => {
            if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active && this.simulation) this.simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (_, d: any) => this.onNodeClick(d));

    // ✅ labels with tooltip
    const labels = this.g.append('g')
      .selectAll('text')
      .data(this.graphData.nodes)
      .enter().append('text')
      .text(d => d.label.length > 15 ? d.label.slice(0, 15) + "…" : d.label) // truncate
      .attr('font-size', '10px')
      .attr('fill', '#374151');

    node.append('title').text((d: any) => d.label); // tooltip with full text

    // 🔑 Switch layouts
    if (this.selectedLayout === 'force') {
      // Force-directed with collision
      this.simulation = d3.forceSimulation(this.graphData.nodes as any)
        .force('link', d3.forceLink(this.graphData.edges as any).id((d: any) => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(30)) // 👈 prevent overlap
        .alphaDecay(0.05)
        .on('tick', () => {
          link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
              .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
          node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
          labels.attr('x', (d: any) => d.x + 10).attr('y', (d: any) => d.y + 3);
        })
        .on('end', () => this.zoomToFit());

    } else if (this.selectedLayout === 'hierarchical') {
      // Hierarchical: repos → deps → vulns
      const levels: Record<string, number> = { repository: 0, dependency: 1, vulnerability: 2 };
      const layerHeight = height / 3;

      this.graphData.nodes.forEach((n, i) => {
        n.x = (i % 10) * 100 + 50;
        n.y = levels[n.type] * layerHeight + 50;
      });

      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      labels
        .attr('x', (d: any, i) => d.x + (i % 2 === 0 ? 12 : -12)) // stagger
        .attr('y', (d: any, i) => d.y + (i % 3 === 0 ? -12 : 12));

      this.zoomToFit();

    } else if (this.selectedLayout === 'circular') {
      // Circular layout
      const radius = Math.min(width, height) / 2 - 50;
      const angleStep = (2 * Math.PI) / this.graphData.nodes.length;

      this.graphData.nodes.forEach((n, i) => {
        n.x = width / 2 + radius * Math.cos(i * angleStep);
        n.y = height / 2 + radius * Math.sin(i * angleStep);
      });

      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      labels
        .attr('x', (d: any, i) => d.x + (i % 2 === 0 ? 12 : -12))
        .attr('y', (d: any, i) => d.y + (i % 3 === 0 ? -12 : 12));

      this.zoomToFit();
    }
  }

  private zoomToFit() {
    const bounds = this.g.node()?.getBBox();
    if (!bounds) return;

    const fullWidth = this.graphContainer.nativeElement.clientWidth;
    const fullHeight = this.graphContainer.nativeElement.clientHeight;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;

    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
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

  applyFilters() {
  // Filter nodes based on type checkboxes
    const filteredNodes = this.graphData.nodes.filter(node => {
      if (node.type === 'repository' && !this.graphFilters.showRepositories) return false;
      if (node.type === 'dependency' && !this.graphFilters.showDependencies) return false;
      if (node.type === 'vulnerability' && !this.graphFilters.showVulnerabilities) return false;
      
      // Optional: filter by risk level
      if (this.graphFilters.riskLevel !== 'all' && node.risk !== this.graphFilters.riskLevel) return false;

      return true;
    });

    // Filter edges to only include connections between filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = this.graphData.edges.filter(
      e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );

    // Temporarily replace graphData with filtered data for rendering
    const originalGraphData = this.graphData;
    this.graphData = { nodes: filteredNodes, edges: filteredEdges };

    // Re-initialize the graph
    this.initializeGraph();

    // Restore original graphData if needed for future filters
    this.graphData = originalGraphData;
  }


  refreshGraph() {
    this.loadGraphData();
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
