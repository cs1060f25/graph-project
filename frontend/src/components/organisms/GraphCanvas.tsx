"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { GraphEdge, GraphNode } from "@/data/mockGraph";
import { colors } from "@/lib/theme";
import type { PositionedNode } from "@/utils/graph";
import { initializePositions } from "@/utils/graph";

type GraphCanvasProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string) => void;
};

const canvasStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative",
  backgroundColor: colors.graphBackground,
  overflow: "hidden",
};

const nodeStyle = (active: boolean): React.CSSProperties => ({
  position: "absolute",
  width: active ? 24 : 16,
  height: active ? 24 : 16,
  borderRadius: "50%",
  backgroundColor: active ? colors.accentPurple : colors.accentPurpleLight,
  color: colors.textPrimary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  cursor: "pointer",
  transform: "translate(-50%, -50%)",
  boxShadow: active ? `0 0 12px rgba(138, 79, 255, 0.6)` : "none",
  transition: "transform 0.2s ease, background-color 0.2s ease",
});

const edgeStyle: React.CSSProperties = {
  position: "absolute",
  pointerEvents: "none",
  transformOrigin: "0 0",
  height: 1,
  backgroundColor: "rgba(255, 255, 255, 0.2)",
};

const labelStyle: React.CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  color: colors.textSecondary,
  fontSize: "12px",
  marginTop: 20,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const positionedNodes = useMemo<PositionedNode[]>(() => {
    return initializePositions(nodes, dimensions.width, dimensions.height);
  }, [nodes, dimensions.height, dimensions.width]);

  useEffect(() => {
    const centerOffset = {
      x: dimensions.width / 2,
      y: dimensions.height / 2,
    };
    setTransform({ x: centerOffset.x, y: centerOffset.y, scale: 1 });
  }, [dimensions.width, dimensions.height, nodes]);

  const isPanning = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    isPanning.current = true;
    lastPosition.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isPanning.current) return;

      const dx = event.clientX - lastPosition.current.x;
      const dy = event.clientY - lastPosition.current.y;
      lastPosition.current = { x: event.clientX, y: event.clientY };

      setTransform((current) => ({
        ...current,
        x: current.x + dx,
        y: current.y + dy,
      }));
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const scaleChange = event.deltaY < 0 ? 0.1 : -0.1;
    setTransform((current) => {
      const nextScale = Math.min(Math.max(0.6, current.scale + scaleChange), 2.2);
      return {
        ...current,
        scale: nextScale,
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      style={canvasStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerUp}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "center center",
        }}
      >
      {edges.map((edge) => {
        const source = positionedNodes.find((n) => n.id === edge.source);
        const target = positionedNodes.find((n) => n.id === edge.target);

        if (!source || !target) {
          return null;
        }

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        return (
          <div
            key={`${edge.source}-${edge.target}`}
            style={{
              ...edgeStyle,
              width: length,
              left: source.x,
              top: source.y,
              transform: `rotate(${angle}deg)`,
            }}
          />
        );
      })}
      {positionedNodes.map((node) => {
        const active = node.id === selectedNodeId;
        return (
          <div
            key={node.id}
            style={{
              ...nodeStyle(active),
              left: node.x,
              top: node.y,
            }}
            onClick={() => onNodeSelect(node.id)}
          >
            {node.id.toUpperCase()}
          </div>
        );
      })}
      {positionedNodes.map((node) => (
        <div
          key={`${node.id}-label`}
          style={{
            ...labelStyle,
            left: node.x,
            top: node.y,
          }}
        >
          {node.title}
        </div>
      ))}
      </div>
    </div>
  );
}
