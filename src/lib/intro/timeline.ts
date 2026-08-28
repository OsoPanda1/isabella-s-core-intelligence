/**
 * ISABELLA VILLASEÑOR AI — Cinematic Initialization Timeline
 * ----------------------------------------------------------
 * Reloj cinematográfico canónico de 50 s. Toda la secuencia se resuelve
 * a partir de tiempo transcurrido real (delta time), nunca de frames.
 *
 * origen → memoria → identidad → sensibilidad → inteligencia activa
 */

export type IntroPhase =
  | "VOID"
  | "STELLAR_FIELD"
  | "COMET_PASSAGE"
  | "COGNITIVE_CORE"
  | "LOGO_REVEAL"
  | "HEARTBEAT"
  | "HUMMINGBIRD_ENTRY"
  | "HUMMINGBIRD_ASCENT"
  | "INTERFACE_REVEAL"
  | "ONLINE";

export const INTRO_DURATION = 50;

export const TIMELINE = {
  void: [0, 5],
  stars: [5, 12],
  comets: [12, 19],
  core: [19, 26],
  logo: [26, 33],
  heart: [33, 39],
  hummingbird: [39, 47],
  interface: [47, 50],
} as const;

export function resolveIntroPhase(time: number): IntroPhase {
  if (time < 5) return "VOID";
  if (time < 12) return "STELLAR_FIELD";
  if (time < 19) return "COMET_PASSAGE";
  if (time < 26) return "COGNITIVE_CORE";
  if (time < 33) return "LOGO_REVEAL";
  if (time < 39) return "HEARTBEAT";
  if (time < 43) return "HUMMINGBIRD_ENTRY";
  if (time < 47) return "HUMMINGBIRD_ASCENT";
  if (time < INTRO_DURATION) return "INTERFACE_REVEAL";
  return "ONLINE";
}

export const PHASE_LABEL: Record<IntroPhase, string> = {
  VOID: "Vacío primario · memoria latente",
  STELLAR_FIELD: "Campo estelar · territorio revelado",
  COMET_PASSAGE: "Cometas · transporte de información",
  COGNITIVE_CORE: "Núcleo cognitivo · contexto, memoria, identidad",
  LOGO_REVEAL: "Identidad · Isabella Villaseñor",
  HEARTBEAT: "Corazón · vitalidad confirmada",
  HUMMINGBIRD_ENTRY: "Colibrí · sensibilidad en vuelo",
  HUMMINGBIRD_ASCENT: "Ascenso · horizonte abierto",
  INTERFACE_REVEAL: "Interfaz · activación por capas",
  ONLINE: "Isabella en línea",
};

/* ------------------------------------------------------------------ */
/* Paleta canónica del intro                                           */
/* ------------------------------------------------------------------ */

export const PALETTE = {
  voidBlack: "#02040A",
  deepSpace: "#07111F",
  indigoCore: "#312E81",
  electricViolet: "#8B5CF6",
  cyanSignal: "#22D3EE",
  roseHeart: "#FB7185",
  emeraldLife: "#34D399",
  goldAccent: "#FACC15",
  whiteLight: "#F8FAFC",
} as const;

