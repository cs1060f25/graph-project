// Mobile-first feed, feedback collection, voice prompts, offline queueing
let allPapers = [];
const FEEDBACK_QUEUE_KEY = 'graphene_feedback_queue_v1';

document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    loadPapers();
    setupMobileEvents();
    window.addEventListener('online', trySyncQueue);
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/service-worker.js').catch(err => {
            console.warn('SW registration failed:', err);
        });
    }
}

function setupMobileEvents() {
    const showGraphBtn = document.getElementById('showGraphBtn');
    if (showGraphBtn) {
        showGraphBtn.addEventListener('click', () => {
            document.getElementById('graphView').classList.toggle('hidden');
        });
    }
}

async function loadPapers() {
    try {
        const response = await fetch('/api/papers');
        allPapers = await response.json();
        renderPaperFeed(allPapers);
    } catch (err) {
        console.error('Failed to load papers:', err);
    }
}

function renderPaperFeed(papers) {
    const feed = document.getElementById('paperFeed');
    if (!feed) return;
    feed.innerHTML = '';

    if (papers.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No papers available.';
        p.style.color = '#a0a0a0';
        feed.appendChild(p);
        return;
    }

    papers.forEach(paper => {
        const card = document.createElement('article');
        card.className = 'paper-card';
        card.setAttribute('role', 'region');
        card.setAttribute('aria-label', `Paper: ${paper.title}`);

        const title = document.createElement('h4');
        title.textContent = paper.title;
        card.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'paper-meta-small';
        meta.textContent = `${paper.authors} • ${paper.year || ''}`;
        card.appendChild(meta);

        // Audio summary button (if abstract exists)
        if (paper.abstract) {
            const playBtn = document.createElement('button');
            playBtn.className = 'small-btn';
            playBtn.textContent = '🔊 Listen summary';
            playBtn.addEventListener('click', () => speakText(paper.abstract));
            card.appendChild(playBtn);
        }

        // Feedback buttons
        const row = document.createElement('div');
        row.className = 'feedback-row';

        const likeBtn = document.createElement('button');
        likeBtn.className = 'btn-feedback btn-like';
        likeBtn.innerHTML = '👍';
        likeBtn.setAttribute('aria-label', `Like ${paper.title}`);
        likeBtn.addEventListener('click', () => sendFeedback(paper.id, 'like'));

        const dislikeBtn = document.createElement('button');
        dislikeBtn.className = 'btn-feedback btn-dislike';
        dislikeBtn.innerHTML = '👎';
        dislikeBtn.setAttribute('aria-label', `Dislike ${paper.title}`);
        dislikeBtn.addEventListener('click', () => handleDislike(paper));

        row.appendChild(likeBtn);
        row.appendChild(dislikeBtn);
        card.appendChild(row);

        feed.appendChild(card);
    });
}

function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
}

function handleDislike(paper) {
    // Voice-assisted options
    const options = ['off-topic', 'unclear', 'offensive'];
    // Prompt the user via voice and simple UI
    const promptText = 'You disliked this paper. Say why: off-topic, unclear, or offensive. Or tap an option.';
    speakText(promptText);

    const overlay = document.createElement('div');
    overlay.className = 'paper-card';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.position = 'relative';

    const heading = document.createElement('h4');
    heading.textContent = 'Why did you dislike this?';
    overlay.appendChild(heading);

    const optRow = document.createElement('div');
    optRow.className = 'feedback-row';

    options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'btn-feedback btn-dislike';
        b.textContent = opt;
        b.addEventListener('click', () => {
            sendFeedback(paper.id, 'dislike', opt);
            overlay.remove();
            speakText('Thanks, your feedback was recorded.');
        });
        optRow.appendChild(b);
    });

    // Allow voice input fallback using Web Speech API if available
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
        const r = new SpeechRec();
        r.lang = 'en-US';
        r.interimResults = false;
        r.maxAlternatives = 1;
        const speakBtn = document.createElement('button');
        speakBtn.className = 'small-btn';
        speakBtn.textContent = '🎙 Say it';
        speakBtn.addEventListener('click', () => {
            try {
                r.start();
            } catch (e) {
                console.warn('Speech start failed', e);
            }
        });

        r.onresult = (ev) => {
            const spoken = ev.results[0][0].transcript.toLowerCase();
            // find matching option
            const match = options.find(o => spoken.includes(o));
            sendFeedback(paper.id, 'dislike', match || spoken);
            overlay.remove();
            speakText('Thanks, your feedback was recorded.');
        };

        r.onerror = () => {
            speakText('Sorry, voice recognition failed. Tap an option instead.');
        };

        overlay.appendChild(speakBtn);
    }

    overlay.appendChild(optRow);

    // Insert overlay near top of feed
    const feed = document.getElementById('paperFeed');
    feed.prepend(overlay);
}

function queueFeedback(entry) {
    const raw = localStorage.getItem(FEEDBACK_QUEUE_KEY) || '[]';
    const arr = JSON.parse(raw);
    arr.push(entry);
    localStorage.setItem(FEEDBACK_QUEUE_KEY, JSON.stringify(arr));
}

async function trySyncQueue() {
    const raw = localStorage.getItem(FEEDBACK_QUEUE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (!arr || arr.length === 0) return;

    try {
        const resp = await fetch('/api/sync_feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: arr })
        });

        if (resp.ok) {
            localStorage.removeItem(FEEDBACK_QUEUE_KEY);
            console.log('Feedback queue synced');
            speakText('Feedback synced. Thank you.');
        }
    } catch (err) {
        console.warn('Sync failed, will retry later', err);
    }
}

function sendFeedback(paperId, kind, reason = null) {
    const entry = {
        paper_id: paperId,
        kind,
        reason,
        ts: new Date().toISOString()
    };

    // Try immediate send if online
    if (navigator.onLine) {
        fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        }).then(resp => {
            if (!resp.ok) {
                // queue locally
                queueFeedback(entry);
                speakText('Saved feedback locally. It will sync when you are online.');
            } else {
                speakText('Thanks, your feedback was recorded.');
            }
        }).catch(() => {
            queueFeedback(entry);
            speakText('Saved feedback locally. It will sync when you are online.');
        });
    } else {
        queueFeedback(entry);
        speakText('Saved feedback locally. It will sync when you are online.');
    }
}

