from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import logging
import networkx as nx
import json
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Knowledge Graph Service",
    description="AI-powered dependency relationship analysis and knowledge graph generation",
    version="1.0.0"
)

class DependencyNode(BaseModel):
    name: str
    version: str
    ecosystem: str
    package_manager: str = Field(..., description="Package manager (npm, pip, maven, etc.)")
    description: Optional[str] = None
    homepage: Optional[str] = None
    repository: Optional[str] = None
    license: Optional[str] = None
    maintainers: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

class DependencyRelationship(BaseModel):
    source: str = Field(..., description="Source dependency name")
    target: str = Field(..., description="Target dependency name")
    relationship_type: str = Field(..., description="Type of relationship (depends_on, conflicts_with, etc.)")
    strength: float = Field(..., ge=0.0, le=1.0, description="Relationship strength")
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GraphAnalysisRequest(BaseModel):
    dependencies: List[DependencyNode]
    relationships: List[DependencyRelationship]

class GraphAnalysisResult(BaseModel):
    total_nodes: int
    total_edges: int
    connected_components: int
    average_degree: float
    max_degree: int
    dependency_chains: List[List[str]]
    circular_dependencies: List[List[str]]
    isolated_packages: List[str]
    central_packages: List[str]
    risk_clusters: List[List[str]]
    graph_metrics: Dict[str, Any]

class DependencyInsight(BaseModel):
    package_name: str
    insight_type: str
    description: str
    severity: str
    recommendations: List[str]

class KnowledgeGraphService:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.package_data = {}
        
    def build_graph(self, dependencies: List[DependencyNode], relationships: List[DependencyRelationship]):
        """Build the knowledge graph from dependencies and relationships"""
        self.graph.clear()
        self.package_data.clear()
        
        # Add nodes
        for dep in dependencies:
            node_id = f"{dep.ecosystem}:{dep.name}"
            self.graph.add_node(node_id, **dep.dict())
            self.package_data[node_id] = dep.dict()
        
        # Add edges
        for rel in relationships:
            source_id = f"{rel.source}"
            target_id = f"{rel.target}"
            
            if source_id in self.graph and target_id in self.graph:
                self.graph.add_edge(source_id, target_id, 
                                  relationship_type=rel.relationship_type,
                                  strength=rel.strength,
                                  **rel.metadata)
        
        logger.info(f"Built graph with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
    
    def analyze_graph(self) -> GraphAnalysisResult:
        """Analyze the knowledge graph for insights"""
        if self.graph.number_of_nodes() == 0:
            raise ValueError("Graph is empty")
        
        # Basic metrics
        total_nodes = self.graph.number_of_nodes()
        total_edges = self.graph.number_of_edges()
        connected_components = nx.number_strongly_connected_components(self.graph)
        
        # Degree analysis
        degrees = dict(self.graph.degree())
        average_degree = sum(degrees.values()) / len(degrees) if degrees else 0
        max_degree = max(degrees.values()) if degrees else 0
        
        # Find dependency chains
        dependency_chains = self._find_dependency_chains()
        
        # Find circular dependencies
        circular_dependencies = self._find_circular_dependencies()
        
        # Find isolated packages
        isolated_packages = [node for node, degree in degrees.items() if degree == 0]
        
        # Find central packages (high betweenness centrality)
        centrality = nx.betweenness_centrality(self.graph)
        central_packages = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:10]
        central_packages = [pkg[0] for pkg in central_packages]
        
        # Find risk clusters
        risk_clusters = self._find_risk_clusters()
        
        # Additional metrics
        graph_metrics = {
            "density": nx.density(self.graph),
            "clustering_coefficient": nx.average_clustering(self.graph),
            "diameter": nx.diameter(self.graph) if nx.is_connected(self.graph.to_undirected()) else None,
            "average_path_length": nx.average_shortest_path_length(self.graph) if nx.is_strongly_connected(self.graph) else None
        }
        
        return GraphAnalysisResult(
            total_nodes=total_nodes,
            total_edges=total_edges,
            connected_components=connected_components,
            average_degree=average_degree,
            max_degree=max_degree,
            dependency_chains=dependency_chains,
            circular_dependencies=circular_dependencies,
            isolated_packages=isolated_packages,
            central_packages=central_packages,
            risk_clusters=risk_clusters,
            graph_metrics=graph_metrics
        )
    
    def _find_dependency_chains(self) -> List[List[str]]:
        """Find long dependency chains"""
        chains = []
        visited = set()
        
        def dfs(node, path):
            if node in path:
                return
            if node in visited:
                return
            
            visited.add(node)
            path.append(node)
            
            if len(path) > 3:  # Only consider chains longer than 3
                chains.append(path[:])
            
            for neighbor in self.graph.successors(node):
                dfs(neighbor, path[:])
        
        for node in self.graph.nodes():
            if node not in visited:
                dfs(node, [])
        
        return chains[:10]  # Return top 10 chains
    
    def _find_circular_dependencies(self) -> List[List[str]]:
        """Find circular dependencies"""
        try:
            cycles = list(nx.simple_cycles(self.graph))
            return cycles[:10]  # Return top 10 cycles
        except:
            return []
    
    def _find_risk_clusters(self) -> List[List[str]]:
        """Find clusters of potentially risky packages"""
        # Use community detection to find clusters
        try:
            undirected_graph = self.graph.to_undirected()
            communities = nx.community.greedy_modularity_communities(undirected_graph)
            
            # Filter communities by size and risk factors
            risk_clusters = []
            for community in communities:
                if len(community) >= 3:  # Only consider clusters with 3+ packages
                    community_list = list(community)
                    risk_clusters.append(community_list)
            
            return risk_clusters[:5]  # Return top 5 clusters
        except:
            return []
    
    def get_package_insights(self, package_name: str) -> List[DependencyInsight]:
        """Get insights for a specific package"""
        insights = []
        
        if package_name not in self.graph:
            return insights
        
        # Check dependency depth
        depth = self._calculate_dependency_depth(package_name)
        if depth > 5:
            insights.append(DependencyInsight(
                package_name=package_name,
                insight_type="Deep Dependency",
                description=f"Package has {depth} levels of dependencies",
                severity="MEDIUM",
                recommendations=["Consider flattening dependency tree", "Review if all dependencies are necessary"]
            ))
        
        # Check if it's a leaf node
        if self.graph.out_degree(package_name) == 0:
            insights.append(DependencyInsight(
                package_name=package_name,
                insight_type="Leaf Package",
                description="Package has no dependencies",
                severity="LOW",
                recommendations=["Good for reducing attack surface", "Monitor for security updates"]
            ))
        
        # Check centrality
        centrality = nx.betweenness_centrality(self.graph)
        if package_name in centrality and centrality[package_name] > 0.1:
            insights.append(DependencyInsight(
                package_name=package_name,
                insight_type="Central Package",
                description="Package is central to the dependency graph",
                severity="HIGH",
                recommendations=["Critical package - ensure high security", "Monitor for vulnerabilities closely"]
            ))
        
        return insights
    
    def _calculate_dependency_depth(self, package_name: str) -> int:
        """Calculate the depth of dependencies for a package"""
        visited = set()
        
        def dfs_depth(node, current_depth):
            if node in visited:
                return current_depth
            
            visited.add(node)
            max_depth = current_depth
            
            for neighbor in self.graph.successors(node):
                depth = dfs_depth(neighbor, current_depth + 1)
                max_depth = max(max_depth, depth)
            
            return max_depth
        
        return dfs_depth(package_name, 0)
    
    def export_graph(self, format: str = "json") -> str:
        """Export the graph in various formats"""
        if format == "json":
            data = {
                "nodes": [{"id": node, **self.graph.nodes[node]} for node in self.graph.nodes()],
                "edges": [{"source": u, "target": v, **self.graph.edges[u, v]} 
                         for u, v in self.graph.edges()]
            }
            return json.dumps(data, indent=2)
        elif format == "gexf":
            return nx.write_gexf(self.graph, "temp.gexf")
        else:
            raise ValueError(f"Unsupported format: {format}")

