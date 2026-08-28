import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { CommandLine } from "@/components/isabella/CommandLine";
import { MessageStream } from "@/components/isabella/MessageStream";
import { TelemetryPanel } from "@/components/isabella/TelemetryPanel";
import { MemoryPanel } from "@/components/isabella/MemoryPanel";
import { SkillsPanel } from "@/components/isabella/SkillsPanel";
import { PipelineIndicator } from "@/components/isabella/PipelineIndicator";
import { useIsabellaAgent } from "@/lib/useIsabellaAgent";
import { LOCALES } from "@/i18n";

const CinematicIntro = lazy(() =>
  import("@/components/intro/CinematicIntro").then((m) => ({ default: m.CinematicIntro }))
);

type IntroPhase = "VOID" | "STELLAR_FIELD" | "COMET_PASSAGE" | "COGNITIVE_CORE" | "LOGO_REVEAL" | "HEARTBEAT" | "HUMMINGBIRD_ENTRY" | "HUMMINGBIRD_ASCENT" | "INTERFACE_REVEAL" | "ONLINE";

const TITLE = "Isabella Villaseñor AI — Terminal Cognitivo C.R.O.W.N.";
const DESC =
  "Terminal cognitivo de Isabella Villaseñor AI: orquestación C.R.O.W.N. con ISA, SOPHIA, ORION y ARGUS, Policy Gate en vivo, memoria jerárquica, skills y telemetría desde Nodo Cero, Real del Monte, Hidalgo.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const isabella = useIsabellaAgent();
  const [panel, setPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"telemetry" | "memory" | "skills">("telemetry");
  const [introComplete, setIntroComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<IntroPhase>("VOID");
  const lastInput = useRef("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const handlePhaseChange = useCallback((phase: IntroPhase) => {
    setCurrentPhase(phase);
  }, []);

  const send = (text: string) => {
    lastInput.current = text;
    void isabella.send(text);
  };

  const turns = isabella.messages.filter((m) => m.role === "user").length;

  if (!introComplete) {
    return (
      <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#02040A]" />}>
        <CinematicIntro
          onComplete={handleIntroComplete}
          onPhaseChange={handlePhaseChange}
          skipOnReducedMotion
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen animate-intro-fade-in">
      <header className="hairline sticky top-0 z-20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <h1 className="text-iridescent font-display text-[26px] leading-none tracking-tight sm:text-[32px]">
              Isabella Villaseñor
            </h1>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.32em] text-muted-foreground">
              Nodo Cero · Real del Monte, Hidalgo · C.R.O.W.N.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-muted-foreground sm:inline">
              {isabella.preset.name.toUpperCase()}
            </span>

            {/* Language Switcher */}
            <div className="hidden items-center gap-1 sm:flex">
              {LOCALES.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => isabella.changeLocale(loc.id)}
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                    isabella.locale === loc.id
                      ? "bg-primary/20 text-platinum"
                      : "text-muted-foreground hover:text-platinum"
                  }`}
                >
                  {loc.flag}
                </button>
              ))}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void isabella.openConversation(file).catch(() => {});
              }}
            />
            <button
              onClick={isabella.downloadConversation}
              className="hidden rounded-lg border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-platinum sm:inline-block"
            >
              Descargar
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="hidden rounded-lg border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-platinum sm:inline-block"
            >
              Reabrir
            </button>
            <span
              className={`size-2 rounded-full bg-electric ${isabella.isProcessing ? "animate-breathe" : ""}`}
            />
            <button
              onClick={() => setPanel((p) => !p)}
              className="rounded-lg border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground lg:hidden"
            >
              {panel ? "Cerrar" : "Panel"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="flex min-w-0 flex-col gap-5">
          <div className="glass min-h-[52vh] flex-1 overflow-y-auto rounded-3xl">
            <MessageStream
              messages={isabella.messages}
              onRetry={() => lastInput.current && send(lastInput.current)}
            />
          </div>
          <CommandLine
            onSend={send}
            onStop={isabella.stop}
            onReset={isabella.reset}
            isProcessing={isabella.isProcessing}
          />
        </section>

        <div className={panel ? "block" : "hidden lg:block"}>
          {/* Pipeline Indicator */}
          <div className="mb-4">
            <PipelineIndicator />
          </div>

          {/* Tab Navigation */}
          <div className="mb-3 flex gap-1 rounded-xl border border-border/50 p-1">
            {(["telemetry", "memory", "skills"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                  activeTab === tab
                    ? "bg-primary/20 text-platinum"
                    : "text-muted-foreground hover:text-platinum"
                }`}
              >
                {tab === "telemetry" ? "Telemetría" : tab === "memory" ? "Memoria" : "Skills"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "telemetry" && (
            <TelemetryPanel
              presetId={isabella.presetId}
              setPresetId={isabella.setPresetId}
              decision={isabella.decision}
              tokens={isabella.tokens}
              turns={turns}
              isProcessing={isabella.isProcessing}
            />
          )}
          {activeTab === "memory" && <MemoryPanel />}
          {activeTab === "skills" && <SkillsPanel />}
        </div>
      </main>
    </div>
  );
}
