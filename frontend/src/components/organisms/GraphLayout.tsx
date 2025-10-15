"use client";

import Button from "@/components/atoms/Button";
import Pill from "@/components/atoms/Pill";
import DetailPanel from "@/components/molecules/DetailPanel";
import SidebarSection from "@/components/molecules/SidebarSection";
import GraphCanvas from "@/components/organisms/GraphCanvas";
import { useGraphData } from "@/hooks/useGraphData";
import { colors, layout, typography } from "@/lib/theme";
import { useState } from "react";

type GraphLayoutProps = {
  initialQuery?: string;
};

const containerStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateRows: `${layout.headerHeight} calc(100vh - ${layout.headerHeight})`,
  minHeight: "100vh",
  backgroundColor: colors.background,
  color: colors.textPrimary,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
  borderBottom: `1px solid ${colors.border}`,
  backgroundColor: colors.sidebarBackground,
};

const headerTitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontFamily: typography.fontFamily,
  fontSize: "16px",
  fontWeight: typography.fontWeightBold,
};

const bodyStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: `${layout.sidebarWidth} 1fr ${layout.rightPaneWidth}`,
  height: "100%",
};

const sidebarStyle: React.CSSProperties = {
  backgroundColor: colors.sidebarBackground,
  borderRight: `1px solid ${colors.border}`,
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const actionsStyle: React.CSSProperties = {
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

export default function GraphLayout({ initialQuery = "graph-based contrastive learning" }: GraphLayoutProps) {
  const {
    data,
    error,
    loading,
    selectedNode,
    setSelectedNode,
    loadByNode,
    loadByQuery,
  } = useGraphData(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={headerTitleStyle}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: colors.accentPurple,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: typography.fontWeightBold,
            }}
          >
            RN
          </div>
          <span>Research Navigator</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (searchQuery.trim()) {
                  void loadByQuery(searchQuery.trim());
                }
              }
            }}
            placeholder="Search papers, authors, or topics..."
            style={{
              width: "320px",
              backgroundColor: colors.panelBackground,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              padding: "8px 12px",
              color: colors.textPrimary,
              fontFamily: typography.fontFamily,
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (searchQuery.trim()) {
                void loadByQuery(searchQuery.trim());
              }
            }}
          >
            Search
          </Button>
        </div>
      </header>
      <div style={bodyStyle}>
        <aside style={sidebarStyle}>
          <SidebarSection title="Library">
            <Button
              variant="ghost"
              style={{ justifyContent: "flex-start" }}
              onClick={() => void loadByNode(initialQuery)}
            >
              All Papers
            </Button>
            <Button variant="ghost" style={{ justifyContent: "flex-start" }}>
              Saved
            </Button>
            <Button variant="ghost" style={{ justifyContent: "flex-start" }}>
              Recently Viewed
            </Button>
          </SidebarSection>
          <SidebarSection title="Filters">
            <Pill>2024+</Pill>
            <Pill>Contrastive</Pill>
            <Pill>Recommender</Pill>
          </SidebarSection>
          <div style={actionsStyle}>
            <Button variant="secondary">Export Graph</Button>
            <Button variant="secondary">Share</Button>
          </div>
        </aside>
        <main
          style={{
            position: "relative",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          {loading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: colors.textSecondary,
                fontFamily: typography.fontFamily,
              }}
            >
              Loading graph...
            </div>
          )}
          {error && !loading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#ff6b6b",
                fontFamily: typography.fontFamily,
              }}
            >
              {error}
            </div>
          )}
          {data && (
            <GraphCanvas
              nodes={data.nodes}
              edges={data.edges}
              selectedNodeId={selectedNode}
              onNodeSelect={(nodeId) => {
                setSelectedNode(nodeId);
                void loadByNode(nodeId);
              }}
            />
          )}
        </main>
        <DetailPanel graph={data} selectedNodeId={selectedNode} />
      </div>
    </div>
  );
}
