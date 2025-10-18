// Graph visualization and interaction logic with voting

let graphData = { nodes: [], links: [] };
let allPapers = [];
let simulation;
let svg, g;
let selectedNode = null;
let showLowTrust = false;
let edgeVoteTooltip;
let userId = null;
let lastMouse = { x: 0, y: 0 };
let edgeTooltipHideTimer = null;
let edgeTooltipHovered = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initUserId();
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
    const toggle = document.getElementById('toggleLowTrust');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            showLowTrust = e.target.checked;
            applyTrustStyles();
        });
    }
}

function initUserId() {
    try {
        const key = 'graph_user_id';
        let existing = localStorage.getItem(key);
        if (!existing) {
            // lightweight random id
            existing = 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem(key, existing);
        }
        userId = existing;
    } catch (e) {
        // Fallback if localStorage not available
        userId = 'u_' + Date.now();
    }
}

function initializeGraph() {
    const width = document.getElementById('graph').clientWidth;
    const height = document.getElementById('graph').clientHeight;

    svg = d3.select('#graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    g = svg.append('g');

    // Edge vote tooltip element
    edgeVoteTooltip = d3.select('#graph')
        .append('div')
        .attr('class', 'edge-vote-tooltip')
        .style('position', 'absolute')
        .style('display', 'none')
        .on('mouseenter', () => {
            edgeTooltipHovered = true;
            if (edgeTooltipHideTimer) { clearTimeout(edgeTooltipHideTimer); edgeTooltipHideTimer = null; }
        })
        .on('mouseleave', () => {
            edgeTooltipHovered = false;
            hideEdgeVoteTooltip();
        });

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
        
        const params = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
        const graphResponse = await fetch(`/api/graph${params}`);
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

    // Compact display without voting; voting happens in Paper Details panel
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
        const nodeInfo = (graphData.nodes || []).find(n => n.id === paperId) || { up: 0, down: 0, score: 0, userVote: null };

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
                <div class="detail-label">Community feedback</div>
                <div class="detail-value">
                    <div class="detail-vote">
                        <span id="paperVoteUp" class="vote-btn ${nodeInfo.userVote === 1 ? 'active' : ''}" title="Upvote">👍</span>
                        <span id="paperUpCount" class="vote-count">${nodeInfo.up || 0}</span>
                        <span id="paperVoteDown" class="vote-btn ${nodeInfo.userVote === -1 ? 'active' : ''}" title="Downvote" style="margin-left:8px;">👎</span>
                        <span id="paperDownCount" class="vote-count">${nodeInfo.down || 0}</span>
                        <span class="score-pill" title="Score = up - down">Score: <strong id="paperScore">${(nodeInfo.up||0)-(nodeInfo.down||0)}</strong></span>
                    </div>
                    ${(nodeInfo.score || 0) < -3 ? '<div class="low-trust-note">Hidden due to community feedback.</div>' : ''}
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
        // Wire up vote buttons in details panel
        const localNode = (graphData.nodes || []).find(n => n.id === paperId) || { id: paperId, up: nodeInfo.up, down: nodeInfo.down, userVote: nodeInfo.userVote, score: nodeInfo.score };
        const upBtn = document.getElementById('paperVoteUp');
        const dnBtn = document.getElementById('paperVoteDown');
        const upCountEl = document.getElementById('paperUpCount');
        const dnCountEl = document.getElementById('paperDownCount');
        const scoreEl = document.getElementById('paperScore');
        const updatePanel = () => {
            upCountEl.textContent = localNode.up || 0;
            dnCountEl.textContent = localNode.down || 0;
            scoreEl.textContent = (localNode.up || 0) - (localNode.down || 0);
            upBtn.classList.toggle('active', localNode.userVote === 1);
            dnBtn.classList.toggle('active', localNode.userVote === -1);
        };
        upBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handlePaperVote(localNode, 1);
            updatePanel();
        });
        dnBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handlePaperVote(localNode, -1);
            updatePanel();
        });
        
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
        .attr('class', d => `link ${d.down > 3 ? 'low-confidence' : ''}`)
        .on('mousemove', (event, d) => { lastMouse = { x: event.clientX, y: event.clientY }; showEdgeVoteTooltip(event, d); })
        .on('mouseleave', () => {
            if (edgeTooltipHideTimer) clearTimeout(edgeTooltipHideTimer);
            edgeTooltipHideTimer = setTimeout(() => {
                if (!edgeTooltipHovered) hideEdgeVoteTooltip();
            }, 200);
        });

    // Create nodes
    const node = g.append('g')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', d => `node ${d.score < -3 && !showLowTrust ? 'low-trust' : ''}`)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    node.append('circle')
        .attr('r', 8)
        .append('title')
        .text(d => (d.score < -3 ? 'Hidden due to community feedback.' : ''));

    node.append('text')
        .attr('dx', 12)
        .attr('dy', 4)
        .text(d => {
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

    // Apply initial trust styles
    applyTrustStyles();
}

function hideEdgeVoteTooltip() {
    if (edgeVoteTooltip) {
        edgeVoteTooltip.style('display', 'none');
        const el = edgeVoteTooltip.node();
        if (el) el.onclick = null;
    }
}

async function handlePaperVote(nodeData, vote) {
    // Optimistic update
    const prev = { up: nodeData.up || 0, down: nodeData.down || 0, userVote: nodeData.userVote || null, score: nodeData.score || 0 };
    const togglingOff = nodeData.userVote === vote; // same click toggles off
    if (togglingOff) {
        if (vote === 1) nodeData.up = Math.max(0, prev.up - 1);
        else nodeData.down = Math.max(0, prev.down - 1);
        nodeData.userVote = null;
    } else {
        if (vote === 1) {
            nodeData.up = prev.up + 1;
            if (prev.userVote === -1) nodeData.down = Math.max(0, prev.down - 1);
        } else {
            nodeData.down = prev.down + 1;
            if (prev.userVote === 1) nodeData.up = Math.max(0, prev.up - 1);
        }
        nodeData.userVote = vote;
    }
    nodeData.score = (nodeData.up || 0) - (nodeData.down || 0);
    refreshNodeVoteUI(nodeData);

    try {
        const res = await fetch('/api/vote/paper', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paper_id: nodeData.id, user_id: userId, vote })
        });
        if (!res.ok) throw new Error('Vote failed');
        const data = await res.json();
        // reconcile with server
        nodeData.up = data.up; nodeData.down = data.down; nodeData.score = data.score; nodeData.userVote = data.userVote || null;
        refreshNodeVoteUI(nodeData);
    } catch (e) {
        // rollback on error
        nodeData.up = prev.up; nodeData.down = prev.down; nodeData.userVote = prev.userVote; nodeData.score = prev.score;
        refreshNodeVoteUI(nodeData);
        console.error(e);
    }
}

