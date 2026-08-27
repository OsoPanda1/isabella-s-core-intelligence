import { useEffect, useRef, useState } from "react";
import { Waveform } from "./Waveform";

export function CommandLine({
  onSend,
  onStop,
  onReset,
  isProcessing,
}: {
  onSend: (value: string) => void;
  onStop: () => void;
  onReset: () => void;
  isProcessing: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || isProcessing) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="glass-strong rounded-3xl px-5 py-4 sm:px-7 sm:py-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Canal de percepción · Nodo Cero
        </span>
        <span
          className={`font-mono text-[10px] tracking-[0.2em] ${isProcessing ? "text-electric" : "text-muted-foreground"}`}
        >
          {isProcessing ? "SINTETIZANDO" : "EN ESCUCHA"}
        </span>
      </div>

      <Waveform active={isProcessing} height={44} />

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder="Habla con Isabella… (Enter para enviar · Shift+Enter para nueva línea)"
        className="mt-2 w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="rounded-lg border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-platinum"
          >
            Purgar memoria
          </button>
          {isProcessing && (
            <button
              onClick={onStop}
              className="rounded-lg border border-destructive/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/10"
            >
              Detener
            </button>
          )}
        </div>
        <button
          onClick={submit}
          disabled={isProcessing || !value.trim()}
          className="glow-ring rounded-xl bg-primary px-6 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-primary-foreground transition-opacity disabled:opacity-35"
        >
          Transmitir
        </button>
      </div>
    </div>
  );
}
