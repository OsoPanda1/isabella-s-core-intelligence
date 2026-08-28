/**
 * TAMV — Territorial Autonomous Machine Village
 *
 * Kernel orquestador + FederationBus para el ecosistema Isabella.
 * Adaptado de rdm-smart-city-os (CC BY 4.0) con renombramiento.
 */

export {
  TAMVKernel,
  tamvKernel,
  type Federation,
  type CivicEventType,
  type CivicEvent,
  type DomainService,
  type StoredEvent,
} from "./kernel";

export {
  FederationBus,
  federationBus,
  type FederationStatus,
} from "./federation";
