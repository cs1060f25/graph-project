from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI(title="Prototype 3 API", version="0.1.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# In-memory mock papers and embeddings
PAPERS = [
	{"id": "p1", "title": "Graph-based Contrastive Learning", "keywords": ["graph", "contrastive", "recommendation"], "summary": "Contrastive learning on graphs for better recommendations."},
	{"id": "p2", "title": "Neuroscience meets RL", "keywords": ["neuroscience", "reinforcement learning"], "summary": "Links between dopamine signals and temporal-difference learning."},
	{"id": "p3", "title": "Self-Supervised Vision Transformers", "keywords": ["vision", "transformers", "self-supervised"], "summary": "ViT variants trained with self-supervision."},
	{"id": "p4", "title": "Keyword Overlap Clustering", "keywords": ["clustering", "keywords", "similarity"], "summary": "Clustering using keyword overlap and lightweight force layout."},
	{"id": "p5", "title": "Foundations of Embeddings", "keywords": ["embeddings", "semantic"], "summary": "Overview of semantic embeddings and cosine similarity."},
]

# Deterministic mock embedding function (simulating OpenAI embeddings)
def mock_embed(text: str) -> np.ndarray:
	# Simple hash-based pseudo-embedding for stability across runs
	np.random.seed(abs(hash(text)) % (2**32))
	return np.random.rand(384).astype(np.float32)

# Precompute embeddings for papers
PAPER_EMBEDS = {p["id"]: mock_embed(p["title"] + " " + " ".join(p["keywords"])) for p in PAPERS}

class QueryRequest(BaseModel):
	query: str
	threshold: float = 0.6
	max_nodes: int = 20

@app.get("/health")
async def health():
	return {"ok": True}

@app.post("/api/search")
async def search(req: QueryRequest):
	# Embed the query (mock)
	q = mock_embed(req.query)
	
	# Compute cosine similarity
	norm_q = np.linalg.norm(q) + 1e-9
	nodes = []
	edges = []
	
	for p in PAPERS:
		v = PAPER_EMBEDS[p["id"]]
		sim = float(np.dot(q, v) / (norm_q * (np.linalg.norm(v) + 1e-9)))
		# always include for prototype; record similarity for edge thresholding
		nodes.append({
			"id": p["id"],
			"label": p["title"],
			"summary": p["summary"],
			"keywords": p["keywords"],
			"score": sim,
		})
	
	# Build edges from pairwise cosine similarity + keyword overlap
	for i in range(len(PAPERS)):
		for j in range(i + 1, len(PAPERS)):
			vi = PAPER_EMBEDS[PAPERS[i]["id"]]
			vj = PAPER_EMBEDS[PAPERS[j]["id"]]
			s = float(np.dot(vi, vj) / ((np.linalg.norm(vi) + 1e-9) * (np.linalg.norm(vj) + 1e-9)))
			# keyword overlap boost (lightweight)
			ov = len(set(PAPERS[i]["keywords"]) & set(PAPERS[j]["keywords"]))
			boosted = s + 0.05 * ov
			if boosted >= req.threshold:
				edges.append({
					"id": f"{PAPERS[i]['id']}--{PAPERS[j]['id']}",
					"source": PAPERS[i]["id"],
					"target": PAPERS[j]["id"],
					"weight": round(boosted, 3),
				})
	
	# Sort nodes by score and truncate
	nodes = sorted(nodes, key=lambda n: n["score"], reverse=True)[: req.max_nodes]
	return {"query": req.query, "nodes": nodes, "edges": edges}
