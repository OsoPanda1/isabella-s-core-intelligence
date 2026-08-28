/**
 * Fabric Definitions — Isabella Villaseñor AI v2.0
 *
 * Define los contratos tipados para cada Fabric de la arquitectura.
 * Basado en el Blueprint Canónico Operativo v2.0.
 */

export type FabricId =
  | "cognitive"
  | "memory"
  | "action"
  | "trust"
  | "experience"
  | "economic"
  | "infrastructure";

export type FabricStatus = "operational" | "degraded" | "offline" | "maintenance";

export interface FabricHealth {
  fabricId: FabricId;
  status: FabricStatus;
  lastCheck: string;
  uptime: number;
  errorRate: number;
  latencyMs: number;
}

export interface CognitiveFabric {
  id: "cognitive";
  capabilities: [
    "intent_interpretation",
    "reasoning",
    "planning",
    "research",
    "analysis",
    "synthesis",
    "tutoring",
    "programming",
    "creativity",
    "governance_assistance",
    "translation",
    "territorial_guide",
    "accessibility_assistant",
    "general_assistant",
    "multi_agent_debate",
  ];
  profiles: [
    "researcher",
    "tutor",
    "developer",
    "analyst",
    "governance_advisor",
    "creative",
    "translator",
    "territorial_guide",
    "accessibility_assistant",
    "general_assistant",
  ];
}

export interface MemoryFabric {
  id: "memory";
  types: [
    "episodic",
    "semantic",
    "procedural",
    "territorial",
    "organizational",
    "collective_authorized",
  ];
  scopes: [
    "immediate",
    "session",
    "project",
    "territorial",
    "historical",
  ];
}

export interface ActionFabric {
  id: "action";
  pipeline: [
    "plan",
    "policy",
    "approval",
    "execution",
    "verification",
    "audit",
  ];
}

export interface TrustFabric {
  id: "trust";
  components: [
    "authentication",
    "scopes",
    "cryptography",
    "provenance",
    "audit",
    "compliance",
    "telemetry",
    "recovery",
    "kill_switch",
    "rate_limiting",
    "egress_control",
    "tool_authorization",
  ];
}

export interface ExperienceFabric {
  id: "experience";
  channels: [
    "chat",
    "voice",
    "streaming",
    "xr",
    "accessibility",
    "multimodal",
  ];
}

export interface EconomicFabric {
  id: "economic";
  components: [
    "marketplace",
    "gifts",
    "subscriptions",
    "payouts",
    "revenue_ledger",
    "disputes",
  ];
}

export interface InfrastructurePlane {
  id: "infrastructure";
  components: [
    "supabase",
    "postgresql",
    "object_storage",
    "cicd",
    "observability",
    "feature_flags",
    "canary",
    "rollback",
    "backups",
  ];
}

export interface FabricRegistry {
  cognitive: CognitiveFabric;
  memory: MemoryFabric;
  action: ActionFabric;
  trust: TrustFabric;
  experience: ExperienceFabric;
  economic: EconomicFabric;
  infrastructure: InfrastructurePlane;
}

export const FABRIC_REGISTRY: FabricRegistry = {
  cognitive: {
    id: "cognitive",
    capabilities: [
      "intent_interpretation", "reasoning", "planning", "research",
      "analysis", "synthesis", "tutoring", "programming", "creativity",
      "governance_assistance", "translation", "territorial_guide",
      "accessibility_assistant", "general_assistant", "multi_agent_debate",
    ],
    profiles: [
      "researcher", "tutor", "developer", "analyst", "governance_advisor",
      "creative", "translator", "territorial_guide",
      "accessibility_assistant", "general_assistant",
    ],
  },
  memory: {
    id: "memory",
    types: [
      "episodic", "semantic", "procedural", "territorial",
      "organizational", "collective_authorized",
    ],
    scopes: [
      "immediate", "session", "project", "territorial", "historical",
    ],
  },
  action: {
    id: "action",
    pipeline: ["plan", "policy", "approval", "execution", "verification", "audit"],
  },
  trust: {
    id: "trust",
    components: [
      "authentication", "scopes", "cryptography", "provenance", "audit",
      "compliance", "telemetry", "recovery", "kill_switch", "rate_limiting",
      "egress_control", "tool_authorization",
    ],
  },
  experience: {
    id: "experience",
    channels: ["chat", "voice", "streaming", "xr", "accessibility", "multimodal"],
  },
  economic: {
    id: "economic",
    components: [
      "marketplace", "gifts", "subscriptions", "payouts",
      "revenue_ledger", "disputes",
    ],
  },
  infrastructure: {
    id: "infrastructure",
    components: [
      "supabase", "postgresql", "object_storage", "cicd",
      "observability", "feature_flags", "canary", "rollback", "backups",
    ],
  },
};
