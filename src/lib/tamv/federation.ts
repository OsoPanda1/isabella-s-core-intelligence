/**
 * TAMV FederationBus — 7-Federation Event Routing
 *
 * Bus de eventos para las 7 federaciones TAMV.
 * Adaptado de rdm-smart-city-os (CC BY 4.0) con renombramiento.
 *
 * Las 7 federaciones:
 * - DEKATEOTL: Identidad y acceso
 * - ANUBIS: Seguridad y sentinel
 * - BOOKPI: Ledger y auditoría
 * - PHOENIX: Economía y comercio
 * - MDD_TAMV: Kernel y orquestación
 * - KAOS: Media y broadcast
 * - CHRONOS: Infraestructura y operaciones
 */

import type { Federation, CivicEvent } from "./kernel";

// ============================================================================
// TYPES
// ============================================================================

type EventHandler = (event: CivicEvent) => Promise<void> | void;

export interface FederationStatus {
  id: number;
  code: Federation;
  health: number;
  lastEventAt?: string;
}

// ============================================================================
// FEDERATION BUS
// ============================================================================

export class FederationBus {
  private handlers = new Map<Federation, EventHandler[]>();
  private globalHandlers: EventHandler[] = [];
  private status = new Map<Federation, FederationStatus>();

  constructor() {
    const federations: Array<{ id: number; code: Federation }> = [
      { id: 1, code: "DEKATEOTL" },
      { id: 2, code: "ANUBIS" },
      { id: 3, code: "BOOKPI" },
      { id: 4, code: "PHOENIX" },
      { id: 5, code: "MDD_TAMV" },
      { id: 6, code: "KAOS" },
      { id: 7, code: "CHRONOS" },
    ];

    for (const fed of federations) {
      this.status.set(fed.code, {
        id: fed.id,
        code: fed.code,
        health: 1,
      });
    }
  }

  subscribe(federation: Federation, handler: EventHandler): void {
    const handlers = this.handlers.get(federation) ?? [];
    handlers.push(handler);
    this.handlers.set(federation, handlers);
  }

  subscribeAll(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  async publish(event: CivicEvent): Promise<void> {
    // Update federation status
    const status = this.status.get(event.federation);
    if (status) {
      status.lastEventAt = event.occurredAt;
      status.health = Math.min(1, status.health + 0.01);
    }

    // Notify federation-specific handlers
    const federationHandlers = this.handlers.get(event.federation) ?? [];
    await Promise.all(federationHandlers.map((h) => h(event)));

    // Notify global handlers
    await Promise.all(this.globalHandlers.map((h) => h(event)));
  }

  getStatus(): FederationStatus[] {
    return Array.from(this.status.values());
  }

  hasConsensus(approvedVotes: number): boolean {
    return approvedVotes / 7 >= 0.75;
  }
}

export const federationBus = new FederationBus();
