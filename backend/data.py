from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class PaperNode:
    id: str
    title: str
    authors: List[str]
    year: int
    abstract: str
    tags: List[str]
    links: Dict[str, str]


@dataclass
class PaperEdge:
    source: str
    target: str
    relation: str


PAPERS: Dict[str, PaperNode] = {
    "graph-contrastive-learning": PaperNode(
        id="graph-contrastive-learning",
        title="Graph-based Contrastive Learning for Recommender Systems",
        authors=["L. Chen", "M. Zhao"],
        year=2023,
        abstract=(
            "We present a graph-based contrastive learning framework that improves recommendation "
            "accuracy by leveraging high-order connectivity in user-item interaction graphs."
        ),
        tags=["recommender systems", "graph learning", "contrastive learning"],
        links={
            "doi": "10.1145/graphcl2023",
            "pdf": "https://arxiv.org/abs/2301.01234",
        },
    ),
    "graph-transformers": PaperNode(
        id="graph-transformers",
        title="Graph Transformers in Practice",
        authors=["S. Kumar", "R. Patel"],
        year=2024,
        abstract=(
            "A practitioner-oriented survey covering architectural patterns and reproducibility "
            "considerations for graph transformers in enterprise settings."
        ),
        tags=["graph transformers", "applications", "survey"],
        links={
            "doi": "10.5555/graphtransformers2024",
            "pdf": "https://arxiv.org/abs/2403.04567",
        },
    ),
    "contrastive-pretraining": PaperNode(
        id="contrastive-pretraining",
        title="Contrastive Pretraining for Scientific Document Understanding",
        authors=["A. Singh", "V. Li"],
        year=2022,
        abstract=(
            "A pretraining approach that aligns textual and citation graph signals for improved "
            "scientific document retrieval."
        ),
        tags=["contrastive learning", "scientific retrieval"],
        links={
            "doi": "10.1016/contrastivepretraining",
            "pdf": "https://arxiv.org/abs/2210.07890",
        },
    ),
    "evaluation-benchmarks": PaperNode(
        id="evaluation-benchmarks",
        title="Evaluation Benchmarks for Graph Recommendation",
        authors=["J. Lopez", "K. Nguyen"],
        year=2021,
        abstract=(
            "We introduce benchmark datasets and standardized evaluation protocols for graph-based "
            "recommendation models."
        ),
        tags=["evaluation", "recommender systems"],
        links={
            "doi": "10.7890/graphbenchmarks",
            "pdf": "https://arxiv.org/abs/2112.03456",
        },
    ),
    "application-case-study": PaperNode(
        id="application-case-study",
        title="Scaling Graph Contrastive Recommenders in Production",
        authors=["T. Alvarez", "B. Morgan"],
        year=2024,
        abstract=(
            "A case study on deploying graph contrastive recommender systems for large-scale media "
            "recommendation pipelines."
        ),
        tags=["production", "case study", "recommender systems"],
        links={
            "doi": "10.3180/graphcase2024",
            "pdf": "https://arxiv.org/abs/2406.00987",
        },
    ),
}


GRAPH_RELATIONS: Dict[str, List[PaperEdge]] = {
    "graph-contrastive-learning": [
        PaperEdge("graph-contrastive-learning", "graph-transformers", "extends"),
        PaperEdge("graph-contrastive-learning", "contrastive-pretraining", "builds_on"),
        PaperEdge("graph-contrastive-learning", "evaluation-benchmarks", "evaluated_with"),
    ],
    "graph-transformers": [
        PaperEdge("graph-transformers", "graph-contrastive-learning", "compares_to"),
        PaperEdge("graph-transformers", "contrastive-pretraining", "references"),
    ],
    "contrastive-pretraining": [
        PaperEdge("contrastive-pretraining", "graph-contrastive-learning", "inspired"),
        PaperEdge("contrastive-pretraining", "evaluation-benchmarks", "benchmarks"),
    ],
    "evaluation-benchmarks": [
        PaperEdge("evaluation-benchmarks", "graph-contrastive-learning", "evaluates"),
        PaperEdge("evaluation-benchmarks", "application-case-study", "applied_in"),
    ],
    "application-case-study": [
        PaperEdge("application-case-study", "graph-contrastive-learning", "deploys"),
        PaperEdge("application-case-study", "graph-transformers", "integrates"),
    ],
}


def neighbors_for(node_id: str) -> List[PaperNode]:
    edges = GRAPH_RELATIONS.get(node_id, [])
    seen = {node_id}
    results: List[PaperNode] = []
    for edge in edges:
        target_id = edge.target
        if target_id in seen:
            continue
        if target_id not in PAPERS:
            continue
        seen.add(target_id)
        results.append(PAPERS[target_id])
    return results


def graph_snapshot(center_id: str) -> Dict[str, List]:
    center = PAPERS.get(center_id)
    if not center:
        raise KeyError(center_id)

    nodes = [center]
    edges = []
    for edge in GRAPH_RELATIONS.get(center_id, []):
        if edge.target not in PAPERS:
            continue
        nodes.append(PAPERS[edge.target])
        edges.append(edge)

    return {
        "nodes": nodes,
        "edges": edges,
    }
