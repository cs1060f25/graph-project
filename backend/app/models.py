"""Pydantic models for Research Navigator API."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class Link(BaseModel):
    doi: Optional[str] = Field(default=None, description="DOI reference link")
    pdf: Optional[str] = Field(default=None, description="Direct PDF link")


class PaperNode(BaseModel):
    id: str = Field(..., description="Unique identifier for the paper")
    title: str
    authors: List[str]
    year: Optional[int] = None
    abstract: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    links: Link = Field(default_factory=Link)


class Edge(BaseModel):
    source: str
    target: str


class GraphResponse(BaseModel):
    center_id: str
    nodes: List[PaperNode]
    edges: List[Edge]


class ErrorResponse(BaseModel):
    detail: str

