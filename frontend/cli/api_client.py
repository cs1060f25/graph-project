"""Simple API client for backend interactions."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Dict, Optional

import httpx


@dataclass
class APIConfig:
    base_url: str = "http://localhost:8000"


class GraphAPIClient:
    def __init__(self, config: APIConfig | None = None) -> None:
        self.config = config or APIConfig()

    def expand(self, node_id: str) -> Optional[Dict[str, object]]:
        url = f"{self.config.base_url}/graph/expand"
        try:
            response = httpx.get(url, params={"node_id": node_id}, timeout=5.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as exc:
            print(f"[network] failed to reach backend: {exc}")
        except httpx.HTTPStatusError as exc:
            payload = exc.response.text
            print(f"[backend] error {exc.response.status_code}: {payload}")
        except json.JSONDecodeError:
            print("[backend] invalid JSON response")
        return None

