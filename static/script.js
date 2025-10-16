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
        const [paperResponse, relatedResponse, feedbackResponse] = await Promise.all([
            fetch(`/api/papers/${paperId}`),
            fetch(`/api/related/${paperId}`),
            fetch(`/api/feedback/paper/${paperId}`)
        ]);
        
        const paper = await paperResponse.json();
        const related = await relatedResponse.json();
        const feedback = await feedbackResponse.json();

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
            <div class="feedback-actions">
                <button class="vote-btn ${feedback.user_vote === 'up' ? 'active-up' : ''}" 
                        onclick="votePaper(${paperId}, 'up')">
                    <span class="material-icons">thumb_up</span>
                    <span class="vote-count">${feedback.upvotes}</span>
                </button>
                <button class="vote-btn ${feedback.user_vote === 'down' ? 'active-down' : ''}" 
                        onclick="votePaper(${paperId}, 'down')">
                    <span class="material-icons">thumb_down</span>
                    <span class="vote-count">${feedback.downvotes}</span>
                </button>
            </div>
        `;

        paperInfo.classList.remove('hidden');
        
        // Store current paper ID for feedback modal
        window.currentPaperId = paperId;
        
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

// Feedback/Voting Functions
let selectedReason = '';

async function votePaper(paperId, voteType) {
    if (voteType === 'down') {
        // Show modal for downvote
        showFeedbackModal(paperId);
    } else {
        // Submit upvote directly
        await submitFeedback(paperId, voteType, '');
    }
}

function showFeedbackModal(paperId) {
    const modal = document.getElementById('feedbackModal');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    selectedReason = '';
    
    // Clear previous selections
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById('customReason').value = '';
}

function hideFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function submitFeedback(paperId, voteType, reason) {
    try {
        const response = await fetch('/api/feedback/paper', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paper_id: paperId,
                vote_type: voteType,
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.hidden) {
            alert('This paper has been hidden due to negative feedback.');
            // Reload papers to update the list
            loadPapers();
        } else {
            // Refresh the paper details to show updated votes
            showPaperDetails(paperId);
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
    }
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Close button
    document.querySelector('.modal-close')?.addEventListener('click', hideFeedbackModal);
    
    // Click outside modal to close
    document.getElementById('feedbackModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'feedbackModal') {
            hideFeedbackModal();
        }
    });
    
    // Reason button selection
    document.querySelectorAll('.reason-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.reason-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedReason = btn.dataset.reason;
        });
    });
    
    // Submit feedback button
    document.getElementById('submitFeedback')?.addEventListener('click', async () => {
        const customReason = document.getElementById('customReason').value.trim();
        const finalReason = customReason || selectedReason;
        
        if (!finalReason) {
            alert('Please select or enter a reason for flagging this paper.');
            return;
        }
        
        hideFeedbackModal();
        await submitFeedback(window.currentPaperId, 'down', finalReason);
    });
});
