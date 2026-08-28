import { useEffect, useState } from "react";
import { skillRegistry, type SkillWithStatus, type SkillCategory } from "@/lib/agent/skills";
import { t } from "@/i18n";

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  knowledge: "var(--sophia)",
  creative: "var(--iris)",
  analysis: "var(--sophia)",
  coding: "var(--orion)",
  communication: "var(--isa)",
  governance: "var(--crown)",
  territorial: "var(--petrol)",
  system: "var(--electric)",
};

const CATEGORY_ICONS: Record<SkillCategory, string> = {
  knowledge: "◎",
  creative: "✦",
  analysis: "⬡",
  coding: "⚙",
  communication: "♡",
  governance: "⚖",
  territorial: "◆",
  system: "⚙",
};

export function SkillsPanel() {
  const [skills, setSkills] = useState<SkillWithStatus[]>([]);
  const [stats, setStats] = useState(skillRegistry.getStats());
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | "all">("all");

  useEffect(() => {
    const unsubscribe = skillRegistry.subscribe(() => {
      setSkills(skillRegistry.getAll());
      setStats(skillRegistry.getStats());
    });
    setSkills(skillRegistry.getAll());
    setStats(skillRegistry.getStats());
    return unsubscribe;
  }, []);

  const filtered =
    selectedCategory === "all"
      ? skills
      : skills.filter((s) => s.category === selectedCategory);

  const categories = Object.keys(CATEGORY_COLORS) as SkillCategory[];

  return (
    <section className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {t("skills.title")}
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {stats.active}/{stats.total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`rounded-lg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
            selectedCategory === "all"
              ? "bg-primary/20 text-platinum"
              : "text-muted-foreground hover:text-platinum"
          }`}
        >
          ALL
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
              selectedCategory === cat
                ? "bg-primary/20 text-platinum"
                : "text-muted-foreground hover:text-platinum"
            }`}
          >
            {cat.slice(0, 4)}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center font-mono text-[10px] text-muted-foreground">
            {t("skills.empty")}
          </p>
        ) : (
          filtered.map((skill) => (
            <div
              key={skill.id}
              className={`glass rounded-xl px-3 py-2.5 transition-all duration-300 ${
                skill.status === "disabled" ? "opacity-50" : ""
              }`}
              style={{
                borderLeftColor: CATEGORY_COLORS[skill.category],
                borderLeftWidth: "2px",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px]"
                    style={{ color: CATEGORY_COLORS[skill.category] }}
                  >
                    {CATEGORY_ICONS[skill.category]}
                  </span>
                  <span className="text-[11px] text-platinum">{skill.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[8px] uppercase tracking-[0.1em] ${
                      skill.status === "active" ? "text-electric" : "text-muted-foreground"
                    }`}
                  >
                    {skill.status === "active" ? t("skills.active") : t("skills.disabled")}
                  </span>
                  <button
                    onClick={() => skillRegistry.toggle(skill.id, skill.status !== "active")}
                    className="font-mono text-[8px] text-muted-foreground hover:text-platinum"
                  >
                    {skill.status === "active" ? "⏸" : "▶"}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground line-clamp-2">
                {skill.description}
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground/60">
                  {skill.category}
                </span>
                <span className="font-mono text-[8px] text-muted-foreground/50">
                  v{skill.version}
                </span>
                {skill.executionCount > 0 && (
                  <span className="font-mono text-[8px] text-muted-foreground/50">
                    {skill.executionCount}×
                  </span>
                )}
                <span
                  className={`font-mono text-[8px] ${
                    skill.riskLevel === "high"
                      ? "text-destructive"
                      : skill.riskLevel === "medium"
                        ? "text-orion"
                        : "text-muted-foreground/50"
                  }`}
                >
                  {skill.riskLevel.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
