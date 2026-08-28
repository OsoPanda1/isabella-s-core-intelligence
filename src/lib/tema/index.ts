/**
 * TEMA — Skin Engine
 *
 * Sistema de theming data-driven para Isabella Villaseñor AI.
 * Patrón adaptado de Hermes Agent Skin Engine (MIT) con renombramiento.
 *
 * Cada skin define: colores, fuentes, espaciado, animaciones, bordes.
 * La estética Isabella: Navy, Petroleum Blue, Platinum, Pearl White, Terracotta, Copper.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SkinColors {
  navy: string;
  petroleum: string;
  platinum: string;
  pearl: string;
  terracotta: string;
  copper: string;
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderActive: string;
  text: string;
  textMuted: string;
  textAccent: string;
  primary: string;
  primaryHover: string;
  error: string;
  errorSurface: string;
  warning: string;
  warningSurface: string;
  success: string;
  successSurface: string;
}

export interface SkinTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface SkinSpacing {
  radius: string;
  radiusLg: string;
  radiusXl: string;
  gap: string;
  padding: string;
  paddingLg: string;
}

export interface SkinAnimation {
  duration: string;
  easing: string;
  durationFast: string;
  durationSlow: string;
}

export interface SkinDefinition {
  name: string;
  description: string;
  colors: SkinColors;
  typography: SkinTypography;
  spacing: SkinSpacing;
  animation: SkinAnimation;
  borders: {
    width: string;
    style: string;
    glow: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    glow: string;
  };
}

// ============================================================================
// ISABELLA DEFAULT SKIN
// ============================================================================

export const ISABELLA_SKIN: SkinDefinition = {
  name: "Isabella Platinum",
  description: "Estética enterprise de nueva generación con alma territorial",
  colors: {
    navy: "#0A1628",
    petroleum: "#1A3A4A",
    platinum: "#E5E4E2",
    pearl: "#F8F7F4",
    terracotta: "#C75B39",
    copper: "#B87333",
    background: "#060D18",
    surface: "#0F1D32",
    surfaceHover: "#152840",
    border: "rgba(229, 228, 226, 0.08)",
    borderActive: "rgba(184, 115, 51, 0.3)",
    text: "#F8F7F4",
    textMuted: "rgba(248, 247, 244, 0.5)",
    textAccent: "#E5E4E2",
    primary: "#B87333",
    primaryHover: "#D4894A",
    error: "#E54D4D",
    errorSurface: "rgba(229, 77, 77, 0.08)",
    warning: "#E5A64D",
    warningSurface: "rgba(229, 166, 77, 0.08)",
    success: "#4DE5A6",
    successSurface: "rgba(77, 229, 166, 0.08)",
  },
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    fontSize: "14px",
    lineHeight: "1.6",
    letterSpacing: "0.01em",
  },
  spacing: {
    radius: "12px",
    radiusLg: "16px",
    radiusXl: "24px",
    gap: "16px",
    padding: "16px",
    paddingLg: "24px",
  },
  animation: {
    duration: "200ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    durationFast: "100ms",
    durationSlow: "400ms",
  },
  borders: {
    width: "1px",
    style: "solid",
    glow: "0 0 20px rgba(184, 115, 51, 0.15)",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    md: "0 4px 12px rgba(0, 0, 0, 0.4)",
    lg: "0 8px 32px rgba(0, 0, 0, 0.5)",
    glow: "0 0 40px rgba(184, 115, 51, 0.1)",
  },
};

// ============================================================================
// TEMA ENGINE
// ============================================================================

export class TEMAEngine {
  private activeSkin: SkinDefinition;
  private skins = new Map<string, SkinDefinition>();

  constructor(skin: SkinDefinition = ISABELLA_SKIN) {
    this.activeSkin = skin;
    this.skins.set(skin.name, skin);
  }

  register(skin: SkinDefinition): void {
    this.skins.set(skin.name, skin);
  }

  setSkin(name: string): boolean {
    const skin = this.skins.get(name);
    if (!skin) return false;
    this.activeSkin = skin;
    return true;
  }

  getSkin(): SkinDefinition {
    return this.activeSkin;
  }

  getSkins(): string[] {
    return Array.from(this.skins.keys());
  }

  toCSSVariables(): string {
    const s = this.activeSkin;
    return [
      `--tema-navy: ${s.colors.navy}`,
      `--tema-petroleum: ${s.colors.petroleum}`,
      `--tema-platinum: ${s.colors.platinum}`,
      `--tema-pearl: ${s.colors.pearl}`,
      `--tema-terracotta: ${s.colors.terracotta}`,
      `--tema-copper: ${s.colors.copper}`,
      `--tema-bg: ${s.colors.background}`,
      `--tema-surface: ${s.colors.surface}`,
      `--tema-surface-hover: ${s.colors.surfaceHover}`,
      `--tema-border: ${s.colors.border}`,
      `--tema-border-active: ${s.colors.borderActive}`,
      `--tema-text: ${s.colors.text}`,
      `--tema-text-muted: ${s.colors.textMuted}`,
      `--tema-text-accent: ${s.colors.textAccent}`,
      `--tema-primary: ${s.colors.primary}`,
      `--tema-primary-hover: ${s.colors.primaryHover}`,
      `--tema-error: ${s.colors.error}`,
      `--tema-warning: ${s.colors.warning}`,
      `--tema-success: ${s.colors.success}`,
      `--tema-font: ${s.typography.fontFamily}`,
      `--tema-font-mono: ${s.typography.fontFamilyMono}`,
      `--tema-radius: ${s.spacing.radius}`,
      `--tema-radius-lg: ${s.spacing.radiusLg}`,
      `--tema-radius-xl: ${s.spacing.radiusXl}`,
      `--tema-gap: ${s.spacing.gap}`,
      `--tema-padding: ${s.spacing.padding}`,
      `--tema-duration: ${s.animation.duration}`,
      `--tema-easing: ${s.animation.easing}`,
    ].join(";\n");
  }
}

export const temaEngine = new TEMAEngine();
