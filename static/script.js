// Graph visualization and interaction logic

let graphData = { nodes: [], links: [] };
let allPapers = [];
let simulation;
let svg, g;
let selectedNode = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeGraph();
    loadPapers();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        loadPapers();
        resetGraphView();
    });
}

function initializeGraph() {
    const width = document.getElementById('graph').clientWidth;
    const height = document.getElementById('graph').clientHeight;

    svg = d3.select('#graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Initialize force simulation
    simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
}

async function loadPapers() {
    try {
        const response = await fetch('/api/papers');
        allPapers = await response.json();
        displayPaperList(allPapers);
        
        const graphResponse = await fetch('/api/graph');
        graphData = await graphResponse.json();
        updateGraph();
    } catch (error) {
        console.error('Error loading papers:', error);
    }
}

function displayPaperList(papers) {
    const listContainer = document.getElementById('paperListContent');
    
    if (papers.length === 0) {
        listContainer.innerHTML = '<p style="color: #a0a0a0;">No papers found.</p>';
        return;
    }

    // More compact display
    listContainer.innerHTML = papers.map(paper => `
        <div class="paper-item" onclick="showPaperDetails(${paper.id})">
            <div class="paper-title">${paper.title}</div>
            <div class="paper-meta">
                <span class="paper-authors">${paper.authors}</span>
                <span class="paper-year">${paper.year}</span>
            </div>
        </div>
    `).join('');
}

async function showPaperDetails(paperId) {
    try {
        const response = await fetch(`/api/papers/${paperId}`);
        const paper = await response.json();
        
        const relatedResponse = await fetch(`/api/related/${paperId}`);
        const related = await relatedResponse.json();

        const paperInfo = document.getElementById('paperInfo');
        const paperContent = document.getElementById('paperContent');

        paperContent.innerHTML = `
            <div class="detail-section">
                <div class="detail-label">Title</div>
                <div class="detail-value paper-title">${paper.title}</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Authors</div>
                <div class="detail-value">${paper.authors}</div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Year</div>
                <div class="detail-value">${paper.year}</div>
            </div>
            ${paper.keywords ? `
            <div class="detail-section">
                <div class="detail-label">Keywords</div>
                <div class="detail-value">${paper.keywords}</div>
            </div>
            ` : ''}
            ${paper.abstract ? `
            <div class="detail-section">
                <div class="detail-label">Abstract</div>
                <div class="detail-value detail-abstract">${paper.abstract}</div>
            </div>
            ` : ''}
            ${paper.url ? `
            <div class="detail-section">
                <div class="detail-label">Link</div>
                <div class="detail-value">
                    <a href="${paper.url}" target="_blank" class="detail-link">View Paper</a>
                </div>
            </div>
            ` : ''}
            <div class="detail-section">
                <div class="detail-label">Rating</div>
                <div class="detail-value vote-controls">
                    <span class="vote-control">
                        <i class="fas fa-thumbs-up" id="sidebar-thumb-up"></i>
                        <span id="sidebar-up-count">${paper.thumbs_up}</span>
                    </span>
                    <span class="vote-control">
                        <i class="fas fa-thumbs-down" id="sidebar-thumb-down"></i>
                        <span id="sidebar-down-count">${paper.thumbs_down}</span>
                    </span>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Cites (${related.cites.length})</div>
                <div class="detail-value">
                    ${related.cites.map(p => p.title).join(', ') || 'None'}
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-label">Cited By (${related.cited_by.length})</div>
                <div class="detail-value">
                    ${related.cited_by.map(p => p.title).join(', ') || 'None'}
                </div>
            </div>
        `;

        paperInfo.classList.remove('hidden');
        
        // Add event listeners for sidebar voting
        document.getElementById('sidebar-thumb-up').addEventListener('click', () => handleVote(paperId, 'up'));
        document.getElementById('sidebar-thumb-down').addEventListener('click', () => handleVote(paperId, 'down'));

        // Highlight node in graph
        highlightNode(paperId);
    } catch (error) {
        console.error('Error fetching paper details:', error);
    }
}

function updateGraph() {
    // Clear existing graph
    g.selectAll('*').remove();

    if (graphData.nodes.length === 0) {
        return;
    }

    // Create links
    const link = g.append('g')
        .selectAll('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link');

    // Create nodes
    const node = g.append('g')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    node.append('circle')
        .attr('r', 8);

    node.append('text')
        .attr('dx', 12)
        .attr('dy', 4)
        .text(d => {
            // Shorten title for display
            return d.title.length > 30 ? d.title.substring(0, 30) + '...' : d.title;
        });

    node.on('click', (event, d) => {
        event.stopPropagation();
        showPaperDetails(d.id);
    });

    // Store references globally for future extensions if needed
    window.graphLink = link;
    window.graphNode = node;

    // Update simulation
    simulation
        .nodes(graphData.nodes)
        .on('tick', () => ticked(link, node));

    simulation.force('link')
        .links(graphData.links);

    simulation.alpha(1).restart();

    function ticked(linkSelection, nodeSelection) {
        linkSelection
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        nodeSelection
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }
}

function highlightNode(nodeId) {
    // Remove previous selection
    g.selectAll('.node').classed('selected', false);
    g.selectAll('.link').classed('highlighted', false);
    
    // Highlight selected node
    g.selectAll('.node')
        .filter(d => d.id === nodeId)
        .classed('selected', true);
    
    // Highlight connected links
    g.selectAll('.link')
        .filter(d => d.source.id === nodeId || d.target.id === nodeId)
        .classed('highlighted', true);
    
    selectedNode = nodeId;
}

function resetGraphView() {
    g.selectAll('.node').classed('selected', false);
    g.selectAll('.link').classed('highlighted', false);
    document.getElementById('paperInfo').classList.add('hidden');
    selectedNode = null;
    
    // Reset zoom
    svg.transition().duration(750).call(
        d3.zoom().transform,
        d3.zoomIdentity
    );
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        loadPapers();
        return;
    }

    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        displayPaperList(results);
        
        // Filter graph to show only search results and their connections
        if (results.length > 0) {
            const resultIds = new Set(results.map(p => p.id));
            const filteredNodes = graphData.nodes.filter(n => resultIds.has(n.id));
            const filteredLinks = graphData.links.filter(l => 
                resultIds.has(l.source.id || l.source) && 
                resultIds.has(l.target.id || l.target)
            );
            
            const tempData = graphData;
            graphData = { nodes: filteredNodes, links: filteredLinks };
            updateGraph();
            graphData = tempData;
        }
    } catch (error) {
        console.error('Error searching papers:', error);
    }
}

