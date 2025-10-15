"""CLI theme definitions derived from design schema."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Theme:
    background: str = "#0E0E0F"
    sidebar_background: str = "#1C1C1E"
    graph_background: str = "#121214"
    panel_background: str = "#1F1F22"
    text_primary: str = "#FFFFFF"
    text_secondary: str = "#B0B0B5"
    accent_purple: str = "#8A4FFF"
    accent_purple_light: str = "#B18CFF"
    accent_gray: str = "#2A2A2D"
    border: str = "#2F2F33"

    font_family: str = "Inter, Helvetica, Arial, sans-serif"
    font_size_base: str = "14px"
    font_weight_normal: int = 400
    font_weight_bold: int = 600
    line_height: float = 1.5


THEME = Theme()

