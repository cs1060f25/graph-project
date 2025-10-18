// Graph visualization and interaction logic

let graphData = { nodes: [], links: [] };
let allPapers = [];
let simulation;
let svg, g;
let selectedNode = null;

// Voting state
let scores = { papers: {}, edges: {} };
let myVotes = { papers: {}, edges: {} };
let showLowTrust = false; // when true, restore normal appearance; when false, dim low-trust

// Minimal user identification (localStorage). Not secure but sufficient for prototype uniqueness.
function getUserId() {
    let uid = localStorage.getItem('graph_user_id');
    if (!uid) {
        uid = 'u_' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('graph_user_id', uid);
    }
    return uid;
}

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
    const toggle = document.getElementById('toggleLowTrust');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            showLowTrust = e.target.checked;
            applyTrustStyling();
        });
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
        
        const [graphResponse, scoresResponse, myVotesResponse] = await Promise.all([
            fetch('/api/graph'),
            fetch('/api/scores'),
            fetch(`/api/my-votes?user_id=${encodeURIComponent(getUserId())}`)
        ]);
        graphData = await graphResponse.json();
        scores = await scoresResponse.json();
        myVotes = await myVotesResponse.json();
        updateGraph();
        applyTrustStyling();
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
        .attr('class', 'link')
        .attr('data-edge-id', d => d.id)
        .on('mouseenter', function (event, d) {
            showEdgeVoteHint(event, d);
        })
        .on('mousemove', function (event, d) {
            moveEdgeVoteHint(event);
        })
        .on('mouseleave', function () {
            hideEdgeVoteHint();
        });

    // Create nodes
    const node = g.append('g')
        .selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('data-node-id', d => d.id)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    node.append('circle')
        .attr('r', 8);

    // Label group: text + vote controls
    const labelGroup = node.append('g')
        .attr('class', 'label-group');

    labelGroup.append('text')
        .attr('dx', 12)
        .attr('dy', 2)
        .text(d => d.title.length > 30 ? d.title.substring(0, 30) + '...' : d.title);

    const votesGroup = labelGroup.append('foreignObject')
        .attr('x', 12)
        .attr('y', 10)
        .attr('width', 120)
        .attr('height', 30)
        .append('xhtml:div')
        .attr('class', 'vote-controls')
        .html(d => renderVoteControls('paper', d.id));

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

    // Attach listeners to newly created vote buttons
    attachVoteListeners();

    // Apply scores to initial UI
    applyTrustStyling();
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

// --- Voting UI helpers ---
function renderVoteControls(type, id) {
    const idStr = String(id);
    const counts = (type === 'paper' ? scores.papers[idStr] : scores.edges[idStr]) || { up: 0, down: 0, score: 0 };
    const my = (type === 'paper' ? myVotes.papers[idStr] : myVotes.edges[idStr]) || 0;
    const upCls = my === 1 ? 'active-up' : '';
    const downCls = my === -1 ? 'active-down' : '';
    return `
        <button class="vote-btn vote-up ${upCls}" data-type="${type}" data-id="${id}" data-vote="1" title="Upvote">👍 <span class="vote-count">${counts.up || 0}</span></button>
        <button class="vote-btn vote-down ${downCls}" data-type="${type}" data-id="${id}" data-vote="-1" title="Downvote">👎 <span class="vote-count">${counts.down || 0}</span></button>
    `;
}