# Global service instance
kg_service = KnowledgeGraphService()

@app.post("/graph/build", response_model=Dict[str, Any])
async def build_knowledge_graph(request: GraphAnalysisRequest):
    """Build and analyze the knowledge graph"""
    try:
        logger.info(f"Building knowledge graph with {len(request.dependencies)} dependencies")
        
        kg_service.build_graph(request.dependencies, request.relationships)
        analysis = kg_service.analyze_graph()
        
        return {
            "status": "success",
            "message": "Knowledge graph built successfully",
            "analysis": analysis.dict()
        }
    except Exception as e:
        logger.error(f"Error building knowledge graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/analyze", response_model=GraphAnalysisResult)
async def analyze_graph():
    """Analyze the current knowledge graph"""
    try:
        if kg_service.graph.number_of_nodes() == 0:
            raise HTTPException(status_code=400, detail="No graph built yet. Use /graph/build first.")
        
        analysis = kg_service.analyze_graph()
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/package/{package_name}/insights", response_model=List[DependencyInsight])
async def get_package_insights(package_name: str):
    """Get insights for a specific package"""
    try:
        insights = kg_service.get_package_insights(package_name)
        return insights
    except Exception as e:
        logger.error(f"Error getting insights for {package_name}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/export/{format}")
async def export_graph(format: str):
    """Export the graph in various formats"""
    try:
        if format not in ["json", "gexf"]:
            raise HTTPException(status_code=400, detail="Supported formats: json, gexf")
        
        if kg_service.graph.number_of_nodes() == 0:
            raise HTTPException(status_code=400, detail="No graph built yet. Use /graph/build first.")
        
        exported_data = kg_service.export_graph(format)
        
        if format == "json":
            return {"format": format, "data": exported_data}
        else:
            return {"format": format, "message": "File exported successfully"}
            
    except Exception as e:
        logger.error(f"Error exporting graph: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/visualization")
async def get_graph_visualization():
    """Get graph visualization data for frontend"""
    try:
        if kg_service.graph.number_of_nodes() == 0:
            raise HTTPException(status_code=400, detail="No graph built yet. Use /graph/build first.")
        
        # Prepare data for D3.js visualization
        nodes = []
        for node in kg_service.graph.nodes():
            node_data = kg_service.graph.nodes[node]
            nodes.append({
                "id": node,
                "name": node_data.get("name", node),
                "ecosystem": node_data.get("ecosystem", "unknown"),
                "group": node_data.get("ecosystem", "unknown")
            })
        
        edges = []
        for u, v in kg_service.graph.edges():
            edge_data = kg_service.graph.edges[u, v]
            edges.append({
                "source": u,
                "target": v,
                "type": edge_data.get("relationship_type", "depends_on"),
                "strength": edge_data.get("strength", 1.0)
            })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "total_nodes": len(nodes),
                "total_edges": len(edges)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting visualization data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "knowledge-graph",
        "version": "1.0.0",
        "graph_built": kg_service.graph.number_of_nodes() > 0
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "service": "Knowledge Graph Service",
        "version": "1.0.0",
        "description": "AI-powered dependency relationship analysis",
        "endpoints": {
            "build_graph": "/graph/build",
            "analyze": "/graph/analyze",
            "package_insights": "/package/{package_name}/insights",
            "export": "/graph/export/{format}",
            "visualization": "/graph/visualization",
            "health": "/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
