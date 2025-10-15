"""Service layer for graph queries."""

from __future__ import annotations

from . import data, schemas


def search_graph(query: str) -> schemas.GraphResponse:
    graph_data = data.get_graph_by_query(query)
    return schemas.GraphResponse.model_validate(graph_data)


def recenter_graph(node_id: str) -> schemas.GraphResponse:
    graph_data = data.get_graph_by_node(node_id)
    return schemas.GraphResponse.model_validate(graph_data)

