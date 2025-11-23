import type { Metadata } from 'next';
import ClientProviders from '../components/ClientProviders';
import Navbar from '../components/Navbar';
import '../styles/index.css';

export const metadata: Metadata = {
  title: 'Graphene - Research Paper Discovery',
  description: 'Discover and explore academic papers using graph-based visualization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <Navbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}


