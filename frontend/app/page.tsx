"use client";

import { useCallback, useState } from "react";
import { LayoutShell } from "@/app/components/LayoutShell";
import { GraphView } from "@/app/components/GraphView";
import { VoiceSession } from "@/app/components/VoiceSession";
import { VoicePrompts } from "@/app/components/VoicePrompts";
import { fetchGraph, recenterGraph } from "@/app/lib/api";
import type { GraphPayload } from "@/app/types/graph";

export default function HomePage() {
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [status, setStatus] = useState<string>("Say your topic to explore the graph.");

  const handleInitialQuery = useCallback(async (query: string) => {
    setStatus(`Searching for ${query} ...`);
    try {
      const result = await fetchGraph(query);
      setPayload(result);
      setStatus(`Graph centered on ${result.query}.`);
    } catch (error: any) {
      setStatus(`Could not fetch graph: ${error.message}`);
    }
  }, []);

  const handleRecenter = useCallback(async (label: string) => {
    setStatus(`Recentering on ${label} ...`);
    try {
      const result = await recenterGraph(label);
      setPayload(result);
      setStatus(`Graph centered on ${result.query}.`);
    } catch (error: any) {
      setStatus(`Could not recenter: ${error.message}`);
    }
  }, []);

  return (
    <>
      <VoiceSession onInitialQuery={handleInitialQuery} onRecenter={handleRecenter} />
      <VoicePrompts payload={payload} />
      <LayoutShell
        header={
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              aria-hidden
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #8A4FFF, #B18CFF)",
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>Research Navigator</div>
              <div style={{ fontSize: "12px", color: "#B0B0B5" }}>Voice-first explorations</div>
            </div>
          </div>
        }
        sidebar={
          <div>
            <section aria-live="polite">
              <p style={{ color: "#FFFFFF", fontWeight: 600 }}>Status</p>
              <p>{status}</p>
            </section>
            <section style={{ marginTop: "24px" }}>
              <p style={{ color: "#FFFFFF", fontWeight: 600 }}>Voice commands</p>
              <p>Say your topic to start. Use phrases like “focus on cold-start personalization”.</p>
            </section>
          </div>
        }
        main={
          <>
            <GraphView nodes={payload?.nodes ?? []} edges={payload?.edges ?? []} />
          </>
        }
        aside={
          <div>
            <section>
              <h2 style={{ color: "#FFFFFF", fontSize: "16px" }}>Central node</h2>
              <p>{payload?.nodes.find((node) => node.is_central)?.label ?? "Awaiting selection"}</p>
            </section>
            <section style={{ marginTop: "24px" }}>
              <h3 style={{ color: "#FFFFFF", fontSize: "14px" }}>Recommendations</h3>
              <ul>
                {(payload?.recommendations?.length ?? 0) > 0 ? (
                  payload?.recommendations?.map((item) => (
                    <li key={item} style={{ marginBottom: "8px" }}>
                      {item}
                    </li>
                  ))
                ) : (
                  <li>Say your topic to receive journey suggestions.</li>
                )}
              </ul>
            </section>
          </div>
        }
      />
    </>
  );
}

