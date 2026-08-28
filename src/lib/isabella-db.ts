/**
 * Persistencia operativa de Isabella Villaseñor AI sobre Lovable Cloud.
 * Toda escritura es real y sujeta a RLS por identidad.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface LedgerEntry {
  id: string;
  seq: number;
  event_type: string;
  module: string;
  risk: string | null;
  status: string | null;
  payload: Json;
  prev_hash: string;
  hash: string;
  created_at: string;
}

export interface LedgerVerification {
  verified_at: string;
  total: number;
  intact: boolean;
  head_hash: string;
  broken: Array<Record<string, unknown>>;
}

/** Escribe un evento encadenado criptográficamente (SHA-256) en el ledger. */
export async function ledgerAppend(input: {
  eventType: string;
  module?: string;
  risk?: string | null;
  status?: string | null;
  payload?: Record<string, unknown>;
}): Promise<LedgerEntry | null> {
  const { data, error } = await supabase.rpc("ledger_append", {
    _event_type: input.eventType,
    _module: input.module ?? "CROWN",
    _risk: input.risk ?? "low",
    _status: input.status ?? "allowed",
    _payload: (input.payload ?? {}) as Json,
  });
  if (error) throw new Error(error.message);
  return (data as unknown as LedgerEntry) ?? null;
}

export async function ledgerList(limit = 120): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("id,seq,event_type,module,risk,status,payload,prev_hash,hash,created_at")
    .order("seq", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as LedgerEntry[];
}

export async function ledgerVerify(): Promise<LedgerVerification> {
  const { data, error } = await supabase.rpc("ledger_verify");
  if (error) throw new Error(error.message);
  return data as unknown as LedgerVerification;
}

/** Telemetría real: cada medición proviene de una llamada efectiva. */
export async function recordTelemetry(input: {
  kind: string;
  ok: boolean;
  latencyMs: number;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  await supabase.from("telemetry_events").insert({
    user_id: uid,
    kind: input.kind,
    ok: input.ok,
    latency_ms: Math.round(input.latencyMs),
    detail: (input.detail ?? {}) as Json,
  });
}

export interface TelemetryRow {
  id: string;
  kind: string;
  ok: boolean;
  latency_ms: number | null;
  detail: Json;
  created_at: string;
}

export async function telemetryList(limit = 200): Promise<TelemetryRow[]> {
  const { data, error } = await supabase
    .from("telemetry_events")
    .select("id,kind,ok,latency_ms,detail,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as TelemetryRow[];
}

/* ============================ conversaciones ============================ */

export async function ensureConversation(presetId: string, title: string): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Identidad no autenticada");
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: uid, preset_id: presetId, title: title.slice(0, 120) })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function persistMessage(input: {
  conversationId: string;
  role: "user" | "isabella" | "system";
  content: string;
  decision?: Record<string, unknown> | null;
  latencyMs?: number | null;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  const { error } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    user_id: uid,
    role: input.role,
    content: input.content,
    decision: (input.decision ?? null) as Json,
    latency_ms: input.latencyMs ?? null,
  });
  if (error) throw new Error(error.message);
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId);
}

export interface ConversationRow {
  id: string;
  title: string;
  preset_id: string;
  created_at: string;
  updated_at: string;
}

export async function conversationList(limit = 40): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id,title,preset_id,created_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ConversationRow[];
}

export interface StoredMessage {
  id: string;
  role: "user" | "isabella" | "system";
  content: string;
  decision: Json;
  created_at: string;
}

export async function conversationMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id,role,content,decision,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StoredMessage[];
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ============================ artefactos ============================ */

export interface ArtifactRow {
  id: string;
  kind: "image" | "audio";
  prompt: string;
  storage_path: string;
  mime: string;
  model: string | null;
  created_at: string;
}

const BUCKET = "isabella-artifacts";

export async function storeArtifact(input: {
  kind: "image" | "audio";
  prompt: string;
  blob: Blob;
  extension: string;
  model?: string;
}): Promise<ArtifactRow> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Identidad no autenticada");

  const path = `${uid}/${input.kind}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${input.extension}`;
  const upload = await supabase.storage
    .from(BUCKET)
    .upload(path, input.blob, { contentType: input.blob.type, upsert: false });
  if (upload.error) throw new Error(upload.error.message);

  const { data, error } = await supabase
    .from("artifacts")
    .insert({
      user_id: uid,
      kind: input.kind,
      prompt: input.prompt.slice(0, 2000),
      storage_path: path,
      mime: input.blob.type,
      model: input.model ?? null,
    })
    .select("id,kind,prompt,storage_path,mime,model,created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as ArtifactRow;
}

export async function artifactList(kind?: "image" | "audio", limit = 40): Promise<ArtifactRow[]> {
  let query = supabase
    .from("artifacts")
    .select("id,kind,prompt,storage_path,mime,model,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ArtifactRow[];
}

export async function artifactUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function deleteArtifact(row: ArtifactRow): Promise<void> {
  await supabase.storage.from(BUCKET).remove([row.storage_path]);
  const { error } = await supabase.from("artifacts").delete().eq("id", row.id);
  if (error) throw new Error(error.message);
}

/* ============================ habilidades ============================ */

export interface SkillRow {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  prompt: string;
  model: string;
  risk_level: "low" | "medium" | "high";
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export async function skillList(): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as SkillRow[];
}

export async function skillUpsert(input: {
  id?: string;
  name: string;
  version: string;
  description: string;
  category: string;
  prompt: string;
  model: string;
  risk_level: "low" | "medium" | "high";
}): Promise<SkillRow> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error("Identidad no autenticada");

  if (input.id) {
    const { data, error } = await supabase
      .from("skills")
      .update({
        name: input.name,
        version: input.version,
        description: input.description,
        category: input.category,
        prompt: input.prompt,
        model: input.model,
        risk_level: input.risk_level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as SkillRow;
  }

  const { data, error } = await supabase
    .from("skills")
    .insert({ ...input, user_id: uid })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as SkillRow;
}

export async function skillToggle(id: string, status: "active" | "disabled"): Promise<void> {
  const { error } = await supabase.from("skills").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function skillDelete(id: string): Promise<void> {
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface SkillExecutionRow {
  id: string;
  skill_id: string;
  input: string;
  output: string | null;
  error: string | null;
  status: "running" | "completed" | "failed";
  latency_ms: number | null;
  created_at: string;
}

export async function executionList(limit = 30): Promise<SkillExecutionRow[]> {
  const { data, error } = await supabase
    .from("skill_executions")
    .select("id,skill_id,input,output,error,status,latency_ms,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as SkillExecutionRow[];
}

export async function recordExecution(input: {
  skillId: string;
  input: string;
  output?: string | null;
  error?: string | null;
  status: "completed" | "failed";
  latencyMs: number;
}): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return;
  const { error } = await supabase.from("skill_executions").insert({
    skill_id: input.skillId,
    user_id: uid,
    input: input.input,
    output: input.output ?? null,
    error: input.error ?? null,
    status: input.status,
    latency_ms: Math.round(input.latencyMs),
  });
  if (error) throw new Error(error.message);
}
