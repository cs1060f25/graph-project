export type GraphNode = {
  id: string;
  title: string;
  type: string;
  year: number;
  score: number;
  summary: string;
  tags: string[];
};

export type GraphEdge = {
  source: string;
  target: string;
  weight: number;
  relation: string;
};

export type RelatedQuery = {
  node_id: string;
  query: string;
  label: string;
};

export type Recommendation = {
  node_id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
};

export type NodeDetail = {
  summary: string;
  authors: string[];
  venue: string;
  year: number;
  tags: string[];
  links: Record<string, string>;
};

export type GraphPayload = {
  query: string;
  center_node: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  related_queries: RelatedQuery[];
  recommendations: Recommendation[];
  node_details: Record<string, NodeDetail>;
};

const graphBasedContrastiveLearning: GraphPayload = {
  query: "graph-based contrastive learning",
  center_node: "n1",
  nodes: [
    {
      id: "n1",
      title: "Graph-Based Contrastive Learning for Recommender Systems",
      type: "paper",
      year: 2023,
      score: 0.94,
      summary:
        "Introduces a contrastive pipeline tailored for recommender graphs with cold-start resilience.",
      tags: ["recommender", "contrastive"],
    },
    {
      id: "n2",
      title: "Contrastive Learning with Graph Augmentations",
      type: "paper",
      year: 2022,
      score: 0.89,
      summary:
        "Evaluates augmentation schemes for self-supervised objectives on graphs.",
      tags: ["augmentation", "graph"],
    },
    {
      id: "n3",
      title: "GNN-Based Recommendation Benchmarks",
      type: "paper",
      year: 2021,
      score: 0.88,
      summary:
        "Benchmarks multiple GNN architectures on industry-scale recommendation datasets.",
      tags: ["benchmark", "gnn"],
    },
    {
      id: "n4",
      title: "User Behavior Graph Embeddings",
      type: "paper",
      year: 2020,
      score: 0.81,
      summary:
        "Models multi-session user behavior graphs for personalized ranking.",
      tags: ["user", "embedding"],
    },
    {
      id: "n5",
      title: "Self-Supervised Graph Representations",
      type: "paper",
      year: 2023,
      score: 0.86,
      summary:
        "Surveys self-supervised objectives for graphs and highlights contrastive variants.",
      tags: ["self-supervised", "survey"],
    },
  ],
  edges: [
    { source: "n1", target: "n2", weight: 0.82, relation: "method" },
    { source: "n1", target: "n3", weight: 0.79, relation: "baseline" },
    { source: "n1", target: "n4", weight: 0.63, relation: "application" },
    { source: "n2", target: "n5", weight: 0.71, relation: "survey" },
    { source: "n3", target: "n4", weight: 0.58, relation: "dataset" },
  ],
  related_queries: [
    {
      node_id: "n2",
      query: "contrastive graph augmentation",
      label: "Augmentation playbooks",
    },
    {
      node_id: "n3",
      query: "gnn-based recommendation benchmarks",
      label: "Benchmark suite",
    },
    {
      node_id: "n4",
      query: "user behavior graph embeddings",
      label: "User modeling",
    },
    {
      node_id: "n5",
      query: "self-supervised graph representations",
      label: "Self-supervision",
    },
  ],
  recommendations: [
    {
      node_id: "n1",
      title: "Graph-Based Contrastive Learning for Recommender Systems",
      authors: ["Chen", "Liu"],
      venue: "RecSys",
      year: 2023,
    },
    {
      node_id: "n2",
      title: "Contrastive Learning with Graph Augmentations",
      authors: ["Zhou", "Tang"],
      venue: "NeurIPS",
      year: 2022,
    },
  ],
  node_details: {
    n1: {
      summary:
        "Contrastive objectives tuned for implicit feedback graphs with ablations on negative sampling.",
      authors: ["Yuan Chen", "Mei Liu"],
      venue: "RecSys 2023",
      year: 2023,
      tags: ["recommender", "contrastive", "graph"],
      links: {
        doi: "10.1234/rn.n1",
        pdf: "https://example.org/n1.pdf",
      },
    },
    n2: {
      summary:
        "Systematic comparison of stochastic graph augmentations (edge-drop, mask) for contrastive tasks.",
      authors: ["Lan Zhou", "Jia Tang"],
      venue: "NeurIPS 2022",
      year: 2022,
      tags: ["augmentation", "contrastive"],
      links: {
        doi: "10.1234/rn.n2",
        pdf: "https://example.org/n2.pdf",
      },
    },
    n3: {
      summary:
        "Provides reproducible baselines and metrics for industry-scale GNN recommenders.",
      authors: ["F. Gomez", "I. Patel"],
      venue: "KDD 2021",
      year: 2021,
      tags: ["benchmark", "gnn"],
      links: {
        doi: "10.1234/rn.n3",
        pdf: "https://example.org/n3.pdf",
      },
    },
    n4: {
      summary: "Captures temporal user interests with dynamic hypergraph embeddings.",
      authors: ["Sara Klein", "Akash Rao"],
      venue: "WWW 2020",
      year: 2020,
      tags: ["user", "embedding", "temporal"],
      links: {
        doi: "10.1234/rn.n4",
        pdf: "https://example.org/n4.pdf",
      },
    },
    n5: {
      summary:
        "Survey covering predictive, generative, and contrastive paradigms for self-supervised graphs.",
      authors: ["Anita Desai", "Miguel Torres"],
      venue: "ArXiv",
      year: 2023,
      tags: ["self-supervised", "survey"],
      links: {
        doi: "10.1234/rn.n5",
        pdf: "https://example.org/n5.pdf",
      },
    },
  },
};

