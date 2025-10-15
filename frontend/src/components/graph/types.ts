export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  tags: string[];
  links: {
    doi?: string | null;
    pdf?: string | null;
  };
};

export type Edge = {
  source: string;
  target: string;
  relation: string;
};

export type GraphData = {
  center: Paper;
  neighbors: Paper[];
  edges: Edge[];
};

export type GraphNode = {
  id: string;
  label: string;
  isCenter: boolean;
  paper: Paper;
};

export type GraphLink = {
  source: string;
  target: string;
  relation: string;
};
