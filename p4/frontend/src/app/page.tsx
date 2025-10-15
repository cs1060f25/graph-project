import MultiFieldSearch from '@/components/MultiFieldSearch';

export default function HomePage() {
  return (
    <main style={{ background: 'radial-gradient(1200px 600px at 50% -10%, #0ea5e9 0%, transparent 60%), #0b1220', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.2, color: '#e5e7eb', letterSpacing: -0.5 }}>Research Graph Explorer</h1>
          <p style={{ color: '#a5b4fc', marginTop: 10, fontSize: 16 }}>Multi-field search with three-layer graph analysis for power users.</p>
        </div>
        <MultiFieldSearch />
      </div>
    </main>
  );
}