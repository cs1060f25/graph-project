const { useState, useEffect, useRef } = React;

const GraphPage = ({ paper, onBack }) => {
    const [graphData, setGraphData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const svgRef = useRef(null);

    useEffect(() => {
        loadGraphData();
    }, [paper]);

    const loadGraphData = async () => {
        if (!paper?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/graph/paper/${paper.id}`);
            if (!response.ok) {
                throw new Error('Failed to load graph data');
            }
            const data = await response.json();
            setGraphData(data);
        } catch (err) {
            setError('Error loading graph data. Please try again.');
            console.error('Graph loading error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (graphData && svgRef.current) {
            renderGraph();
        }
    }, [graphData, filterType]);

    const renderGraph = () => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = svg.node().clientWidth;
        const height = svg.node().clientHeight;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        // Filter edges based on selected type
        let filteredEdges = graphData.edges;
        if (filterType !== 'all') {
            filteredEdges = graphData.edges.filter(edge => edge.type === filterType);
        }

        // Get nodes that are connected by filtered edges
        const connectedNodeIds = new Set();
        filteredEdges.forEach(edge => {
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        });

        const filteredNodes = graphData.nodes.filter(node => 
            connectedNodeIds.has(node.id) || node.type === 'central'
        );

        // Create simulation
        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(filteredEdges).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(30));

        // Create links
        const link = svg.append("g")
            .selectAll("line")
            .data(filteredEdges)
            .enter().append("line")
            .attr("stroke", d => {
                switch (d.type) {
                    case 'cocitation': return '#3b82f6';
                    case 'coauthorship': return '#10b981';
                    case 'both': return '#8b5cf6';
                    default: return '#94a3b8';
                }
            })
            .attr("stroke-width", d => d.type === 'both' ? 3 : 2)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-dasharray", d => d.type === 'coauthorship' ? '5,5' : 'none');

        // Create nodes
        const node = svg.append("g")
            .selectAll("circle")
            .data(filteredNodes)
            .enter().append("circle")
            .attr("r", d => d.type === 'central' ? 12 : 8)
            .attr("fill", d => d.type === 'central' ? '#1e40af' : '#64748b')
            .attr("stroke", d => d.type === 'central' ? '#1e3a8a' : '#475569')
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Add labels
        const labels = svg.append("g")
            .selectAll("text")
            .data(filteredNodes)
            .enter().append("text")
            .text(d => d.title.length > 30 ? d.title.substring(0, 30) + '...' : d.title)
            .attr("font-size", "10px")
            .attr("font-family", "sans-serif")
            .attr("fill", "#374151")
            .attr("text-anchor", "middle")
            .attr("dy", d => d.type === 'central' ? -20 : -15)
            .style("pointer-events", "none");

        // Add tooltips
        node.append("title")
            .text(d => `${d.title}\n${d.year} • ${d.venue}`);

        // Add click handlers
        node.on("click", (event, d) => {
            setSelectedNode(d);
        });

        // Update positions on simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    };

    if (isLoading) {
        return (
            <div className="loading">
                Loading graph data...
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="error">{error}</div>
                <button onClick={onBack} className="search-button">
                    Back to Search
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="graph-container">
                <div className="graph-header">
                    <div>
                        <h2 className="graph-title">Citation Network</h2>
                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                            Central paper: <strong>{paper.title}</strong>
                        </p>
                    </div>
                    <div className="graph-controls">
                        <button
                            className={`control-button ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                        >
                            All Connections
                        </button>
                        <button
                            className={`control-button ${filterType === 'cocitation' ? 'active' : ''}`}
                            onClick={() => setFilterType('cocitation')}
                        >
                            Co-citations
                        </button>
                        <button
                            className={`control-button ${filterType === 'coauthorship' ? 'active' : ''}`}
                            onClick={() => setFilterType('coauthorship')}
                        >
                            Co-authorships
                        </button>
                        <button onClick={onBack} className="control-button">
                            Back to Search
                        </button>
                    </div>
                </div>

                <svg ref={svgRef} id="graph-svg"></svg>

                <div className="legend">
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
                        <span className="legend-label">Co-citation (papers citing similar works)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
                        <span className="legend-label">Co-authorship (shared authors)</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color" style={{ backgroundColor: '#8b5cf6' }}></div>
                        <span className="legend-label">Both connections</span>
                    </div>
                </div>
            </div>

            {selectedNode && (
                <div className="paper-details">
                    <h3>{selectedNode.title}</h3>
                    <div className="paper-meta">
                        <div className="meta-item">
                            <span className="meta-label">Year</span>
                            <span className="meta-value">{selectedNode.year}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Venue</span>
                            <span className="meta-value">{selectedNode.venue}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Type</span>
                            <span className="meta-value">
                                {selectedNode.type === 'central' ? 'Central Paper' : 'Related Paper'}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedNode(null)}
                        className="search-button"
                        style={{ background: '#ef4444' }}
                    >
                        Close Details
                    </button>
                </div>
            )}
        </div>
    );
};
