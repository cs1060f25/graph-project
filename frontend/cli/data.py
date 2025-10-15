"""Mocked CLI data for initial graph view."""

from __future__ import annotations

from typing import Dict, List


INITIAL_CENTER = "arxiv:2301.00001"


NODE_CATALOG: Dict[str, Dict[str, object]] = {
    "arxiv:2301.00001": {
        "title": "Graph-Based Contrastive Learning for Recommender Systems",
        "authors": ["Y. Chen", "M. Kumar"],
        "year": 2023,
        "abstract": "We explore contrastive learning paradigms on user-item graphs...",
        "tags": ["recommender", "contrastive learning", "graph neural networks"],
        "links": {
            "doi": "10.48550/arXiv.2301.00001",
            "pdf": "https://arxiv.org/pdf/2301.00001",
        },
        "related": ["arxiv:2210.01234", "arxiv:2204.11111", "arxiv:2303.09090"],
    },
    "arxiv:2210.01234": {
        "title": "Self-Supervised Graph Signals for Implicit Feedback",
        "authors": ["A. Lee", "B. Gomez"],
        "year": 2022,
        "abstract": "Implicit feedback data is leveraged via graph signal processing...",
        "tags": ["implicit feedback", "self-supervised", "signal processing"],
        "links": {
            "doi": "10.48550/arXiv.2210.01234",
            "pdf": "https://arxiv.org/pdf/2210.01234",
        },
        "related": ["arxiv:2301.00001", "arxiv:2006.07012"],
    },
    "arxiv:2204.11111": {
        "title": "Contrastive Multi-Modal Graphs for Content Discovery",
        "authors": ["M. Davis", "S. Patel"],
        "year": 2022,
        "abstract": "We combine text and code repositories into a multi-modal graph...",
        "tags": ["multi-modal", "contrastive", "content discovery"],
        "links": {
            "doi": "10.48550/arXiv.2204.11111",
            "pdf": "https://arxiv.org/pdf/2204.11111",
        },
        "related": ["arxiv:2301.00001", "arxiv:2107.03333"],
    },
    "arxiv:2303.09090": {
        "title": "Efficient Graph Embeddings for Cold Start Recommendations",
        "authors": ["P. Tan", "K. Harper"],
        "year": 2023,
        "abstract": "Cold start recommendation is addressed with meta-learning on graphs...",
        "tags": ["cold start", "meta-learning", "graph embeddings"],
        "links": {
            "doi": "10.48550/arXiv.2303.09090",
            "pdf": "https://arxiv.org/pdf/2303.09090",
        },
        "related": ["arxiv:2301.00001", "arxiv:2011.05432"],
    },
    "arxiv:2006.07012": {
        "title": "Implicit Graph Factorization with Contrastive Objectives",
        "authors": ["J. Harper", "R. Singh"],
        "year": 2020,
        "abstract": "Factorizing implicit interaction graphs with contrastive losses...",
        "tags": ["factorization", "implicit", "contrastive"],
        "links": {
            "doi": "10.48550/arXiv.2006.07012",
            "pdf": "https://arxiv.org/pdf/2006.07012",
        },
        "related": ["arxiv:2210.01234", "arxiv:2107.03333"],
    },
    "arxiv:2107.03333": {
        "title": "Graph Curriculum for Recommendation Tasks",
        "authors": ["V. Gupta", "L. Zhou"],
        "year": 2021,
        "abstract": "Curriculum learning strategies on user-item bipartite graphs...",
        "tags": ["curriculum learning", "recommendation", "graphs"],
        "links": {
            "doi": "10.48550/arXiv.2107.03333",
            "pdf": "https://arxiv.org/pdf/2107.03333",
        },
        "related": ["arxiv:2204.11111", "arxiv:2006.07012"],
    },
    "arxiv:2011.05432": {
        "title": "Topology-Aware Sampling for Sparse Graphs",
        "authors": ["S. Alvarez", "H. Lim"],
        "year": 2021,
        "abstract": "We introduce topology-aware sampling to preserve community structure...",
        "tags": ["sampling", "sparse graphs", "topology"],
        "links": {
            "doi": "10.48550/arXiv.2011.05432",
            "pdf": "https://arxiv.org/pdf/2011.05432",
        },
        "related": ["arxiv:2303.09090", "arxiv:1905.06666"],
    },
    "arxiv:1905.06666": {
        "title": "Survey: Graph Neural Networks for Recommendations",
        "authors": ["R. Harper", "I. Gutierrez"],
        "year": 2019,
        "abstract": "A comprehensive survey of GNN-based recommendation techniques...",
        "tags": ["survey", "gnn", "recommendation"],
        "links": {
            "doi": "10.1145/nnnnnnn",
            "pdf": "https://arxiv.org/pdf/1905.06666",
        },
        "related": ["arxiv:2011.05432", "arxiv:1804.08036"],
    },
    "arxiv:1804.08036": {
        "title": "Neural Graph Collaborative Filtering",
        "authors": ["X. Wang", "X. He"],
        "year": 2018,
        "abstract": "We present NGCF, a neural collaborative filtering method leveraging graphs...",
        "tags": ["collaborative filtering", "graph neural networks"],
        "links": {
            "doi": "10.1145/nnnnnnm",
            "pdf": "https://arxiv.org/pdf/1804.08036",
        },
        "related": ["arxiv:1905.06666", "arxiv:1703.05445"],
    },
    "arxiv:1703.05445": {
        "title": "Graph Auto-Encoders for Recommendation",
        "authors": ["T. Kipf", "M. Welling"],
        "year": 2017,
        "abstract": "We adapt graph auto-encoders to collaborative filtering tasks...",
        "tags": ["auto-encoders", "graphs", "recommendation"],
        "links": {
            "doi": "10.1007/nnn000",
            "pdf": "https://arxiv.org/pdf/1703.05445",
        },
        "related": ["arxiv:1804.08036", "arxiv:1609.02907"],
    },
    "arxiv:1609.02907": {
        "title": "Matrix Completion with Graph Side Information",
        "authors": ["R. Fan", "J. Li"],
        "year": 2016,
        "abstract": "Matrix completion improved via graph-regularized embeddings...",
        "tags": ["matrix completion", "graph regularization"],
        "links": {
            "doi": "10.1109/nnnn",
            "pdf": "https://arxiv.org/pdf/1609.02907",
        },
        "related": ["arxiv:1703.05445"],
    },
}


