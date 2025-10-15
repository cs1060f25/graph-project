from __future__ import annotations

import asyncio
from typing import List, Optional

import strawberry
from strawberry.types import Info
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

from data import GRAPH_RELATIONS, PAPERS, PaperEdge, PaperNode, graph_snapshot


@strawberry.type
class PaperLink:
    doi: Optional[str]
    pdf: Optional[str]


@strawberry.type
class Paper:
    id: str
    title: str
    authors: List[str]
    year: int
    abstract: str
    tags: List[str]
    links: PaperLink


@strawberry.type
class Edge:
    source: str
    target: str
    relation: str


@strawberry.type
class GraphPayload:
    center: Paper
    neighbors: List[Paper]
    edges: List[Edge]


def serialize_paper(node: PaperNode) -> Paper:
    return Paper(
        id=node.id,
        title=node.title,
        authors=node.authors,
        year=node.year,
        abstract=node.abstract,
        tags=node.tags,
        links=PaperLink(**node.links),
    )


def serialize_edge(edge: PaperEdge) -> Edge:
    return Edge(source=edge.source, target=edge.target, relation=edge.relation)


async def resolve_graph(info: Info, query: str) -> GraphPayload:
    # Simulate IO latency to mimic real backend behaviour
    await asyncio.sleep(0.05)

    try:
        snapshot = graph_snapshot(query)
    except KeyError as exc:
        raise ValueError(f"No paper found for query '{query}'.") from exc

    center = serialize_paper(PAPERS[query])
    neighbors = [serialize_paper(node) for node in snapshot["nodes"] if node.id != query]
    edges = [serialize_edge(edge) for edge in snapshot["edges"]]
    return GraphPayload(center=center, neighbors=neighbors, edges=edges)


@strawberry.type
class Query:
    graph: GraphPayload = strawberry.field(resolver=resolve_graph)


schema = strawberry.Schema(query=Query)

app = FastAPI()
router = GraphQLRouter(schema, graphiql=True)
app.include_router(router, prefix="/graphql")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
