"""Mocked data layer for Research Navigator backend."""

from __future__ import annotations

from typing import Dict, List


# Node and edge mock data is intentionally simple for prototype purposes.
# Keys are paper identifiers; values include metadata and adjacency.
GRAPH_NODES: Dict[str, Dict[str, object]] = {
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


def get_node(node_id: str) -> Dict[str, object] | None:
    """Return node metadata if present."""

    return GRAPH_NODES.get(node_id)


def get_related(node_id: str) -> List[str]:
    """Return related node ids for the given node, or empty list."""

    node = GRAPH_NODES.get(node_id)
    if not node:
        return []
    return [n for n in node.get("related", []) if n in GRAPH_NODES]


def seed_nodes(seed_id: str, depth: int = 1) -> List[str]:
    """Return a breadth-first expansion up to the given depth."""

    visited = set([seed_id])
    frontier = [seed_id]
    for _ in range(depth):
        next_frontier: List[str] = []
        for current in frontier:
            for related in get_related(current):
                if related not in visited:
                    visited.add(related)
                    next_frontier.append(related)
        frontier = next_frontier
    return list(visited)

