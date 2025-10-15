"use client";
import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';

// Lightweight force layout using d3-force-3d (works fine in 2D too)
import * as d3 from 'd3-force-3d';

type ApiGraph = {
	query: string;
	nodes: { id: string; label: string; score: number; keywords: string[]; summary: string }[];
	edges: { id: string; source: string; target: string; weight: number }[];
};

export default function GraphClient({ data }: { data: ApiGraph | null }) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [hoverSummary, setHoverSummary] = useState<string | null>(null);

	// Build reactflow nodes/edges when data changes
	useEffect(() => {
		if (!data || !data.nodes) {
			setNodes([]);
			setEdges([]);
			return;
		}
		const rfNodes = data.nodes.map((n, i) => ({
			id: n.id,
			position: { x: Math.random() * 800, y: Math.random() * 500 },
			data: { label: `${n.label}` },
			style: {
				border: '1px solid #93c5fd',
				borderRadius: 8,
				padding: 8,
				background: '#fff',
				fontSize: 12,
			},
		})) as any[];
		const rfEdges = data.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, animated: false, style: { stroke: '#2563eb', strokeWidth: Math.max(1, e.weight * 2) } })) as any[];
		setNodes(rfNodes);
		setEdges(rfEdges);
	}, [data, setNodes, setEdges]);

	// Apply force layout client-side
	useEffect(() => {
		if (nodes.length === 0) return;
		// Build a simulation with current nodes/edges
		const simNodes = nodes.map((n: any) => ({ id: n.id, x: n.position.x, y: n.position.y }));
		const idToIndex = new Map(simNodes.map((n, i) => [n.id, i]));
		const simLinks = edges.map((e: any) => ({ source: idToIndex.get(e.source), target: idToIndex.get(e.target), strength: 0.05 }));

		const sim = d3.forceSimulation(simNodes as any)
			.force('charge', d3.forceManyBody().strength(-120))
			.force('center', d3.forceCenter(400, 280))
			.force('link', d3.forceLink(simLinks as any).distance(140))
			.stop();

		for (let i = 0; i < 150; i++) sim.tick();

		// Update positions in reactflow
		const updated = nodes.map((n: any) => {
			const s = simNodes[idToIndex.get(n.id)!];
			return { ...n, position: { x: s.x ?? n.position.x, y: s.y ?? n.position.y } };
		});
		setNodes(updated as any);
		// No need to update edges; React Flow positions edges by node positions
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [edges.length, nodes.length]);

	// Hover summaries via mocked LLM (we have summary on node)
	const onNodeMouseEnter = (_: any, node: any) => {
		const n = data?.nodes.find((x) => x.id === node.id);
		if (n) setHoverSummary(`${n.label}: ${n.summary}`);
	};
	const onNodeMouseLeave = () => setHoverSummary(null);

	return (
		<div style={{ width: '100%', height: '100%', position: 'relative' }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeMouseEnter={onNodeMouseEnter}
				onNodeMouseLeave={onNodeMouseLeave}
				fitView
			>
				<Controls />
				<MiniMap />
				<Background variant="dots" gap={12} size={1} />
			</ReactFlow>
			{hoverSummary && (
				<div style={{ position: 'absolute', right: 12, bottom: 12, background: 'rgba(30,58,138,0.95)', color: '#fff', padding: '10px 12px', borderRadius: 8, maxWidth: 360, fontSize: 12 }}>
					{hoverSummary}
				</div>
			)}
		</div>
	);
}
