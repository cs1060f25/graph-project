import { Header } from "@/components/graph/Header";
import { Sidebar } from "@/components/graph/Sidebar";
import { GraphContainer } from "@/components/graph/GraphContainer";
import { theme } from "@/app/theme";

export default function GraphPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: theme.colors.background }}>
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden" style={{ backgroundColor: theme.colors.graphBackground }}>
          <GraphContainer />
        </main>
      </div>
    </div>
  );
}
