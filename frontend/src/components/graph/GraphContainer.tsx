"use client";

import { ApolloProvider, useQuery } from "@apollo/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apolloClient } from "@/lib/apollo-client";
import { GRAPH_QUERY } from "@/lib/queries";
import type { GraphData, Paper } from "./types";
import { GraphCanvas } from "./GraphCanvas";
import { DetailsPanel } from "./DetailsPanel";

const DEFAULT_QUERY = "graph-contrastive-learning";

type GraphInnerProps = {
  initialQuery?: string;
};

const GraphInner = ({ initialQuery = DEFAULT_QUERY }: GraphInnerProps) => {
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [selectedPaper, setSelectedPaper] = useState<Paper | undefined>();

  const { data, loading, error, refetch } = useQuery<{ graph: GraphData }>(GRAPH_QUERY, {
    variables: { query: currentQuery },
    onCompleted: (response) => {
      const center = response.graph.center;
      setSelectedPaper(center);
    },
  });

  useEffect(() => {
    refetch({ query: currentQuery }).catch(() => null);
  }, [currentQuery, refetch]);

  const handleNodeClick = useCallback(
    (paperId: string) => {
      if (paperId === currentQuery) {
        const center = data?.graph.center;
        if (center) {
          setSelectedPaper(center);
        }
        return;
      }

      const nextPaper = data?.graph.neighbors.find((neighbor) => neighbor.id === paperId);
      if (nextPaper) {
        setSelectedPaper(nextPaper);
      }

      setCurrentQuery(paperId);
    },
    [currentQuery, data?.graph.center, data?.graph.neighbors]
  );

  const graphData = useMemo<GraphData | undefined>(() => data?.graph, [data]);

  return (
    <div className="flex h-full w-full">
      <div className="flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-white">Loading graph...</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            Failed to load graph.
          </div>
        ) : (
          <GraphCanvas data={graphData} onNodeClick={handleNodeClick} />
        )}
      </div>
      <DetailsPanel paper={selectedPaper} />
    </div>
  );
};

export const GraphContainer = () => (
  <ApolloProvider client={apolloClient}>
    <GraphInner />
  </ApolloProvider>
);