def mocked_graph_payload() -> Dict[str, object]:
    """Return a static graph payload mirroring backend defaults."""

    initial_ids = [INITIAL_CENTER, "arxiv:2210.01234", "arxiv:2204.11111", "arxiv:2303.09090"]
    nodes = [_node_payload(node_id) for node_id in initial_ids]
    edges = []
    for rel in NODE_CATALOG[INITIAL_CENTER]["related"]:
        edges.append({"source": INITIAL_CENTER, "target": rel})
    edges.append({"source": "arxiv:2210.01234", "target": "arxiv:2204.11111"})
    return {"center_id": INITIAL_CENTER, "nodes": nodes, "edges": edges}


def mock_expand(node_id: str) -> Dict[str, object] | None:
    if node_id not in NODE_CATALOG:
        return None
    seed_ids = _seed_nodes(node_id)
    nodes = [_node_payload(sid) for sid in seed_ids]
    edges = []
    for sid in seed_ids:
        related = NODE_CATALOG[sid].get("related", [])
        for rel in related:
            if rel in seed_ids:
                edges.append({"source": sid, "target": rel})
    unique_edges = {
        (edge["source"], edge["target"])
        for edge in edges
        if edge["source"] != edge["target"]
    }
    canonical_edges = [{"source": s, "target": t} for s, t in sorted(unique_edges)]
    return {"center_id": node_id, "nodes": nodes, "edges": canonical_edges}


def _seed_nodes(seed_id: str, depth: int = 1) -> List[str]:
    visited = {seed_id}
    frontier = [seed_id]
    for _ in range(depth):
        next_frontier: List[str] = []
        for current in frontier:
            related = NODE_CATALOG.get(current, {}).get("related", [])
            for rel in related:
                if rel in NODE_CATALOG and rel not in visited:
                    visited.add(rel)
                    next_frontier.append(rel)
        frontier = next_frontier
    return list(visited)


def _node_payload(node_id: str) -> Dict[str, object]:
    meta = NODE_CATALOG[node_id]
    return {"id": node_id, **{k: v for k, v in meta.items() if k != "related"}}
def format_node_header(node: Dict[str, object]) -> str:
    return f"{node.get('title', 'Untitled')} ({node.get('year', 'n/a')})"


def list_authors(node: Dict[str, object]) -> str:
    authors: List[str] = [str(a) for a in node.get("authors", [])]
    return ", ".join(authors) if authors else "Unknown authors"

