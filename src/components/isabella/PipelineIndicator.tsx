import { useEffect, useState } from "react";
import { pipeline, type PipelineStage } from "@/lib/agent/pipeline";
import { t } from "@/i18n";

const STAGES: PipelineStage[] = [
  "perceive",
  "remember",
  "policy",
  "decide",
  "act",
  "audit",
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: "IDLE",
  perceive: "PERCEIVE",
  remember: "REMEMBER",
  policy: "POLICY",
  decide: "DECIDE",
  act: "ACT",
  audit: "AUDIT",
  complete: "COMPLETE",
  error: "ERROR",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  idle: "var(--muted-foreground)",
  perceive: "var(--electric)",
  remember: "var(--isa)",
  policy: "var(--argus)",
  decide: "var(--crown)",
  act: "var(--orion)",
  audit: "var(--sophia)",
  complete: "var(--electric)",
  error: "var(--destructive)",
};

export function PipelineIndicator() {
  const [currentStage, setCurrentStage] = useState<PipelineStage>(pipeline.stage);

  useEffect(() => {
    return pipeline.subscribe(setCurrentStage);
  }, []);

  const currentIndex = STAGES.indexOf(currentStage);
  const isComplete = currentStage === "complete";
  const isError = currentStage === "error";

  return (
    <div className="glass rounded-2xl p-4">
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        Pipeline C.R.O.W.N.
      </h2>

      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const isActive = stage === currentStage;
          const isPast = currentIndex > i || isComplete;
          const color = STAGE_COLORS[stage];

          return (
            <div key={stage} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`relative flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-500 ${
                  isActive
                    ? "scale-110"
                    : isPast
                      ? "border-transparent"
                      : "border-border/50"
                }`}
                style={{
                  borderColor: isActive || isPast ? color : undefined,
                  backgroundColor: isPast ? color : undefined,
                  boxShadow: isActive ? `0 0 16px ${color}` : undefined,
                }}
              >
                {isActive && (
                  <span
                    className="absolute inset-0 animate-ping rounded-full opacity-30"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span
                  className="relative z-10 font-mono text-[8px]"
                  style={{
                    color: isPast ? "var(--background)" : isActive ? color : "var(--muted-foreground)",
                  }}
                >
                  {i + 1}
                </span>
              </div>
              <span
                className="font-mono text-[7px] uppercase tracking-[0.1em]"
                style={{
                  color: isActive ? color : isPast ? "var(--platinum)" : "var(--muted-foreground)",
                }}
              >
                {t(`agent.pipeline.${stage}`)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em]"
          style={{ color: STAGE_COLORS[currentStage] }}
        >
          {STAGE_LABELS[currentStage]}
        </span>
        {(isComplete || isError) && (
          <span
            className={`font-mono text-[8px] ${
              isComplete ? "text-electric" : "text-destructive"
            }`}
          >
            {isComplete ? "✓ READY" : "✗ ERROR"}
          </span>
        )}
      </div>
    </div>
  );
}
