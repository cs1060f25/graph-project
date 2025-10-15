"use client";

import { useEffect } from "react";
import type { GraphPayload } from "@/app/types/graph";

type VoicePromptsProps = {
  payload?: GraphPayload | null;
};

export function VoicePrompts({ payload }: VoicePromptsProps) {
  useEffect(() => {
    if (!payload) return;
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    const intro = new SpeechSynthesisUtterance(payload.prompt.intro);
    intro.rate = 1.05;
    intro.pitch = 0.95;

    const summaries = payload.nodes.map((node) => {
      const summaryUtterance = new SpeechSynthesisUtterance(node.voice_summary);
      summaryUtterance.rate = 1.0;
      summaryUtterance.pitch = 1.0;
      return summaryUtterance;
    });

    const recap = new SpeechSynthesisUtterance(payload.prompt.recap);
    recap.rate = 1.0;
    recap.pitch = 0.9;

    synth.cancel();
    synth.speak(intro);
    summaries.forEach((utterance) => synth.speak(utterance));
    synth.speak(recap);
  }, [payload]);

  return null;
}

