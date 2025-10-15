import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-textSecondary">
      <div className="rounded-3xl border border-borderColor bg-panel px-10 py-12 shadow-xl">
        <h1 className="text-3xl font-semibold text-textPrimary">Research Navigator</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-textSecondary">
          Discover, explore, and map research connections visually. Jump into the knowledge graph to
          follow emerging insights and recenter on the nodes that matter to you.
        </p>
        <Link
          href="/graph"
          className="mt-6 inline-flex items-center rounded-lg bg-accentPurple px-6 py-3 text-sm font-medium text-white transition hover:bg-accentPurple/80"
        >
          Open Graph Explorer
        </Link>
      </div>
    </main>
  );
}
