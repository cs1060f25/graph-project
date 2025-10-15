"""API router for graph endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Query

from .models import GraphResponse
from .services import build_graph


router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/expand", response_model=GraphResponse)
def expand_graph(node_id: str = Query(..., description="Node identifier to center on")) -> GraphResponse:
    """Return graph expansion around the requested node."""

    return build_graph(center_id=node_id, depth=1)

