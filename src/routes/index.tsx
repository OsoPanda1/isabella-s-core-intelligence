import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { CommandLine } from "@/components/isabella/CommandLine";
import { MessageStream } from "@/components/isabella/MessageStream";
import { TelemetryPanel } from "@/components/isabella/TelemetryPanel";
import { MemoryPanel } from "@/components/isabella/MemoryPanel";
import { SkillsPanel } from "@/components/isabella/SkillsPanel";
import { PipelineIndicator } from "@/components/isabella/PipelineIndicator";
import { Sidebar } from "@/components/isabella/Sidebar";
import { useIsabellaAgent } from "@/lib/useIsabellaAgent";
import { LOCALES } from "@/i18n";

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

type SidebarSection =
  | "chat"
  | "images"
  | "memory"
  | "skills"
  | "monetization"
  | "projects"
  | "settings"
  | "premium"
  | "voice"
  | "pipeline"
  | "telemetry";

function Index() {
  const isabella = useIsabellaAgent();
  const [panel, setPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<SidebarSection>("chat");
  const lastInput = useRef("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const send = (text: string) => {
    lastInput.current = text;
    void isabella.send(text);
  };

  const turns = isabella.messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((p) => !p)}
        activeSection={activeSection}
        onSectionChange={(s) => setActiveSection(s)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hairline sticky top-0 z-20 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((p) => !p)}
                className="rounded-lg border border-border px-2 py-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-platinum lg:inline-flex"
              >
                {sidebarOpen ? "◀" : "▶"}
              </button>
              <div>
                <h1 className="text-iridescent font-display text-[26px] leading-none tracking-tight sm:text-[32px]">
                  Isabella Villaseñor
                </h1>
                <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.32em] text-muted-foreground">
                  Nodo Cero · Real del Monte, Hidalgo · C.R.O.W.N.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[10px] tracking-[0.2em] text-muted-foreground sm:inline">
                {isabella.preset.name.toUpperCase()}
              </span>

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

        <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {activeSection === "chat" && (
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
          )}

          {activeSection === "images" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-8">
              <h2 className="text-iridescent font-display text-2xl mb-4">Crear Imágenes</h2>
              <p className="text-muted-foreground text-sm">Genera imágenes con IA desde Isabella.</p>
              <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground/60 font-mono text-xs">Próximamente: generación de imágenes con IA</p>
              </div>
            </section>
          )}

          {activeSection === "memory" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-6">
              <MemoryPanel />
            </section>
          )}

          {activeSection === "skills" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-6">
              <SkillsPanel />
            </section>
          )}

          {activeSection === "monetization" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-8">
              <h2 className="text-iridescent font-display text-2xl mb-4">Monetización</h2>
              <p className="text-muted-foreground text-sm">Gestiona tus suscripciones y planes.</p>
              <div className="mt-6 space-y-4">
                <div className="glass-strong rounded-2xl p-6">
                  <h3 className="font-display text-lg text-platinum">Plan Gratuito</h3>
                  <p className="text-muted-foreground text-xs mt-1">100 mensajes/día · 3 skills · Memoria básica</p>
                </div>
                <div className="glass-strong rounded-2xl p-6 border border-electric/30">
                  <h3 className="font-display text-lg text-electric">Plan Pro</h3>
                  <p className="text-muted-foreground text-xs mt-1">Ilimitado · Todos los skills · Memoria premium · API</p>
                  <p className="text-platinum font-mono text-sm mt-2">$9.99/mes</p>
                </div>
              </div>
            </section>
          )}

          {activeSection === "projects" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-8">
              <h2 className="text-iridescent font-display text-2xl mb-4">Proyectos</h2>
              <p className="text-muted-foreground text-sm">Administra tus proyectos cognitivos.</p>
              <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground/60 font-mono text-xs">Próximamente: gestor de proyectos</p>
              </div>
            </section>
          )}

          {activeSection === "settings" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-8">
              <h2 className="text-iridescent font-display text-2xl mb-4">Ajustes</h2>
              <p className="text-muted-foreground text-sm">Configuración del sistema Isabella.</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between glass-strong rounded-xl p-4">
                  <span className="text-sm text-platinum">Idioma</span>
                  <span className="text-xs text-muted-foreground">Español / English</span>
                </div>
                <div className="flex items-center justify-between glass-strong rounded-xl p-4">
                  <span className="text-sm text-platinum">Notificaciones</span>
                  <span className="text-xs text-muted-foreground">Activadas</span>
                </div>
                <div className="flex items-center justify-between glass-strong rounded-xl p-4">
                  <span className="text-sm text-platinum">Tema</span>
                  <span className="text-xs text-muted-foreground">Oscuro</span>
                </div>
              </div>
            </section>
          )}

          {activeSection === "premium" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-8">
              <h2 className="text-iridescent font-display text-2xl mb-4">Perfil Premium</h2>
              <p className="text-muted-foreground text-sm">Accede a funcionalidades exclusivas.</p>
              <div className="mt-6 glass-strong rounded-2xl p-6 border border-iris/30">
                <h3 className="font-display text-lg text-iris">会员</h3>
                <p className="text-muted-foreground text-xs mt-1">Memoria ilimitada · Prioridad en cola · Soporte directo</p>
              </div>
            </section>
          )}

          {activeSection === "voice" && (
            <section className="glass min-h-[52vh] flex-1 rounded-3xl p-8">
              <h2 className="text-iridescent font-display text-2xl mb-4">Voz</h2>
              <p className="text-muted-foreground text-sm">Habla con Isabella usando tu voz.</p>
              <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-muted-foreground/60 font-mono text-xs">Próximamente: reconocimiento de voz</p>
              </div>
            </section>
          )}

          {(activeSection === "pipeline" || activeSection === "telemetry") && (
            <section className="flex min-w-0 flex-col gap-5">
              <div className="glass min-h-[52vh] flex-1 rounded-3xl p-6">
                <TelemetryPanel
                  presetId={isabella.presetId}
                  setPresetId={isabella.setPresetId}
                  decision={isabella.decision}
                  tokens={isabella.tokens}
                  turns={turns}
                  isProcessing={isabella.isProcessing}
                />
              </div>
            </section>
          )}

          <div className={panel ? "block" : "hidden lg:block"}>
            <div className="mb-4">
              <PipelineIndicator />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
