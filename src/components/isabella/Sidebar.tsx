import { useState } from "react";

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

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
}

interface MenuItem {
  id: SidebarSection;
  label: string;
  icon: string;
  group: "principal" | "herramientas" | "sistema";
}

const MENU_ITEMS: MenuItem[] = [
  { id: "chat", label: "ISABELLA", icon: "💬", group: "principal" },
  { id: "images", label: "CREA IMÁGENES", icon: "🎨", group: "principal" },
  { id: "voice", label: "VOZ", icon: "🎙️", group: "principal" },
  { id: "memory", label: "MEMORIA", icon: "📚", group: "herramientas" },
  { id: "skills", label: "SKILLS", icon: "⚡", group: "herramientas" },
  { id: "projects", label: "PROYECTOS", icon: "📁", group: "herramientas" },
  { id: "pipeline", label: "PIPELINE", icon: "🔗", group: "sistema" },
  { id: "telemetry", label: "TELEMETRÍA", icon: "📊", group: "sistema" },
  { id: "monetization", label: "MONETIZACIÓN", icon: "💰", group: "sistema" },
  { id: "premium", label: "PERFIL PREMIUM", icon: "⭐", group: "sistema" },
  { id: "settings", label: "AJUSTES", icon: "⚙️", group: "sistema" },
];

const GROUP_LABELS: Record<string, string> = {
  principal: "Principal",
  herramientas: "Herramientas",
  sistema: "Sistema",
};

export function Sidebar({ open, onToggle, activeSection, onSectionChange }: SidebarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>("principal");

  const groups = MENU_ITEMS.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={`glass-strong flex h-screen flex-col border-r border-border/50 transition-all duration-300 ${
        open ? "w-64" : "w-16"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        {open && (
          <span className="font-display text-sm tracking-tight text-platinum">Menú</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-platinum"
        >
          {open ? "◀" : "▶"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(groups).map(([groupId, items]) => (
          <div key={groupId} className="mb-2">
            {open && (
              <button
                onClick={() => setExpandedGroup(expandedGroup === groupId ? null : groupId)}
                className="flex w-full items-center justify-between px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 hover:text-muted-foreground"
              >
                <span>{GROUP_LABELS[groupId]}</span>
                <span className="text-[8px]">{expandedGroup === groupId ? "▼" : "▶"}</span>
              </button>
            )}

            {(!open || expandedGroup === groupId) &&
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all ${
                    open ? "px-6" : "justify-center px-2"
                  } ${
                    activeSection === item.id
                      ? "bg-primary/15 text-platinum border-r-2 border-electric"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-platinum"
                  }`}
                >
                  <span className={`text-sm ${!open ? "text-base" : ""}`}>{item.icon}</span>
                  {open && (
                    <span className="font-mono text-[11px] tracking-[0.08em]">{item.label}</span>
                  )}
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {open && (
        <div className="border-t border-border/50 p-4">
          <div className="glass-strong rounded-xl p-3">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-electric" />
              <span className="font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                C.R.O.W.N. ACTIVO
              </span>
            </div>
            <p className="mt-1 font-mono text-[8px] text-muted-foreground/50">
              v2.0 · Nodo Cero
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
