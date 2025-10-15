"""Response models for the API."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class GraphNode(BaseModel):
    id: str
    title: str
    type: str
    year: int
    score: float
    summary: str
    tags: List[str]


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float
    relation: str


class RelatedQuery(BaseModel):
    node_id: str
    query: str
    label: str


class Recommendation(BaseModel):
    node_id: str
    title: str
    authors: List[str]
    venue: str
    year: int


class NodeDetail(BaseModel):
    summary: str
    authors: List[str]
    venue: str
    year: int
    tags: List[str]
    links: dict[str, str]


class GraphResponse(BaseModel):
    query: str
    center_node: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    related_queries: List[RelatedQuery]
    recommendations: List[Recommendation]
    node_details: dict[str, NodeDetail]

