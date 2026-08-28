/**
 * Sistema de herramientas y skills de Isabella Villaseñor AI.
 *
 * Cada skill define:
 * - Nombre, propósito, categoría
 * - Nivel de riesgo y permisos requeridos
 * - Función de ejecución
 * - Entrada/salida tipada
 */

export type SkillCategory =
  | "knowledge"
  | "creative"
  | "analysis"
  | "coding"
  | "communication"
  | "governance"
  | "territorial"
  | "system";

export type SkillRiskLevel = "low" | "medium" | "high";

export type SkillStatus = "active" | "disabled" | "loading";

export interface SkillDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  category: SkillCategory;
  riskLevel: SkillRiskLevel;
  requiredPermissions: string[];
  maxExecutionMs: number;
  retryCount: number;
  enabled: boolean;
}

export interface SkillExecutionRequest {
  skillId: string;
  input: string;
  context?: Record<string, unknown>;
}

export interface SkillExecutionResult {
  skillId: string;
  input: string;
  output: string;
  status: "completed" | "failed" | "timeout";
  latencyMs: number;
  error?: string;
  timestamp: string;
}

export interface SkillWithStatus extends SkillDefinition {
  status: SkillStatus;
  lastExecutedAt?: string;
  executionCount: number;
  averageLatencyMs: number;
  lastError?: string;
}

const STORAGE_KEY = "isabella.skills.v1";