/* ------------------------------------------------------------------ */
/* Curvas de interpolación                                             */
/* ------------------------------------------------------------------ */

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutExpo = (t: number) => {
  const x = clamp01(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3);

export function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function clamp(v: number, min: number, max: number) {
  return v < min ? min : v > max ? max : v;
}

/** Progreso normalizado dentro de una ventana temporal [start, end]. */
export function span(time: number, start: number, end: number) {
  return clamp01((time - start) / (end - start));
}

/** Damping exponencial independiente del frame rate. */
export function damp(current: number, target: number, lambda: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* ------------------------------------------------------------------ */
/* Vectores y splines Catmull-Rom (sin dependencias externas)          */
/* ------------------------------------------------------------------ */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export class CatmullRomCurve3 {
  constructor(private readonly points: Vec3[]) {
    if (points.length < 2) throw new Error("CatmullRomCurve3 requiere al menos 2 puntos.");
  }

  getPointAt(progress: number): Vec3 {
    const p = this.points;
    const t = clamp01(progress) * (p.length - 1);
    const i = Math.min(Math.floor(t), p.length - 2);
    const f = t - i;
    const p0 = p[Math.max(i - 1, 0)]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[Math.min(i + 2, p.length - 1)]!;
    return {
      x: catmull(p0.x, p1.x, p2.x, p3.x, f),
      y: catmull(p0.y, p1.y, p2.y, p3.y, f),
      z: catmull(p0.z, p1.z, p2.z, p3.z, f),
    };
  }

  getTangentAt(progress: number): Vec3 {
    const d = 0.0025;
    const a = this.getPointAt(clamp01(progress - d));
    const b = this.getPointAt(clamp01(progress + d));
    const t = v3(b.x - a.x, b.y - a.y, b.z - a.z);
    const len = Math.hypot(t.x, t.y, t.z) || 1;
    return v3(t.x / len, t.y / len, t.z / len);
  }
}

/* ------------------------------------------------------------------ */
/* Dirección de cámara                                                 */
/* ------------------------------------------------------------------ */

export interface CameraShot {
  start: number;
  end: number;
  position: Vec3;
  lookAt: Vec3;
  fov: number;
}

export const SHOTS: CameraShot[] = [
  { start: 0, end: 12, position: v3(0, 0, 48), lookAt: v3(0, 0, 0), fov: 54 },
  { start: 12, end: 26, position: v3(-2, 1, 43), lookAt: v3(0, 0, 0), fov: 52 },
  { start: 26, end: 39, position: v3(0, 0, 38), lookAt: v3(0, 0.5, 0), fov: 50 },
  { start: 39, end: 50, position: v3(1, 2, 42), lookAt: v3(0, 1, 0), fov: 52 },
];

export function resolveShot(time: number): CameraShot {
  for (const shot of SHOTS) {
    if (time >= shot.start && time < shot.end) return shot;
  }
  return SHOTS[SHOTS.length - 1]!;
}

/* ------------------------------------------------------------------ */
/* Perfiles de calidad — degradación automática                        */
/* ------------------------------------------------------------------ */

export type QualityTier = "high" | "medium" | "low";

export interface QualityProfile {
  tier: QualityTier;
  stars2d: number;
  stars3d: number;
  cometTrail: number;
  coreParticles: number;
  bloom: number;
  fog: boolean;
  pixelRatio: number;
}

export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  high: {
    tier: "high",
    stars2d: 3200,
    stars3d: 9000,
    cometTrail: 90,
    coreParticles: 520,
    bloom: 1,
    fog: true,
    pixelRatio: 2,
  },
  medium: {
    tier: "medium",
    stars2d: 1800,
    stars3d: 4200,
    cometTrail: 54,
    coreParticles: 300,
    bloom: 0.55,
    fog: true,
    pixelRatio: 1.5,
  },
  low: {
    tier: "low",
    stars2d: 700,
    stars3d: 1000,
    cometTrail: 22,
    coreParticles: 130,
    bloom: 0,
    fog: false,
    pixelRatio: 1,
  },
};

export function detectQuality(): QualityProfile {
  if (typeof window === "undefined") return QUALITY_PROFILES.medium;
  const nav = window.navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const narrow = window.innerWidth < 760;
  if (cores <= 4 || memory <= 4 || narrow) {
    return cores <= 2 || memory <= 2 ? QUALITY_PROFILES.low : QUALITY_PROFILES.medium;
  }
  if (cores >= 8 && memory >= 8) return QUALITY_PROFILES.high;
  return QUALITY_PROFILES.medium;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* Estado final publicado al terminar la ceremonia                     */
/* ------------------------------------------------------------------ */

export const INTRO_FINAL_STATE = {
  intro: "complete",
  isabella: "online",
  context: "ready",
  memory: "available",
  governance: "active",
  experience: "interactive",
} as const;

/* ------------------------------------------------------------------ */
/* Capas de revelación de interfaz (47 → 50 s)                         */
/* ------------------------------------------------------------------ */

export const INTERFACE_LAYERS: { at: number; label: string }[] = [
  { at: 47.0, label: "HUD periférico" },
  { at: 47.6, label: "Barra de navegación" },
  { at: 48.2, label: "Indicadores de estado" },
  { at: 48.8, label: "Terminal conversacional" },
  { at: 49.4, label: "Isabella lista" },
];

export const CORE_FRAGMENTS = ["CONTEXT", "MEMORY", "IDENTITY", "REASONING"] as const;
