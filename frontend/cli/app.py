"""CLI application shell for the Research Navigator prototype."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

from .api_client import GraphAPIClient
from .components import render_graph_ascii, render_node_details, render_sidebar
from .data import INITIAL_CENTER, mock_expand, mocked_graph_payload


@dataclass
class GraphState:
    center_id: str
    nodes: List[Dict[str, object]] = field(default_factory=list)
    edges: List[Dict[str, str]] = field(default_factory=list)

    def find_node(self, node_id: str) -> Optional[Dict[str, object]]:
        for node in self.nodes:
            if node.get("id") == node_id:
                return node
        return None


class NavigatorApp:
    def __init__(self, api_client: GraphAPIClient | None = None) -> None:
        self.api_client = api_client or GraphAPIClient()
        payload = mocked_graph_payload()
        self.state = GraphState(
            center_id=str(payload.get("center_id", INITIAL_CENTER)),
            nodes=list(payload.get("nodes", [])),
            edges=list(payload.get("edges", [])),
        )
        self.mode = "graph"  # other mode: "details"

    def refresh(self, node_id: str) -> bool:
        result = self.api_client.expand(node_id)
        if not result:
            fallback = mock_expand(node_id)
            if not fallback:
                return False
            result = fallback
        self.state.center_id = str(result.get("center_id", node_id))
        self.state.nodes = list(result.get("nodes", []))
        self.state.edges = list(result.get("edges", []))
        return True

    def render(self) -> str:
        sidebar = render_sidebar(self.state.nodes, self.state.center_id)
        center_node = self.state.find_node(self.state.center_id) or {}
        detail = render_node_details(center_node)
        if self.mode == "graph":
            graph = render_graph_ascii(self.state.nodes, self.state.edges, self.state.center_id)
        else:
            graph = detail
            detail = render_graph_ascii(self.state.nodes, self.state.edges, self.state.center_id)
        layout = [sidebar, graph, detail]
        return "\n\n".join(layout)

    def handle_command(self, command: str) -> str:
        parts = command.strip().split()
        if not parts:
            return ""
        action = parts[0].lower()
        if action in {"q", "quit", "exit"}:
            raise SystemExit
        if action in {"h", "help"}:
            return self._help_text()
        if action in {"mode", "toggle"}:
            self.mode = "details" if self.mode == "graph" else "graph"
            return f"mode switched to {self.mode}"
        if action in {"recenter", "center", "c"} and len(parts) > 1:
            target = parts[1]
            if self.refresh(target):
                return f"recentred on {target}"
            return f"failed to recentre on {target}"
        return "unknown command; type 'help' for options"

    def _help_text(self) -> str:
        return "\n".join(
            [
                "Commands:",
                "  recenter <node_id>  - expand graph around node",
                "  toggle              - switch between graph/details pane",
                "  help                - show this help",
                "  quit                - exit application",
            ]
        )