const contrastiveGraphAugmentation: GraphPayload = {
  query: "contrastive graph augmentation",
  center_node: "n2",
  nodes: [
    {
      id: "n2",
      title: "Contrastive Learning with Graph Augmentations",
      type: "paper",
      year: 2022,
      score: 0.89,
      summary:
        "Evaluates augmentation schemes for self-supervised objectives on graphs.",
      tags: ["augmentation", "graph"],
    },
    {
      id: "n6",
      title: "Adaptive Graph Data Augmentation",
      type: "paper",
      year: 2024,
      score: 0.92,
      summary:
        "Learns augmentation policies aligned with downstream recommender metrics.",
      tags: ["augmentation", "policy"],
    },
    {
      id: "n7",
      title: "Contrastive Pre-Training on Graphs",
      type: "paper",
      year: 2023,
      score: 0.87,
      summary:
        "Pre-training encoder-decoder graph models with multi-view contrastive losses.",
      tags: ["pretraining", "contrastive"],
    },
  ],
  edges: [
    { source: "n2", target: "n6", weight: 0.77, relation: "policy" },
    { source: "n2", target: "n7", weight: 0.74, relation: "pretrain" },
    { source: "n6", target: "n7", weight: 0.69, relation: "shared techniques" },
  ],
  related_queries: [
    {
      node_id: "n6",
      query: "graph data augmentation",
      label: "Adaptive augmentation",
    },
    {
      node_id: "n7",
      query: "graph contrastive pretraining",
      label: "Pre-training",
    },
  ],
  recommendations: [
    {
      node_id: "n6",
      title: "Adaptive Graph Data Augmentation",
      authors: ["M. Singh", "Priya Rao"],
      venue: "ICML",
      year: 2024,
    },
  ],
  node_details: {
    n2: {
      summary:
        "Systematic comparison of stochastic graph augmentations (edge-drop, mask) for contrastive tasks.",
      authors: ["Lan Zhou", "Jia Tang"],
      venue: "NeurIPS 2022",
      year: 2022,
      tags: ["augmentation", "contrastive"],
      links: {
        doi: "10.1234/rn.n2",
        pdf: "https://example.org/n2.pdf",
      },
    },
    n6: {
      summary:
        "Learns augmentation policies grounded in evaluation metrics with reinforcement learning.",
      authors: ["Manu Singh", "Priya Rao"],
      venue: "ICML 2024",
      year: 2024,
      tags: ["augmentation", "policy"],
      links: {
        doi: "10.1234/rn.n6",
        pdf: "https://example.org/n6.pdf",
      },
    },
    n7: {
      summary:
        "Showcases improvements from pre-training encoders on unlabeled graphs before fine-tuning.",
      authors: ["Luisa Park", "Ken Wu"],
      venue: "ICLR 2023",
      year: 2023,
      tags: ["pretraining", "contrastive"],
      links: {
        doi: "10.1234/rn.n7",
        pdf: "https://example.org/n7.pdf",
      },
    },
  },
};

