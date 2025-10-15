import GraphClientWithControls from '@/components/GraphWithControls';

export default function GraphPage({ searchParams }: { searchParams?: { query?: string } }) {
	const query = (searchParams?.query ?? '').toString();
	return (
		<main style={{ padding: '1rem' }}>
			<h2 style={{ margin: 0, fontSize: 20 }}>Graph View</h2>
			<p style={{ color: '#64748b', marginTop: 6 }}>Query: {query || '—'}</p>
			<div style={{ marginTop: 12, height: '80vh', border: '1px solid #e2e8f0', borderRadius: 8 }}>
				<GraphClientWithControls initialQuery={query} />
			</div>
		</main>
	);
}
