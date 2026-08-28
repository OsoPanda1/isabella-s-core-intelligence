/**
 * Hook principal del agente Isabella Villaseñor AI.
 *
 * Integra el pipeline C.R.O.W.N., memoria, skills y la interfaz de usuario
 * en un flujo unificado con streaming de respuestas.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRESETS,
  buildSystemPrompt,
  route,
  type Preset,
  type PresetId,
  type RoutingDecision,
} from "../crown-ui";
import { memory, type MemoryRecord } from "./agent/memory";
import { skillRegistry, type SkillWithStatus } from "./agent/skills";
import { pipeline, type PipelineStage } from "./agent/pipeline";
import { t, getLocale, setLocale, type Locale } from "../i18n";

export interface TerminalMessage {
  id: string;
  role: "user" | "isabella" | "system";
  content: string;
  timestamp: string;
  decision?: RoutingDecision;
  streaming?: boolean;
  error?: boolean;
  pipelineStage?: PipelineStage;
  memoryUsed?: number;
  skillsAvailable?: number;
}

const now = () =>
  new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const uid = () => Math.random().toString(36).slice(2, 11);

const STORAGE_KEY = "isabella.session.v2";

function getBootMessage(): TerminalMessage {
  return {
    id: "boot",
    role: "system",
    content: t("conversation.boot"),
    timestamp: now(),
  };
}

function loadSession(): TerminalMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { messages?: TerminalMessage[] };
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) return null;
    return parsed.messages.map((m) => ({ ...m, streaming: false }));
  } catch {
    return null;
  }
}

export function useIsabellaAgent() {
  const [messages, setMessages] = useState<TerminalMessage[]>([getBootMessage()]);
  const [hydrated, setHydrated] = useState(false);
  const [presetId, setPresetId] = useState<PresetId>("prime");
  const [isProcessing, setIsProcessing] = useState(false);
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [tokens, setTokens] = useState(0);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [locale, setLocaleState] = useState<Locale>(getLocale());
  const [memoryRecords, setMemoryRecords] = useState<MemoryRecord[]>(memory.getAll());
  const [activeSkills, setActiveSkills] = useState<SkillWithStatus[]>(skillRegistry.getActive());
  const abortRef = useRef<AbortController | null>(null);

  const preset: Preset = PRESETS.find((p) => p.id === presetId) ?? (PRESETS[0] as Preset);

  // Rehidratación del historial de la sesión activa.
  useEffect(() => {
    const restored = loadSession();
    if (restored) setMessages(restored);
    setHydrated(true);
  }, []);

  // Persistencia por sesión.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: new Date().toISOString(), presetId, messages }),
      );
    } catch {
      /* cuota agotada */
    }
  }, [messages, presetId, hydrated]);

  // Suscribirse a cambios de memoria y skills.
  useEffect(() => {
    const unsubMemory = memory.subscribe(() => {
      setMemoryRecords(memory.getAll());
    });
    const unsubSkills = skillRegistry.subscribe(() => {
      setActiveSkills(skillRegistry.getActive());
    });
    const unsubPipeline = pipeline.subscribe(setPipelineStage);
    return () => {
      unsubMemory();
      unsubSkills();
      unsubPipeline();
    };
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || isProcessing) return;

      // Ejecutar pipeline C.R.O.W.N.
      const pipelineResult = await pipeline.execute(text, { locale });

      // Guardar en memoria activa
      memory.add({
        scope: "session",
        content: text.slice(0, 500),
        source: "user",
        purpose: "Conversación del usuario",
        tags: [pipelineResult.routing.intent.category],
        confidence: pipelineResult.routing.intent.confidence,
      });

      const routing = route(text, preset);
      setDecision(routing);

      const userMsg: TerminalMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: now(),
      };
      const replyId = uid();

      const history = [...messages, userMsg]
        .filter((m) => m.role !== "system" && !m.error)
        .slice(-16)
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: replyId,
          role: "isabella",
          content: "",
          timestamp: now(),
          decision: routing,
          streaming: true,
          pipelineStage: "perceive",
          memoryUsed: pipelineResult.memoryRecords.length,
          skillsAvailable: pipelineResult.availableSkills.length,
        },
      ]);
      setIsProcessing(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/isabella", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system: buildSystemPrompt(routing, preset),
            temperature: preset.temperature,
            messages: history,
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.json().catch(() => ({ error: "Fallo de percepción." }));
          throw new Error(detail.error ?? "Fallo de percepción.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json.choices?.[0]?.delta?.content;
              if (delta) {
                acc += delta;
                setTokens((t) => t + 1);
                setMessages((prev) =>
                  prev.map((m) => (m.id === replyId ? { ...m, content: acc } : m)),
                );
              }
            } catch {
              /* fragmento parcial */
            }
          }
        }

        // Guardar respuesta en memoria
        if (acc.trim()) {
          memory.add({
            scope: "session",
            content: acc.slice(0, 500),
            source: "system",
            purpose: "Respuesta de Isabella",
            tags: [routing.intent.category, routing.primary],
            confidence: routing.epistemicCertainty,
          });
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? {
                  ...m,
                  streaming: false,
                  pipelineStage: "complete" as PipelineStage,
                  content:
                    acc || "Silencio cognitivo: el núcleo no emitió síntesis para esta percepción.",
                }
              : m,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Interrupción del núcleo.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? {
                  ...m,
                  streaming: false,
                  error: true,
                  pipelineStage: "error" as PipelineStage,
                  content: `ARGUS :: ${message}`,
                }
              : m,
          ),
        );
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
        pipeline.reset();
      }
    },
    [isProcessing, messages, preset, locale],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    memory.clearScope("immediate");
    memory.clearScope("session");
    setMessages([
      {
        id: uid(),
        role: "system",
        content: t("conversation.newSession"),
        timestamp: now(),
      },
    ]);
    setDecision(null);
    setTokens(0);
    pipeline.reset();
  }, []);

  const downloadConversation = useCallback(() => {
    const payload = {
      artifact: "isabella.conversation",
      version: 2,
      exportedAt: new Date().toISOString(),
      node: "Nodo Cero · Real del Monte, Hidalgo",
      presetId,
      locale,
      messages,
      memoryStats: memory.getStats(),
      skillStats: skillRegistry.getStats(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `isabella-conversacion-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, presetId, locale]);

  const openConversation = useCallback(async (file: File) => {
    const raw = await file.text();
    const parsed = JSON.parse(raw) as { messages?: TerminalMessage[]; presetId?: PresetId };
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      throw new Error("Archivo de conversación inválido.");
    }
    abortRef.current?.abort();
    if (parsed.presetId && PRESETS.some((p) => p.id === parsed.presetId)) {
      setPresetId(parsed.presetId);
    }
    setMessages([
      ...parsed.messages.map((m) => ({ ...m, streaming: false })),
      {
        id: uid(),
        role: "system" as const,
        content: `Conversación reabierta desde archivo · ${parsed.messages.length} fragmentos restaurados · trazabilidad preservada.`,
        timestamp: now(),
      },
    ]);
    setDecision(null);
  }, []);

  return {
    messages,
    send,
    stop,
    reset,
    isProcessing,
    preset,
    presetId,
    setPresetId,
    decision,
    tokens,
    pipelineStage,
    locale,
    changeLocale,
    memoryRecords,
    activeSkills,
    downloadConversation,
    openConversation,
    memoryStats: memory.getStats(),
    skillStats: skillRegistry.getStats(),
  };
}
