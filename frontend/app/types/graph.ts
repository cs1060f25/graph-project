export type GraphNode = {
  id: string;
  label: string;
  type: string;
  summary: string;
  voice_summary: string;
  is_central: boolean;
};

export type GraphEdge = {
  source: string;
  target: string;
  relationship: string;
  confidence: number;
};

export type GraphPayload = {
  query: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  prompt: {
    intro: string;
    recap: string;
  };
  recommendations?: string[] | null;
};

