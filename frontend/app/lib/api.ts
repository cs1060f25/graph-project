import { GraphPayload } from "@/app/types/graph";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed: ${response.status} ${text}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchGraph(query: string): Promise<GraphPayload> {
  return request<GraphPayload>(`/graph?query=${encodeURIComponent(query)}`);
}

export async function recenterGraph(nodeLabel: string): Promise<GraphPayload> {
  return request<GraphPayload>(`/graph/recenter`, {
    method: "POST",
    body: JSON.stringify({ node_label: nodeLabel }),
  });
}