function generateId(): string {
  return `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

const BUILTIN_SKILLS: SkillDefinition[] = [
  {
    id: "web-search",
    name: "Búsqueda Web",
    version: "1.0.0",
    description: "Busca información en la web usando fuentes verificables.",
    category: "knowledge",
    riskLevel: "low",
    requiredPermissions: ["knowledge:retrieve"],
    maxExecutionMs: 15000,
    retryCount: 2,
    enabled: true,
  },
  {
    id: "code-analysis",
    name: "Análisis de Código",
    version: "1.0.0",
    description: "Analiza fragmentos de código y sugiere mejoras.",
    category: "coding",
    riskLevel: "low",
    requiredPermissions: ["knowledge:retrieve"],
    maxExecutionMs: 10000,
    retryCount: 1,
    enabled: true,
  },
  {
    id: "text-summarize",
    name: "Síntesis de Texto",
    version: "1.0.0",
    description: "Resume documentos largos preservando puntos clave.",
    category: "knowledge",
    riskLevel: "low",
    requiredPermissions: ["knowledge:retrieve"],
    maxExecutionMs: 8000,
    retryCount: 1,
    enabled: true,
  },
  {
    id: "creative-write",
    name: "Escritura Creativa",
    version: "1.0.0",
    description: "Genera contenido creativo: narrativa, poesía, copy.",
    category: "creative",
    riskLevel: "low",
    requiredPermissions: ["artifact:generate"],
    maxExecutionMs: 12000,
    retryCount: 1,
    enabled: true,
  },
  {
    id: "data-analysis",
    name: "Análisis de Datos",
    version: "1.0.0",
    description: "Analiza patrones, tendencias y relaciones en datos.",
    category: "analysis",
    riskLevel: "low",
    requiredPermissions: ["knowledge:retrieve"],
    maxExecutionMs: 10000,
    retryCount: 1,
    enabled: true,
  },
  {
    id: "territory-info",
    name: "Información Territorial",
    version: "1.0.0",
    description: "Consulta datos del territorio: geografía, patrimonio, cultura.",
    category: "territorial",
    riskLevel: "low",
    requiredPermissions: ["memory:read:territorial"],
    maxExecutionMs: 8000,
    retryCount: 1,
    enabled: true,
  },
  {
    id: "governance-check",
    name: "Verificación de Gobernanza",
    version: "1.0.0",
    description: "Evalúa acciones contra las reglas constitucionales C.R.O.W.N.",
    category: "governance",
    riskLevel: "medium",
    requiredPermissions: ["governance:evaluate"],
    maxExecutionMs: 5000,
    retryCount: 0,
    enabled: true,
  },
  {
    id: "memory-manage",
    name: "Gestión de Memoria",
    version: "1.0.0",
    description: "Administra registros de memoria: crear, consultar, eliminar.",
    category: "system",
    riskLevel: "medium",
    requiredPermissions: ["memory:write"],
    maxExecutionMs: 3000,
    retryCount: 0,
    enabled: true,
  },
];

export class SkillRegistry {
  private skills: Map<string, SkillWithStatus> = new Map();
  private executionHistory: SkillExecutionResult[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
    this.ensureBuiltinSkills();
  }

  private load(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          skills?: SkillDefinition[];
          history?: SkillExecutionResult[];
        };
        if (Array.isArray(parsed.skills)) {
          for (const s of parsed.skills) {
            this.skills.set(s.id, {
              ...s,
              status: s.enabled ? "active" : "disabled",
              executionCount: 0,
              averageLatencyMs: 0,
            });
          }
        }
        if (Array.isArray(parsed.history)) {
          this.executionHistory = parsed.history.slice(-100);
        }
      }
    } catch {
      /* corrupted data */
    }
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      const skillsArray = Array.from(this.skills.values()).map((s) => ({
        ...s,
        status: undefined,
      }));
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          skills: skillsArray,
          history: this.executionHistory.slice(-100),
          savedAt: nowIso(),
        }),
      );
    } catch {
      /* quota exceeded */
    }
  }

  private ensureBuiltinSkills(): void {
    let changed = false;
    for (const builtin of BUILTIN_SKILLS) {
      if (!this.skills.has(builtin.id)) {
        this.skills.set(builtin.id, {
          ...builtin,
          status: builtin.enabled ? "active" : "disabled",
          executionCount: 0,
          averageLatencyMs: 0,
        });
        changed = true;
      }
    }
    if (changed) this.save();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getAll(): SkillWithStatus[] {
    return Array.from(this.skills.values());
  }

  getById(id: string): SkillWithStatus | undefined {
    return this.skills.get(id);
  }

  getByCategory(category: SkillCategory): SkillWithStatus[] {
    return this.getAll().filter((s) => s.category === category);
  }

  getActive(): SkillWithStatus[] {
    return this.getAll().filter((s) => s.status === "active");
  }

  register(definition: Omit<SkillDefinition, "id">): SkillWithStatus {
    const id = generateId();
    const skill: SkillWithStatus = {
      ...definition,
      id,
      status: definition.enabled ? "active" : "disabled",
      executionCount: 0,
      averageLatencyMs: 0,
    };
    this.skills.set(id, skill);
    this.save();
    this.notify();
    return skill;
  }

  toggle(id: string, enabled: boolean): boolean {
    const skill = this.skills.get(id);
    if (!skill) return false;
    skill.enabled = enabled;
    skill.status = enabled ? "active" : "disabled";
    this.save();
    this.notify();
    return true;
  }

  remove(id: string): boolean {
    const skill = this.skills.get(id);
    if (!skill) return false;
    this.skills.delete(id);
    this.save();
    this.notify();
    return true;
  }

  recordExecution(result: SkillExecutionResult): void {
    this.executionHistory.push(result);
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }

    const skill = this.skills.get(result.skillId);
    if (skill) {
      skill.lastExecutedAt = result.timestamp;
      skill.executionCount++;
      skill.averageLatencyMs =
        (skill.averageLatencyMs * (skill.executionCount - 1) + result.latencyMs) /
        skill.executionCount;
      if (result.status === "failed") {
        skill.lastError = result.error;
      }
    }

    this.save();
    this.notify();
  }

  getHistory(limit = 30): SkillExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }

  getStats(): {
    total: number;
    active: number;
    disabled: number;
    totalExecutions: number;
    byCategory: Record<SkillCategory, number>;
  } {
    const all = this.getAll();
    const byCategory: Record<SkillCategory, number> = {
      knowledge: 0,
      creative: 0,
      analysis: 0,
      coding: 0,
      communication: 0,
      governance: 0,
      territorial: 0,
      system: 0,
    };
    for (const s of all) {
      byCategory[s.category]++;
    }
    return {
      total: all.length,
      active: all.filter((s) => s.status === "active").length,
      disabled: all.filter((s) => s.status === "disabled").length,
      totalExecutions: this.executionHistory.length,
      byCategory,
    };
  }
}

export const skillRegistry = new SkillRegistry();
