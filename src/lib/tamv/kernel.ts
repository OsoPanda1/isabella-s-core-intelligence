/**
 * TAMV Kernel — Event-Driven Architecture
 *
 * Kernel orquestador del ecosistema TAMV.
 * Adaptado de rdm-smart-city-os (CC BY 4.0) con renombramiento.
 *
 * Responsabilidades:
 * - Registro de servicios de dominio
 * - Publicación de eventos CivicEvent
 * - Persistencia en event store
 * - Circuit breaker para el bus de eventos
 */

import { randomUUID } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export type Federation =
  | "DEKATEOTL"
  | "ANUBIS"
  | "BOOKPI"
  | "PHOENIX"
  | "MDD_TAMV"
  | "KAOS"
  | "CHRONOS";

export type CivicEventType =
  | "TOURISM_INTERACTION"
  | "DICHO_CONSULTED"
  | "PAYMENT_COMPLETED"
  | "AI_INTERACTION"
  | "CITY_FEEDBACK"
  | "TERRITORY_REGISTERED"
  | "TERRITORY_ACTIVATED"
  | "SESSION_STARTED"
  | "SESSION_INTERACTION_RECORDED"
  | "DECISION_EVALUATED"
  | "PAYMENT_INITIATED"
  | "GEOFENCE_DEFINED"
  | "SECURITY_ALERT"
  | "SYSTEM_METRIC";

export interface CivicEvent<T = unknown> {
  id: string;
  type: CivicEventType;
  federation: Federation;
  payload: T;
  occurredAt: string;
  source: "WEB_PORTAL" | "EDGE_NODE" | "MOBILE_APP" | "BACKOFFICE";
  correlationId?: string | undefined;
}

export interface DomainService {
  name: string;
  handle(event: CivicEvent): Promise<void> | void;
}

export interface StoredEvent extends CivicEvent {
  streamId: string;
  streamVersion: number;
  globalPosition: number;
  eventHash: string;
  recordedAt: string;
  metadata: {
    actorId?: string | undefined;
    causationId?: string | undefined;
  };
}

// ============================================================================
// EVENT STORE (In-Memory)
// ============================================================================

class EventStore {
  private events: StoredEvent[] = [];
  private streamVersions = new Map<string, number>();

  async append(
    event: CivicEvent,
    options: { streamId: string; actorId?: string | undefined; causationId?: string | undefined },
  ): Promise<StoredEvent> {
    const version = (this.streamVersions.get(options.streamId) ?? 0) + 1;
    this.streamVersions.set(options.streamId, version);

    const stored: StoredEvent = {
      ...event,
      streamId: options.streamId,
      streamVersion: version,
      globalPosition: this.events.length + 1,
      eventHash: this.hashEvent(event, options.streamId, version),
      recordedAt: new Date().toISOString(),
      metadata: {
        actorId: options.actorId,
        causationId: options.causationId,
      },
    };

    this.events.push(stored);
    return stored;
  }

  async loadStream(streamId: string, fromVersion = 1): Promise<StoredEvent[]> {
    return this.events.filter(
      (e) => e.streamId === streamId && e.streamVersion >= fromVersion,
    );
  }

  async verifyIntegrity(
    streamId: string,
  ): Promise<{ valid: boolean; failedAtVersion?: number }> {
    const events = await this.loadStream(streamId);
    for (const event of events) {
      const recomputed = this.hashEvent(event, event.streamId, event.streamVersion);
      if (recomputed !== event.eventHash) {
        return { valid: false, failedAtVersion: event.streamVersion };
      }
    }
    return { valid: true };
  }

  private hashEvent(event: CivicEvent, streamId: string, version: number): string {
    const raw = JSON.stringify({
      id: event.id,
      type: event.type,
      federation: event.federation,
      payload: event.payload,
      streamId,
      streamVersion: version,
    });
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
}

// ============================================================================
// TAMV KERNEL
// ============================================================================

export class TAMVKernel {
  private services = new Map<string, DomainService>();
  private eventStore = new EventStore();
  private started = false;

  register(service: DomainService): void {
    this.services.set(service.name, service);
  }

  async emit(
    event: Partial<CivicEvent>,
    streamId?: string,
  ): Promise<StoredEvent> {
    if (!this.started) {
      throw new Error("TAMV Kernel no está iniciado");
    }

    const enriched: CivicEvent = {
      id: event.id ?? randomUUID(),
      type: event.type ?? "SYSTEM_METRIC",
      federation: event.federation ?? "MDD_TAMV",
      payload: event.payload ?? {},
      occurredAt: event.occurredAt ?? new Date().toISOString(),
      source: event.source ?? "BACKOFFICE",
      correlationId: event.correlationId,
    };

    const persisted = await this.eventStore.append(enriched, {
      streamId: streamId ?? "tamv-kernel",
      actorId: "tamv-os-kernel",
      causationId: event.correlationId,
    });

    // Notify all registered services
    for (const service of this.services.values()) {
      try {
        await service.handle(persisted);
      } catch (error) {
        console.error(`TAMV Kernel: Error en servicio ${service.name}:`, error);
      }
    }

    return persisted;
  }

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.started = false;
  }

  status(): { started: boolean; services: string[] } {
    return {
      started: this.started,
      services: [...this.services.keys()],
    };
  }

  getEventStore(): EventStore {
    return this.eventStore;
  }
}

export const tamvKernel = new TAMVKernel();