const gnnBenchmarks: GraphPayload = {
  query: "gnn-based recommendation benchmarks",
  center_node: "n3",
  nodes: [
    {
      id: "n3",
      title: "GNN-Based Recommendation Benchmarks",
      type: "paper",
      year: 2021,
      score: 0.88,
      summary:
        "Benchmarks multiple GNN architectures on industry-scale recommendation datasets.",
      tags: ["benchmark", "gnn"],
    },
    {
      id: "n8",
      title: "Benchmarking Graph Recommenders",
      type: "paper",
      year: 2020,
      score: 0.8,
      summary:
        "Defines standard evaluation pipelines for graph recommenders.",
      tags: ["benchmark", "evaluation"],
    },
    {
      id: "n9",
      title: "Large-Scale GNN Recsys",
      type: "paper",
      year: 2022,
      score: 0.82,
      summary:
        "Discusses engineering challenges in deploying large-scale GNN recommenders.",
      tags: ["scale", "systems"],
    },
  ],
  edges: [
    { source: "n3", target: "n8", weight: 0.73, relation: "baseline" },
    { source: "n3", target: "n9", weight: 0.62, relation: "deployment" },
    { source: "n8", target: "n9", weight: 0.55, relation: "dataset" },
  ],
  related_queries: [
    {
      node_id: "n8",
      query: "graph recommender evaluation",
      label: "Evaluation",
    },
    {
      node_id: "n9",
      query: "large-scale gnn recommender systems",
      label: "Large-scale systems",
    },
  ],
  recommendations: [
    {
      node_id: "n9",
      title: "Large-Scale GNN Recsys",
      authors: ["A. Miller", "Kristin Cho"],
      venue: "VLDB",
      year: 2022,
    },
  ],
  node_details: {
    n3: {
      summary:
        "Provides reproducible baselines and metrics for industry-scale GNN recommenders.",
      authors: ["F. Gomez", "I. Patel"],
      venue: "KDD 2021",
      year: 2021,
      tags: ["benchmark", "gnn"],
      links: {
        doi: "10.1234/rn.n3",
        pdf: "https://example.org/n3.pdf",
      },
    },
    n8: {
      summary:
        "Defines standardized dataset splits and metrics for graph recommenders.",
      authors: ["R. Lee", "Jan Novak"],
      venue: "RecSys 2020",
      year: 2020,
      tags: ["benchmark", "evaluation"],
      links: {
        doi: "10.1234/rn.n8",
        pdf: "https://example.org/n8.pdf",
      },
    },
    n9: {
      summary:
        "Discusses distributed training and feature stores for industry-scale GNN recommenders.",
      authors: ["Alex Miller", "Kristin Cho"],
      venue: "VLDB 2022",
      year: 2022,
      tags: ["systems", "scale"],
      links: {
        doi: "10.1234/rn.n9",
        pdf: "https://example.org/n9.pdf",
      },
    },
  },
};

const userBehaviorEmbeddings: GraphPayload = {
  query: "user behavior graph embeddings",
  center_node: "n4",
  nodes: [
    {
      id: "n4",
      title: "User Behavior Graph Embeddings",
      type: "paper",
      year: 2020,
      score: 0.81,
      summary:
        "Models multi-session user behavior graphs for personalized ranking.",
      tags: ["user", "embedding"],
    },
    {
      id: "n10",
      title: "Temporal User Graph Modeling",
      type: "paper",
      year: 2021,
      score: 0.8,
      summary: "Applies temporal attention to evolving user-item graphs.",
      tags: ["temporal", "attention"],
    },
    {
      id: "n11",
      title: "Session-Based Recommendation with Hypergraphs",
      type: "paper",
      year: 2022,
      score: 0.78,
      summary: "Uses hypergraph structure to capture co-viewing signals in sessions.",
      tags: ["session", "hypergraph"],
    },
  ],
  edges: [
    { source: "n4", target: "n10", weight: 0.66, relation: "temporal" },
    { source: "n4", target: "n11", weight: 0.6, relation: "session" },
    { source: "n10", target: "n11", weight: 0.57, relation: "co-usage" },
  ],
  related_queries: [
    {
      node_id: "n10",
      query: "temporal user graph modeling",
      label: "Temporal signals",
    },
    {
      node_id: "n11",
      query: "session-based hypergraph recommendation",
      label: "Session hypergraphs",
    },
  ],
  recommendations: [
    {
      node_id: "n10",
      title: "Temporal User Graph Modeling",
      authors: ["P. Singh", "L. Ortega"],
      venue: "WSDM",
      year: 2021,
    },
  ],
  node_details: {
    n4: {
      summary: "Captures temporal user interests with dynamic hypergraph embeddings.",
      authors: ["Sara Klein", "Akash Rao"],
      venue: "WWW 2020",
      year: 2020,
      tags: ["user", "embedding", "temporal"],
      links: {
        doi: "10.1234/rn.n4",
        pdf: "https://example.org/n4.pdf",
      },
    },
    n10: {
      summary: "Combines temporal attention with graph convolution for user modeling.",
      authors: ["Priya Singh", "Luis Ortega"],
      venue: "WSDM 2021",
      year: 2021,
      tags: ["temporal", "attention"],
      links: {
        doi: "10.1234/rn.n10",
        pdf: "https://example.org/n10.pdf",
      },
    },
    n11: {
      summary:
        "Applies hypergraph neural networks to capture multi-item interactions per session.",
      authors: ["H. Cho", "Marina Patel"],
      venue: "CIKM 2022",
      year: 2022,
      tags: ["session", "hypergraph"],
      links: {
        doi: "10.1234/rn.n11",
        pdf: "https://example.org/n11.pdf",
      },
    },
  },
};

