"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { GraphPayload } from "@/data/mockGraph";
import {
  getMockGraphByNode,
  getMockGraphByQuery,
} from "@/data/mockGraph";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

async function fetchGraph(url: string): Promise<GraphPayload> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as GraphPayload;
  return payload;
}

export function useGraphData(initialQuery: string) {
  const [data, setData] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const query = useMemo(() => initialQuery.toLowerCase(), [initialQuery]);

  const loadByQuery = useCallback(
    async (newQuery: string) => {
      const normalized = newQuery.toLowerCase();
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchGraph(
          `${API_BASE}/graph/search?query=${encodeURIComponent(normalized)}`,
        );
        setData(payload);
        setSelectedNode(payload.center_node);
      } catch (err) {
        const fallback = getMockGraphByQuery(normalized);
        if (fallback) {
          setData(fallback);
          setSelectedNode(fallback.center_node);
        } else {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadByNode = useCallback(async (nodeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchGraph(
        `${API_BASE}/graph/recenter?node_id=${encodeURIComponent(nodeId)}`,
      );
      setData(payload);
      setSelectedNode(payload.center_node);
    } catch (err) {
      const fallback = getMockGraphByNode(nodeId);
      if (fallback) {
        setData(fallback);
        setSelectedNode(fallback.center_node);
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadByQuery(query);
  }, [loadByQuery, query]);

  return {
    data,
    loading,
    error,
    selectedNode,
    setSelectedNode,
    loadByQuery,
    loadByNode,
  };
}
