export const metadata = {
  title: 'Research Graph Explorer - Power User',
  description: 'Multi-layer research graph exploration for power users',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>{children}</body>
    </html>
  );
}