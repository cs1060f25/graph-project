"""Reusable CLI components for rendering graph data."""

from __future__ import annotations

from typing import Dict, Iterable, List

from .data import format_node_header, list_authors
from .theme import THEME


def render_sidebar(nodes: Iterable[Dict[str, object]], center_id: str) -> str:
    lines: List[str] = []
    lines.append(_border_line("Sidebar"))
    for node in nodes:
        prefix = "➤" if node.get("id") == center_id else " "
        title = format_node_header(node)
        lines.append(f"{prefix} {title}")
    lines.append(_border_line())
    return "\n".join(lines)


def render_node_details(node: Dict[str, object]) -> str:
    lines = [_border_line("Details"), format_node_header(node)]
    lines.append(f"Authors: {list_authors(node)}")
    abstract = node.get("abstract", "No abstract available")
    lines.append("")
    lines.append("Abstract:")
    lines.extend(_wrap_text(str(abstract), width=76))
    tags = ", ".join([str(tag) for tag in node.get("tags", [])]) or "None"
    lines.append("")
    lines.append(f"Tags: {tags}")
    links = node.get("links", {})
    lines.append(f"DOI: {links.get('doi', 'n/a')}")
    lines.append(f"PDF: {links.get('pdf', 'n/a')}")
    lines.append(_border_line())
    return "\n".join(lines)


def render_graph_ascii(nodes: Iterable[Dict[str, object]], edges: Iterable[Dict[str, str]], center_id: str) -> str:
    node_map = {node["id"]: node for node in nodes}
    lines = [_border_line("Graph"), f"Center: {format_node_header(node_map[center_id])}" if center_id in node_map else ""]

    for edge in edges:
        src = edge.get("source")
        tgt = edge.get("target")
        src_title = node_map.get(src, {}).get("title", src)
        tgt_title = node_map.get(tgt, {}).get("title", tgt)
        lines.append(f"[{src_title}] -- [{tgt_title}]")

    lines.append(_border_line())
    return "\n".join(filter(None, lines))


def _border_line(title: str | None = None) -> str:
    base = "=" * 80
    if not title:
        return base
    pad = (80 - len(title) - 2) // 2
    return f"{'=' * pad} {title} {'=' * pad}".ljust(80, "=")


def _wrap_text(text: str, width: int = 80) -> List[str]:
    words = text.split()
    if not words:
        return [""]
    lines: List[str] = []
    current: List[str] = []
    current_len = 0
    for word in words:
        if current_len + len(word) + len(current) > width:
            lines.append(" ".join(current))
            current = [word]
            current_len = len(word)
        else:
            current.append(word)
            current_len += len(word)
    if current:
        lines.append(" ".join(current))
    return lines

