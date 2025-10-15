import ThreeLayerGraph from '@/components/ThreeLayerGraph';

export default async function GraphPage({ searchParams }: { searchParams?: Promise<{ query?: string }> }) {
  const params = await searchParams;
  const query = params?.query ? JSON.parse(decodeURIComponent(params.query)) : { keywords: [], authors: [], papers: [] };
  
  return (
    <main style={{ padding: '1rem', background: '#0b1220', minHeight: '100vh' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#e5e7eb' }}>Multi-Layer Graph Analysis</h2>
        <div style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
          Keywords: {query.keywords?.join(', ') || 'None'} | 
          Authors: {query.authors?.join(', ') || 'None'} | 
          Papers: {query.papers?.length || 0}
        </div>
      </div>
      <div style={{ height: '85vh', border: '1px solid #374151', borderRadius: 8, background: '#1f2937' }}>
        <ThreeLayerGraph initialQuery={query} />
      </div>
    </main>
  );
}
