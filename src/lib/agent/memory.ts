/**
 * Sistema de memoria jerárquica de Isabella Villaseñor AI.
 *
 * Implementa los cinco scopes definidos en AGENTS.md:
 * - Immediate: ventana corta de atención
 * - Session: contexto de conversación activa
 * - Project: contexto técnico del repositorio
 * - Territorial: conocimiento del territorio
 * - Historical: documentación canónica y memoria persistente
 */

export type MemoryScope = "immediate" | "session" | "project" | "territorial" | "historical";

export type SensitivityLevel = "public" | "internal" | "personal" | "restricted";

export interface MemoryRecord {
  id: string;
  scope: MemoryScope;
  content: string;
  source: "user" | "system" | "tool" | "document";
  sensitivity: SensitivityLevel;
  purpose: string;
  tags: string[];
  confidence: number;
  createdAt: string;
  expiresAt?: string | undefined;
  accessCount: number;
  lastAccessedAt: string;
}

export interface MemoryQuery {
  scope?: MemoryScope[];
  tags?: string[];
  sensitivity?: SensitivityLevel[];
  limit?: number;
  search?: string;
}

export interface MemoryStats {
  total: number;
  byScope: Record<MemoryScope, number>;
  bySensitivity: Record<SensitivityLevel, number>;
  oldestRecord?: string | undefined;
  newestRecord?: string | undefined;
}

const STORAGE_KEY = "isabella.memory.v1";

function generateId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function matchesSearch(record: MemoryRecord, search: string): boolean {
  const lower = search.toLowerCase();
  return (
    record.content.toLowerCase().includes(lower) ||
    record.purpose.toLowerCase().includes(lower) ||
    record.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

function matchesSensitivity(record: MemoryRecord, levels: SensitivityLevel[]): boolean {
  if (levels.length === 0) return true;
  return levels.includes(record.sensitivity);
}

function matchesScope(record: MemoryRecord, scopes: MemoryScope[]): boolean {
  if (scopes.length === 0) return true;
  return scopes.includes(record.scope);
}

function matchesTags(record: MemoryRecord, tags: string[]): boolean {
  if (tags.length === 0) return true;
  return tags.some((tag) => record.tags.includes(tag));
}

export class IsabellaMemory {
  private records: MemoryRecord[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { records?: MemoryRecord[] };
        if (Array.isArray(parsed.records)) {
          this.records = parsed.records;
        }
      }
    } catch {
      /* corrupted data: start fresh */
    }
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ records: this.records, savedAt: nowIso() }),
      );
    } catch {
      /* quota exceeded */
    }
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

  add(input: {
    scope: MemoryScope;
    content: string;
    source: MemoryRecord["source"];
    sensitivity?: SensitivityLevel;
    purpose: string;
    tags?: string[];
    confidence?: number;
    expiresInMs?: number;
  }): MemoryRecord {
    const now = nowIso();
    const record: MemoryRecord = {
      id: generateId(),
      scope: input.scope,
      content: input.content,
      source: input.source,
      sensitivity: input.sensitivity ?? "internal",
      purpose: input.purpose,
      tags: input.tags ?? [],
      confidence: input.confidence ?? 0.8,
      createdAt: now,
      expiresAt: input.expiresInMs
        ? new Date(Date.now() + input.expiresInMs).toISOString()
        : undefined,
      accessCount: 0,
      lastAccessedAt: now,
    };

    this.records.push(record);
    this.save();
    this.notify();
    return record;
  }

  query(q: MemoryQuery): MemoryRecord[] {
    const now = new Date();
    let results = this.records.filter((r) => {
      if (r.expiresAt && new Date(r.expiresAt) <= now) return false;
      return true;
    });

    if (q.scope && q.scope.length > 0) {
      results = results.filter((r) => matchesScope(r, q.scope!));
    }
    if (q.tags && q.tags.length > 0) {
      results = results.filter((r) => matchesTags(r, q.tags!));
    }
    if (q.sensitivity && q.sensitivity.length > 0) {
      results = results.filter((r) => matchesSensitivity(r, q.sensitivity!));
    }
    if (q.search) {
      results = results.filter((r) => matchesSearch(r, q.search!));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (q.limit && q.limit > 0) {
      results = results.slice(0, q.limit);
    }

    for (const r of results) {
      r.accessCount++;
      r.lastAccessedAt = nowIso();
    }
    this.save();
    this.notify();

    return results;
  }

  getById(id: string): MemoryRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  remove(id: string): boolean {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.records.splice(idx, 1);
    this.save();
    this.notify();
    return true;
  }

  clearScope(scope: MemoryScope): number {
    const before = this.records.length;
    this.records = this.records.filter((r) => r.scope !== scope);
    const removed = before - this.records.length;
    this.save();
    this.notify();
    return removed;
  }

  purge(): number {
    const before = this.records.length;
    this.records = this.records.filter((r) => r.scope === "historical" || r.scope === "territorial");
    const removed = before - this.records.length;
    this.save();
    this.notify();
    return removed;
  }

  getStats(): MemoryStats {
    const byScope: Record<MemoryScope, number> = {
      immediate: 0,
      session: 0,
      project: 0,
      territorial: 0,
      historical: 0,
    };
    const bySensitivity: Record<SensitivityLevel, number> = {
      public: 0,
      internal: 0,
      personal: 0,
      restricted: 0,
    };

    for (const r of this.records) {
      byScope[r.scope]++;
      bySensitivity[r.sensitivity]++;
    }

    const dates = this.records.map((r) => r.createdAt).sort();

    return {
      total: this.records.length,
      byScope,
      bySensitivity,
      oldestRecord: dates[0],
      newestRecord: dates[dates.length - 1],
    };
  }

  getAll(): MemoryRecord[] {
    return [...this.records];
  }

  get size(): number {
    return this.records.length;
  }
}

export const memory = new IsabellaMemory();
