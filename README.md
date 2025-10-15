# Research Graph Explorer (MVP)

A modern, conversational interface to explore a semantic-similarity graph of research papers. Enter a natural-language prompt; the app renders an interactive graph with edges built from mocked embeddings (cosine similarity) and keyword overlap.

## Features

- Natural-language query (chat-style landing)
- Server API with mocked embeddings and cosine similarity
- Client-side graph visualization with React Flow
- Live slider to adjust edge-weight threshold
- Basic PWA manifest

## Tech Stack

- Frontend: Next.js (App Router), React, React Flow
- Backend: FastAPI (Python)
- Data: In-memory JSON (no persistent DB)

## Getting Started

### Backend
```bash
cd p3/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend
```bash
cd p3/frontend
npm install
npm run dev
# open http://localhost:3000
```

## Usage

1) On the landing page, type a prompt (e.g., “papers connecting neuroscience and reinforcement learning”).
2) Click “Generate Graph” to navigate to the graph view.
3) Use the edge-threshold slider to tighten/loosen semantic connections in real-time.

## Notes

- The backend currently returns a deterministic set of nodes; similarity edges are computed based on mocked embeddings and keyword overlap.
- This is designed to be easily swapped to a real embedding provider later.
