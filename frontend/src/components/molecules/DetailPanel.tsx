import Pill from "@/components/atoms/Pill";
import type { GraphPayload } from "@/data/mockGraph";
import { colors, typography } from "@/lib/theme";

const panelStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  backgroundColor: colors.panelBackground,
  borderLeft: `1px solid ${colors.border}`,
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  overflowY: "auto",
};

type DetailPanelProps = {
  graph: GraphPayload | null;
  selectedNodeId: string | null;
};

export default function DetailPanel({ graph, selectedNodeId }: DetailPanelProps) {
  if (!graph || !selectedNodeId) {
    return (
      <aside style={panelStyle}>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontFamily: typography.fontFamily,
          }}
        >
          Select a node to view details.
        </p>
      </aside>
    );
  }

  const detail = graph.node_details[selectedNodeId];

  if (!detail) {
    return (
      <aside style={panelStyle}>
        <p
          style={{
            margin: 0,
            color: colors.textSecondary,
            fontFamily: typography.fontFamily,
          }}
        >
          Details unavailable for this node.
        </p>
      </aside>
    );
  }

  return (
    <aside style={panelStyle}>
      <header style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: typography.fontFamily,
            fontSize: "18px",
            fontWeight: typography.fontWeightBold,
            color: colors.textPrimary,
          }}
        >
          {graph.nodes.find((node) => node.id === selectedNodeId)?.title ?? "Selected Paper"}
        </h1>
        <span
          style={{
            color: colors.textSecondary,
            fontFamily: typography.fontFamily,
            fontSize: "14px",
          }}
        >
          {detail.authors.join(", ")} · {detail.venue} · {detail.year}
        </span>
      </header>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {detail.tags.map((tag) => (
          <Pill key={tag}>{tag}</Pill>
        ))}
      </div>
      <p
        style={{
          margin: 0,
          color: colors.textSecondary,
          fontFamily: typography.fontFamily,
          lineHeight: 1.6,
        }}
      >
        {detail.summary}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {Object.entries(detail.links).map(([label, href]) => (
          <a
            key={label}
            href={href}
            style={{
              color: colors.accentPurple,
              fontFamily: typography.fontFamily,
              fontSize: "14px",
              textDecoration: "none",
            }}
            target="_blank"
            rel="noreferrer"
          >
            {label.toUpperCase()}
          </a>
        ))}
      </div>
    </aside>
  );
}
