"use client";

import { useEffect, useRef } from "react";
import { voicePhrases } from "../../data";

type VoiceSessionProps = {
  onInitialQuery: (query: string) => void;
  onRecenter: (label: string) => void;
};

type VoiceIntent =
  | { type: "query"; value: string }
  | { type: "recenter"; value: string }
  | { type: "none" };

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
    : undefined;

const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;

function speak(text: string) {
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 0.95;
  synth.cancel();
  synth.speak(utterance);
}

function parseIntent(transcript: string): VoiceIntent {
  const lowered = transcript.trim().toLowerCase();
  if (!lowered) return { type: "none" };
  if (lowered.startsWith("focus on")) {
    return { type: "recenter", value: lowered.replace("focus on", "").trim() };
  }
  if (lowered.startsWith("center on")) {
    return { type: "recenter", value: lowered.replace("center on", "").trim() };
  }
  return { type: "query", value: lowered };
}

export function VoiceSession({ onInitialQuery, onRecenter }: VoiceSessionProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    speak(voicePhrases.welcome);

    if (!SpeechRecognition) return;
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => speak(voicePhrases.listening);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const intent = parseIntent(transcript);
      if (intent.type === "query") {
        onInitialQuery(intent.value);
      } else if (intent.type === "recenter") {
        speak(voicePhrases.recentering(intent.value));
        onRecenter(intent.value);
      }
    };

    recognition.onerror = () => {
      // Retry after error to maintain voice-first loop
      recognition.stop();
      setTimeout(() => recognition.start(), 1500);
    };

    recognition.onend = () => {
      setTimeout(() => {
        try {
          recognition.start();
        } catch (err) {
          console.error("Speech recognition restart failed", err);
        }
      }, 750);
    };

    recognitionRef.current = recognition;
    recognition.start();

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [onInitialQuery, onRecenter]);

  return null;
}

