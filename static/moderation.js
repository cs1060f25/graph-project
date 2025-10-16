// Moderation Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
    loadFlaggedPapers();
});

async function loadFlaggedPapers() {
    try {
        const response = await fetch('/api/moderation/flagged');
        const papers = await response.json();
        
        displayFlaggedPapers(papers);
        updateStats(papers);
    } catch (error) {
        console.error('Error loading flagged papers:', error);
    }
}

function displayFlaggedPapers(papers) {
    const container = document.getElementById('flaggedContent');
    
    if (papers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">check_circle</span>
                <p>No flagged papers. Everything looks good!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = papers.map(paper => {
        const isHidden = paper.score < -0.5;
        const reasonsHtml = paper.reasons.length > 0 ? `
            <div class="flagged-reasons">
                <h4>Reported Reasons:</h4>
                <div class="reason-tags">
                    ${paper.reasons.map(r => `
                        <span class="reason-tag">
                            ${r.reason}
                            <span class="count">(${r.count})</span>
                        </span>
                    `).join('')}
                </div>
            </div>
        ` : '';
        
        return `
            <div class="flagged-card ${isHidden ? 'hidden-paper' : ''}">
                <div class="flagged-header">
                    <div class="flagged-title">${paper.title}</div>
                    <div class="flagged-badges">
                        <span class="badge upvotes">
                            <span class="material-icons" style="font-size: 14px;">thumb_up</span>
                            ${paper.upvotes}
                        </span>
                        <span class="badge downvotes">
                            <span class="material-icons" style="font-size: 14px;">thumb_down</span>
                            ${paper.downvotes}
                        </span>
                        <span class="badge score">Score: ${paper.score}</span>
                        ${isHidden ? '<span class="badge hidden-badge">HIDDEN</span>' : ''}
                    </div>
                </div>
                <div class="flagged-meta">
                    ${paper.authors} • ${paper.year} • ${paper.unique_voters} unique voters
                </div>
                ${reasonsHtml}
            </div>
        `;
    }).join('');
}

function updateStats(papers) {
    const hiddenCount = papers.filter(p => p.score < -0.5).length;
    document.getElementById('totalFlagged').textContent = papers.length;
    document.getElementById('totalHidden').textContent = hiddenCount;
}