function attachVoteListeners() {
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const type = btn.getAttribute('data-type');
            const id = btn.getAttribute('data-id');
            const desired = parseInt(btn.getAttribute('data-vote'), 10);
            const current = (type === 'paper' ? myVotes.papers[id] : myVotes.edges[id]) || 0;
            // Toggle logic: if clicking same vote again -> clear (0)
            const newVote = current === desired ? 0 : desired;

            // Optimistic UI update
            applyOptimisticVote(type, id, newVote, current);

            try {
                const res = await fetch('/api/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, id: Number(id), vote: newVote, user_id: getUserId() })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Vote failed');
                // Reconcile counts and myVotes with server
                const idStr = String(data.id);
                if (data.type === 'paper') {
                    scores.papers[idStr] = data.counts;
                    myVotes.papers[idStr] = data.user_vote || 0;
                } else {
                    scores.edges[idStr] = data.counts;
                    myVotes.edges[idStr] = data.user_vote || 0;
                }
                // Refresh the specific control UI only
                refreshVoteControl(type, idStr);
                applyTrustStyling();
            } catch (err) {
                console.error('Vote error:', err);
                // On error, reload scores to avoid drift
                try {
                    const [scoresRes, myRes] = await Promise.all([
                        fetch('/api/scores'),
                        fetch(`/api/my-votes?user_id=${encodeURIComponent(getUserId())}`)
                    ]);
                    scores = await scoresRes.json();
                    myVotes = await myRes.json();
                    refreshAllVoteControls();
                    applyTrustStyling();
                } catch {}
            }
        });
    });
}

function applyOptimisticVote(type, id, newVote, currentVote) {
    const idStr = String(id);
    const bucket = type === 'paper' ? scores.papers : scores.edges;
    const mv = type === 'paper' ? myVotes.papers : myVotes.edges;
    const counts = bucket[idStr] || { up: 0, down: 0, score: 0 };

    // Undo current
    if (currentVote === 1) counts.up = Math.max(0, (counts.up || 0) - 1);
    if (currentVote === -1) counts.down = Math.max(0, (counts.down || 0) - 1);
    // Apply new
    if (newVote === 1) counts.up = (counts.up || 0) + 1;
    if (newVote === -1) counts.down = (counts.down || 0) + 1;
    counts.score = (counts.up || 0) - (counts.down || 0);
    bucket[idStr] = counts;
    mv[idStr] = newVote;
    refreshVoteControl(type, idStr);
}

function refreshVoteControl(type, idStr) {
    const selector = `.vote-controls .vote-btn[data-type="${type}"][data-id="${idStr}"]`;
    const upBtn = document.querySelector(`${selector}[data-vote="1"]`);
    const downBtn = document.querySelector(`${selector}[data-vote="-1"]`);
    const my = (type === 'paper' ? myVotes.papers[idStr] : myVotes.edges[idStr]) || 0;
    const counts = (type === 'paper' ? scores.papers[idStr] : scores.edges[idStr]) || { up: 0, down: 0 };
    if (upBtn) {
        upBtn.classList.toggle('active-up', my === 1);
        const span = upBtn.querySelector('.vote-count');
        if (span) span.textContent = counts.up || 0;
    }
    if (downBtn) {
        downBtn.classList.toggle('active-down', my === -1);
        const span = downBtn.querySelector('.vote-count');
        if (span) span.textContent = counts.down || 0;
    }
}

function refreshAllVoteControls() {
    // Re-render all controls HTML to ensure consistency
    d3.selectAll('.node').each(function(d) {
        const foDiv = d3.select(this).select('.vote-controls');
        if (!foDiv.empty()) {
            foDiv.html(renderVoteControls('paper', d.id));
        }
    });
    attachVoteListeners();
}

// Edge voting hint (simple inline tooltip near cursor)
let edgeHintEl = null;
let edgeHintHideTimer = null;
function ensureEdgeHint() {
    if (!edgeHintEl) {
        edgeHintEl = document.createElement('div');
        edgeHintEl.className = 'edge-vote-hint';
        edgeHintEl.innerHTML = `
            <div class="vote-controls">
                <button class="vote-btn vote-up" data-type="edge" data-vote="1">👍 <span class="vote-count">0</span></button>
                <button class="vote-btn vote-down" data-type="edge" data-vote="-1">👎 <span class="vote-count">0</span></button>
            </div>`;
        document.body.appendChild(edgeHintEl);
        edgeHintEl.addEventListener('mouseenter', () => {
            if (edgeHintHideTimer) {
                clearTimeout(edgeHintHideTimer);
                edgeHintHideTimer = null;
            }
        });
        edgeHintEl.addEventListener('mouseleave', () => {
            scheduleHideEdgeHint();
        });
    }
}

