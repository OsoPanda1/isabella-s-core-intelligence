/**
 * Quantum Bridge Contracts — Isabella Villaseñor AI v2.0
 *
 * Contratos tipados para el puente cuántico PennyLane.
 * Basado en la Isabella Quantum Bridge Propuesta Completa.
 */

import { z } from "zod";

export const QuantumProviderSchema = z.enum([
  "default.qubit",
  "lightning.qubit",
  "qiskit.aer",
]);

export const QuantumExecutionModeSchema = z.enum([
  "analytic",
  "sampled",
]);

const WireSchema = z.number().int().min(0).max(23);

export const QuantumGateSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("H"), wires: z.tuple([WireSchema]) }),
  z.object({ name: z.literal("X"), wires: z.tuple([WireSchema]) }),
  z.object({ name: z.literal("Y"), wires: z.tuple([WireSchema]) }),
  z.object({ name: z.literal("Z"), wires: z.tuple([WireSchema]) }),
  z.object({ name: z.literal("RX"), wires: z.tuple([WireSchema]), params: z.tuple([z.number().finite()]) }),
  z.object({ name: z.literal("RY"), wires: z.tuple([WireSchema]), params: z.tuple([z.number().finite()]) }),
  z.object({ name: z.literal("RZ"), wires: z.tuple([WireSchema]), params: z.tuple([z.number().finite()]) }),
  z.object({ name: z.literal("CNOT"), wires: z.tuple([WireSchema, WireSchema]) }),
]);

export const QuantumMeasurementSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("expval"), observable: z.enum(["PauliX", "PauliY", "PauliZ"]), wire: WireSchema }),
  z.object({ name: z.literal("probs"), wires: z.array(WireSchema).min(1).max(24) }),
  z.object({ name: z.literal("sample"), wire: WireSchema }),
]);

export const QuantumCircuitSchema = z
  .object({
    wires: z.number().int().min(1).max(24),
    gates: z.array(QuantumGateSchema).min(1).max(256),
    measurements: z.array(QuantumMeasurementSchema).min(1).max(8),
  })
  .superRefine((circuit, ctx) => {
    const maxWire = circuit.wires - 1;
    circuit.gates.forEach((gate, index) => {
      gate.wires.forEach((wire) => {
        if (wire > maxWire) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["gates", index, "wires"],
            message: `Wire ${wire} is outside the circuit range`,
          });
        }
      });
    });
    circuit.measurements.forEach((measurement, index) => {
      const wires = measurement.name === "probs" ? measurement.wires : [measurement.wire];
      wires.forEach((wire) => {
        if (wire > maxWire) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["measurements", index],
            message: `Measurement wire ${wire} is outside the circuit range`,
          });
        }
      });
    });
  });

export const QuantumExecutionRequestSchema = z.object({
  requestId: z.string().uuid(),
  tenantId: z.string().min(1).max(128),
  provider: QuantumProviderSchema.default("default.qubit"),
  mode: QuantumExecutionModeSchema.default("analytic"),
  wires: z.number().int().min(1).max(24),
  shots: z.number().int().min(1).max(100_000).nullable().default(null),
  circuit: QuantumCircuitSchema,
  metadata: z.record(z.string().max(256)).optional().default({}),
});

export type QuantumProvider = z.infer<typeof QuantumProviderSchema>;
export type QuantumExecutionMode = z.infer<typeof QuantumExecutionModeSchema>;
export type QuantumExecutionRequest = z.infer<typeof QuantumExecutionRequestSchema>;

export interface QuantumExecutionResult {
  requestId: string;
  status: "completed" | "degraded" | "rejected" | "failed";
  implementation:
    | "PENNYLANE_SIMULATOR"
    | "PENNYLANE_LIGHTNING"
    | "PENNYLANE_QISKIT"
    | "CLASSICAL_FALLBACK_NOT_QUANTUM";
  provider: QuantumProvider;
  mode: QuantumExecutionMode;
  result?: unknown;
  telemetry: {
    durationMs: number;
    queueWaitMs: number;
    workerId?: string;
    shots: number | null;
    wires: number;
    gates?: number;
  };
  audit: {
    policyDecision: "allow" | "deny" | "degraded";
    circuitHash: string;
    bookpiBlockHash?: string;
    teeVerified?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface QuantumPrincipal {
  subject: string;
  tenantId: string;
  scopes: string[];
  role: "user" | "agent" | "operator" | "service";
}

export interface QuantumPolicyDecision {
  decision: "allow" | "deny" | "degraded";
  reason: string;
  normalizedProvider: QuantumProvider;
  maxTimeoutMs: number;
  maxWorkersCost: number;
}
