"""FastAPI application entrypoint."""

from fastapi import FastAPI, HTTPException

from . import schemas, services

app = FastAPI(title="Research Navigator API", version="0.1.0")


@app.get("/health", response_model=schemas.HealthResponse)
def health() -> schemas.HealthResponse:
    """Simple health check endpoint."""

    return schemas.HealthResponse(status="ok")


@app.get("/graph/search", response_model=schemas.GraphResponse)
def search_graph(query: str) -> schemas.GraphResponse:
    """Return graph data for a given query."""

    try:
        return services.search_graph(query)
    except KeyError as exc:  # pragma: no cover - simple error mapping
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/graph/recenter", response_model=schemas.GraphResponse)
def recenter_graph(node_id: str) -> schemas.GraphResponse:
    """Return graph data around a given node identifier."""

    try:
        return services.recenter_graph(node_id)
    except KeyError as exc:  # pragma: no cover - simple error mapping
        raise HTTPException(status_code=404, detail=str(exc)) from exc