function showEdgeVoteHint(event, edgeData) {
    ensureEdgeHint();
    const idStr = String(edgeData.id);
    const counts = scores.edges[idStr] || { up: 0, down: 0 };
    const my = (myVotes.edges[idStr] || 0);
    const upBtn = edgeHintEl.querySelector('.vote-up');
    const downBtn = edgeHintEl.querySelector('.vote-down');
    upBtn.setAttribute('data-id', idStr);
    downBtn.setAttribute('data-id', idStr);
    upBtn.classList.toggle('active-up', my === 1);
    downBtn.classList.toggle('active-down', my === -1);
    upBtn.querySelector('.vote-count').textContent = counts.up || 0;
    downBtn.querySelector('.vote-count').textContent = counts.down || 0;
    // Ensure listeners bound once
    if (!upBtn._bound) {
        [upBtn, downBtn].forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const desired = parseInt(btn.getAttribute('data-vote'), 10);
                const current = (myVotes.edges[id] || 0);
                const newVote = current === desired ? 0 : desired;
                applyOptimisticVote('edge', id, newVote, current);
                updateEdgeHintCounts(id);
                try {
                    const res = await fetch('/api/vote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'edge', id: Number(id), vote: newVote, user_id: getUserId() })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Vote failed');
                    scores.edges[String(data.id)] = data.counts;
                    myVotes.edges[String(data.id)] = data.user_vote || 0;
                    applyTrustStyling();
                } catch (err) {
                    console.error('Edge vote error:', err);
                }
            });
            btn._bound = true;
        });
    }
    moveEdgeVoteHint(event);
    edgeHintEl.style.display = 'block';
}
function moveEdgeVoteHint(event) {
    if (!edgeHintEl) return;
    edgeHintEl.style.left = `${event.pageX + 10}px`;
    edgeHintEl.style.top = `${event.pageY + 10}px`;
}
function scheduleHideEdgeHint() {
    if (edgeHintHideTimer) clearTimeout(edgeHintHideTimer);
    edgeHintHideTimer = setTimeout(() => {
        if (edgeHintEl) edgeHintEl.style.display = 'none';
        edgeHintHideTimer = null;
    }, 250);
}
function hideEdgeVoteHint() {
    scheduleHideEdgeHint();
}
function updateEdgeHintCounts(id) {
    if (!edgeHintEl) return;
    const counts = scores.edges[String(id)] || { up: 0, down: 0 };
    const my = (myVotes.edges[String(id)] || 0);
    const upBtn = edgeHintEl.querySelector('.vote-up');
    const downBtn = edgeHintEl.querySelector('.vote-down');
    if (upBtn && downBtn) {
        upBtn.querySelector('.vote-count').textContent = counts.up || 0;
        downBtn.querySelector('.vote-count').textContent = counts.down || 0;
        upBtn.classList.toggle('active-up', my === 1);
        downBtn.classList.toggle('active-down', my === -1);
    }
}

// Apply dimming and edge lightening based on scores and toggle
function applyTrustStyling() {
    const dimThreshold = -3; // score < -3 -> dim paper
    const edgeDownThreshold = 3; // downvotes > 3 -> light edge

    // Nodes
    d3.selectAll('.node').each(function(d) {
        const s = scores.papers[String(d.id)] || { score: 0 };
        const low = (s.score || 0) < dimThreshold;
        const sel = d3.select(this)
            .classed('dimmed-node', low && !showLowTrust);
        // Manage SVG title tooltip
        let titleEl = sel.select('title');
        if (low) {
            if (titleEl.empty()) {
                sel.append('title').text('Hidden due to community feedback.');
            } else {
                titleEl.text('Hidden due to community feedback.');
            }
        } else {
            if (!titleEl.empty()) titleEl.remove();
        }
    });

    // Links
    d3.selectAll('.link').each(function(d) {
        const e = scores.edges[String(d.id)] || { down: 0 };
        const low = (e.down || 0) > edgeDownThreshold;
        d3.select(this).classed('low-trust-link', low && !showLowTrust);
    });
}