// Drag functions
function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    // Canonical D3 pattern: update fixed positions only; tick updates DOM
    d.fx = event.x;
    d.fy = event.y;
}

function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

async function handleVote(paperId, voteType) {
    // Optimistic UI update for sidebar
    const countElement = document.getElementById(`sidebar-${voteType}-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent, 10);
        countElement.textContent = currentCount + 1;
    }

    try {
        const response = await fetch(`/api/papers/${paperId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote_type: voteType }),
        });

        if (response.ok) {
            const updatedCounts = await response.json();
            // Update UI with confirmed counts
            if (document.getElementById('sidebar-up-count')) {
                document.getElementById('sidebar-up-count').textContent = updatedCounts.thumbs_up;
            }
            if (document.getElementById('sidebar-down-count')) {
                document.getElementById('sidebar-down-count').textContent = updatedCounts.thumbs_down;
            }

            // Update the master graphData object
            const nodeData = graphData.nodes.find(n => n.id === paperId);
            if (nodeData) {
                nodeData.thumbs_up = updatedCounts.thumbs_up;
                nodeData.thumbs_down = updatedCounts.thumbs_down;
            }
        } else {
            // Revert optimistic update on failure
            if (countElement) {
                countElement.textContent = parseInt(countElement.textContent, 10) - 1;
            }
            console.error('Failed to submit vote');
        }
    } catch (error) {
        console.error('Error voting:', error);
        // Revert optimistic update on error
        if (countElement) {
            countElement.textContent = parseInt(countElement.textContent, 10) - 1;
        }
    }
}

async function handleVote(paperId, voteType) {
    // Optimistic UI update for sidebar
    const countElement = document.getElementById(`sidebar-${voteType}-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent, 10);
        countElement.textContent = currentCount + 1;
    }

    try {
        const response = await fetch(`/api/papers/${paperId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote_type: voteType }),
        });

        if (response.ok) {
            const updatedCounts = await response.json();
            // Update UI with confirmed counts
            if (document.getElementById('sidebar-up-count')) {
                document.getElementById('sidebar-up-count').textContent = updatedCounts.thumbs_up;
            }
            if (document.getElementById('sidebar-down-count')) {
                document.getElementById('sidebar-down-count').textContent = updatedCounts.thumbs_down;
            }

            // Update the master graphData object
            const nodeData = graphData.nodes.find(n => n.id === paperId);
            if (nodeData) {
                nodeData.thumbs_up = updatedCounts.thumbs_up;
                nodeData.thumbs_down = updatedCounts.thumbs_down;
            }
        } else {
            // Revert optimistic update on failure
            if (countElement) {
                countElement.textContent = parseInt(countElement.textContent, 10) - 1;
            }
            console.error('Failed to submit vote');
        }
    } catch (error) {
        console.error('Error voting:', error);
        // Revert optimistic update on error
        if (countElement) {
            countElement.textContent = parseInt(countElement.textContent, 10) - 1;
        }
    }
}