const selfSupervisedGraphReps: GraphPayload = {
  query: "self-supervised graph representations",
  center_node: "n5",
  nodes: [
    {
      id: "n5",
      title: "Self-Supervised Graph Representations",
      type: "paper",
      year: 2023,
      score: 0.86,
      summary:
        "Surveys self-supervised objectives for graphs and highlights contrastive variants.",
      tags: ["self-supervised", "survey"],
    },
    {
      id: "n12",
      title: "Masked Graph Modeling",
      type: "paper",
      year: 2022,
      score: 0.84,
      summary:
        "Adapts masked language modeling to graphs with attribute imputation.",
      tags: ["masked", "self-supervised"],
    },
    {
      id: "n13",
      title: "Predictive Coding for Graphs",
      type: "paper",
      year: 2023,
      score: 0.83,
      summary:
        "Predicts high-order motifs to regularize GNN encoders.",
      tags: ["predictive", "motif"],
    },
  ],
  edges: [
    { source: "n5", target: "n12", weight: 0.69, relation: "masked" },
    { source: "n5", target: "n13", weight: 0.64, relation: "predictive" },
    { source: "n12", target: "n13", weight: 0.61, relation: "objective" },
  ],
  related_queries: [
    {
      node_id: "n12",
      query: "masked graph modeling",
      label: "Masked objectives",
    },
    {
      node_id: "n13",
      query: "predictive coding for graphs",
      label: "Predictive coding",
    },
  ],
  recommendations: [
    {
      node_id: "n12",
      title: "Masked Graph Modeling",
      authors: ["Wei Zhang", "Olivia Chen"],
      venue: "NeurIPS",
      year: 2022,
    },
  ],
  node_details: {
    n5: {
      summary:
        "Survey covering predictive, generative, and contrastive paradigms for self-supervised graphs.",
      authors: ["Anita Desai", "Miguel Torres"],
      venue: "ArXiv 2023",
      year: 2023,
      tags: ["self-supervised", "survey"],
      links: {
        doi: "10.1234/rn.n5",
        pdf: "https://example.org/n5.pdf",
      },
    },
    n12: {
      summary:
        "Applies masked modeling by randomly hiding nodes and edges and reconstructing them.",
      authors: ["Wei Zhang", "Olivia Chen"],
      venue: "NeurIPS 2022",
      year: 2022,
      tags: ["masked", "self-supervised"],
      links: {
        doi: "10.1234/rn.n12",
        pdf: "https://example.org/n12.pdf",
      },
    },
    n13: {
      summary:
        "Enforces predictive coding on motif frequencies to improve generalization.",
      authors: ["Diego Cortez", "Amelia Hart"],
      venue: "ICLR 2023",
      year: 2023,
      tags: ["predictive", "motif"],
      links: {
        doi: "10.1234/rn.n13",
        pdf: "https://example.org/n13.pdf",
      },
    },
  },
};

export const GRAPH_DATA_BY_QUERY: Record<string, GraphPayload> = {
  "graph-based contrastive learning": graphBasedContrastiveLearning,
  "contrastive graph augmentation": contrastiveGraphAugmentation,
  "gnn-based recommendation benchmarks": gnnBenchmarks,
  "user behavior graph embeddings": userBehaviorEmbeddings,
  "self-supervised graph representations": selfSupervisedGraphReps,
};

export const NODE_TO_QUERY: Record<string, string> = Object.entries(
  GRAPH_DATA_BY_QUERY,
).reduce<Record<string, string>>((acc, [query, graph]) => {
  acc[graph.center_node] = query;
  graph.related_queries.forEach((link) => {
    acc[link.node_id] = link.query;
  });
  graph.nodes.forEach((node) => {
    if (!acc[node.id]) {
      acc[node.id] = query;
    }
  });
  return acc;
}, {});

export function getMockGraphByQuery(query: string): GraphPayload | undefined {
  return GRAPH_DATA_BY_QUERY[query.toLowerCase()];
}

export function getMockGraphByNode(nodeId: string): GraphPayload | undefined {
  const normalized = nodeId.toLowerCase();
  const mappedQuery = NODE_TO_QUERY[normalized];
  return mappedQuery ? getMockGraphByQuery(mappedQuery) : undefined;
}
