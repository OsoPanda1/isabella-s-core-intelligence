import { useEffect, useState } from "react";
import { memory, type MemoryRecord, type MemoryScope } from "@/lib/agent/memory";
import { t } from "@/i18n";

const SCOPE_COLORS: Record<MemoryScope, string> = {
  immediate: "var(--electric)",
  session: "var(--isa)",
  project: "var(--sophia)",
  territorial: "var(--orion)",
  historical: "var(--crown)",
};

const SCOPE_ICONS: Record<MemoryScope, string> = {
  immediate: "◉",
  session: "◈",
  project: "◇",
  territorial: "◆",
  historical: "▣",
};

export function MemoryPanel() {
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [stats, setStats] = useState(memory.getStats());
  const [selectedScope, setSelectedScope] = useState<MemoryScope | "all">("all");

  useEffect(() => {
    const unsubscribe = memory.subscribe(() => {
      setRecords(memory.getAll());
      setStats(memory.getStats());
    });
    setRecords(memory.getAll());
    setStats(memory.getStats());
    return unsubscribe;
  }, []);

  const filtered =
    selectedScope === "all"
      ? records
      : records.filter((r) => r.scope === selectedScope);

  return (
    <section className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("memory.title")}
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {stats.total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedScope("all")}
          className={`rounded-lg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
            selectedScope === "all"
              ? "bg-primary/20 text-platinum"
              : "text-muted-foreground hover:text-platinum"
          }`}
        >
          ALL
        </button>
        {(Object.keys(SCOPE_COLORS) as MemoryScope[]).map((scope) => (
          <button
            key={scope}
            onClick={() => setSelectedScope(scope)}
            className={`rounded-lg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
              selectedScope === scope
                ? "bg-primary/20 text-platinum"
                : "text-muted-foreground hover:text-platinum"
            }`}
          >
            {scope.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center font-mono text-[10px] text-muted-foreground">
            {t("memory.empty")}
          </p>
        ) : (
          filtered.slice(0, 8).map((record) => (
            <div
              key={record.id}
              className="glass rounded-xl px-3 py-2.5 transition-all duration-300"
              style={{
                borderLeftColor: SCOPE_COLORS[record.scope],
                borderLeftWidth: "2px",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px]"
                    style={{ color: SCOPE_COLORS[record.scope] }}
                  >
                    {SCOPE_ICONS[record.scope]}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {record.scope}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-muted-foreground">
                  {record.source}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-foreground/80 line-clamp-2">
                {record.content}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {record.purpose}
                </span>
                {record.tags.length > 0 && (
                  <span className="font-mono text-[8px] text-muted-foreground/50">
                    {record.tags.slice(0, 2).join(" · ")}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 8 && (
        <p className="mt-2 text-center font-mono text-[9px] text-muted-foreground/60">
          +{filtered.length - 8} más
        </p>
      )}
    </section>
  );
}
