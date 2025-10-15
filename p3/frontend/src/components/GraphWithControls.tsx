'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import GraphClient from '@/components/GraphClient';

export default function GraphWithControls({ initialQuery }: { initialQuery: string }) {
	const [threshold, setThreshold] = useState(0.6);
	const [data, setData] = useState<any | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function fetchGraph() {
		setLoading(true);
		setError(null);
		try {
			const res = await axios.post('http://localhost:8001/api/search', { query: initialQuery || 'default graph', threshold });
			setData(res.data);
		} catch (e) {
			setError('Failed to load graph');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchGraph();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [threshold, initialQuery]);

	return (
		<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
			<div style={{ padding: 10, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
				<label style={{ fontSize: 12, color: '#475569' }}>Edge threshold: {threshold.toFixed(2)}</label>
				<input type="range" min={0} max={1} step={0.01} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
				{loading && <span style={{ fontSize: 12, color: '#64748b' }}>Updating…</span>}
				{error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
			</div>
			<div style={{ flex: 1 }}>
				<GraphClient data={data} />
			</div>
		</div>
	);
}