async function handleEdgeVote(linkData, vote) {
    const prev = { up: linkData.up || 0, down: linkData.down || 0, userVote: linkData.userVote || null };
    const togglingOff = linkData.userVote === vote;
    if (togglingOff) {
        if (vote === 1) linkData.up = Math.max(0, prev.up - 1);
        else linkData.down = Math.max(0, prev.down - 1);
        linkData.userVote = null;
    } else {
        if (vote === 1) {
            linkData.up = prev.up + 1;
            if (prev.userVote === -1) linkData.down = Math.max(0, prev.down - 1);
        } else {
            linkData.down = prev.down + 1;
            if (prev.userVote === 1) linkData.up = Math.max(0, prev.up - 1);
        }
        linkData.userVote = vote;
    }
    refreshLinkStyles();
    // refresh tooltip counts near last mouse location
    if (edgeVoteTooltip && lastMouse.x) {
        showEdgeVoteTooltip({ clientX: lastMouse.x, clientY: lastMouse.y }, linkData);
    }

    try {
        const res = await fetch('/api/vote/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ edge_id: linkData.id, user_id: userId, vote })
        });
        if (!res.ok) throw new Error('Vote failed');
        const data = await res.json();
        linkData.up = data.up; linkData.down = data.down; linkData.userVote = data.userVote || null;
        refreshLinkStyles();
    } catch (e) {
        linkData.up = prev.up; linkData.down = prev.down; linkData.userVote = prev.userVote;
        refreshLinkStyles();
        console.error(e);
    }
}

function refreshNodeVoteUI(nodeData) {
    // Update counts and active classes for this node's vote controls and trust style
    g.selectAll('.node')
        .filter(d => d.id === nodeData.id)
        .each(function(d) {
            const el = d3.select(this);
            el.select('.up-count').text(` ${nodeData.up || 0}`);
            el.select('.down-count').text(` ${nodeData.down || 0}`);
            el.select('.thumb-up').classed('active', nodeData.userVote === 1);
            el.select('.thumb-down').classed('active', nodeData.userVote === -1);
            d.score = nodeData.score;
            d.up = nodeData.up;
            d.down = nodeData.down;
            d.userVote = nodeData.userVote;
            // update title tooltip
            const title = el.select('circle').select('title');
            if (!title.empty()) {
                title.text((d.score || 0) < -3 ? 'Hidden due to community feedback.' : '');
            }
        });
    applyTrustStyles();
}

function refreshLinkStyles() {
    g.selectAll('.link')
        .classed('low-confidence', (d) => (d.down || 0) > 3 && !showLowTrust);
}

function applyTrustStyles() {
    g.selectAll('.node')
        .classed('low-trust', d => (d.score || 0) < -3 && !showLowTrust)
        .classed('low-trust-off', d => showLowTrust);
    refreshLinkStyles();
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
