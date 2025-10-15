"""Service layer encapsulating graph operations."""

from __future__ import annotations

from typing import List

from fastapi import HTTPException, status

from . import data
from .models import Edge, GraphResponse, PaperNode


def build_graph(center_id: str, depth: int = 1) -> GraphResponse:
    """Construct a graph expansion around the given center node."""

    seed_ids = data.seed_nodes(center_id, depth=depth)
    if center_id not in seed_ids:
        # center not found
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Node '{center_id}' not found",
        )

    nodes: List[PaperNode] = []
    edges: List[Edge] = []

    for node_id in seed_ids:
        meta = data.get_node(node_id)
        if not meta:
            # Should not happen; skip to remain resilient
            continue

        nodes.append(
            PaperNode(
                id=node_id,
                title=str(meta.get("title")),
                authors=[str(a) for a in meta.get("authors", [])],
                year=meta.get("year"),
                abstract=meta.get("abstract"),
                tags=[str(tag) for tag in meta.get("tags", [])],
                links=meta.get("links", {}),
            )
        )

        for related in data.get_related(node_id):
            if related in seed_ids:
                edges.append(Edge(source=node_id, target=related))

    # Remove duplicate edges by using tuple set
    unique_edges = {
        (edge.source, edge.target) for edge in edges if edge.source != edge.target
    }

    canonical_edges = [Edge(source=s, target=t) for s, t in sorted(unique_edges)]

    return GraphResponse(center_id=center_id, nodes=nodes, edges=canonical_edges)

