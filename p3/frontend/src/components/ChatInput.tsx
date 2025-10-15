'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChatInput() {
	const router = useRouter();
	const [query, setQuery] = useState('papers connecting neuroscience and reinforcement learning');
	const [loading, setLoading] = useState(false);

	async function onSubmit(e?: React.FormEvent) {
		e?.preventDefault();
		setLoading(true);
		router.push(`/graph?query=${encodeURIComponent(query)}`);
	}

	return (
		<div style={{ margin: '0 auto' }}>
			<form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
				<textarea
					rows={1}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="What do you want to explore?"
					style={{ flex: '0 1 640px', height: 56, minHeight: 56, maxHeight: 56, width: '100%', maxWidth: 640, resize: 'none', padding: '0 16px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.25)', background: 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.9))', color: '#e5e7eb', fontSize: 15, lineHeight: '56px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', overflow: 'hidden' }}
				/>
				<button type="submit" disabled={loading || !query.trim()} style={{ padding: '12px 18px', borderRadius: 9999, border: '1px solid rgba(59,130,246,0.5)', background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)', color: '#fff', cursor: 'pointer', fontWeight: 600, letterSpacing: 0.2, boxShadow: '0 8px 24px rgba(29,78,216,0.45)' }}>
					{loading ? 'Generating…' : 'Generate Graph'}
				</button>
				<div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>Example: “papers connecting neuroscience and reinforcement learning”</div>
			</form>
		</div>
	);
}
