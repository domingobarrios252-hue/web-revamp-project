// Pruebas automáticas de RLS para community_submissions y su vista pública.
// Verifica:
//  1. Anon y usuarios autenticados sin rol pueden leer community_submissions_public
//     pero NO ven columnas sensibles (email, phone) ni filas no aprobadas.
//  2. Acceso directo a community_submissions desde anon/usuario está bloqueado
//     (no devuelve email/phone aunque la fila esté aprobada).
//  3. La RPC admin_list_community_submissions falla para anon y usuarios sin rol,
//     y funciona para admin/editor.
//
// Uso: node scripts/community-rls.test.mjs
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert.ok(url, "Falta VITE_SUPABASE_URL o SUPABASE_URL");
assert.ok(anonKey, "Falta VITE_SUPABASE_PUBLISHABLE_KEY o SUPABASE_ANON_KEY");
assert.ok(serviceRoleKey, "Falta SUPABASE_SERVICE_ROLE_KEY");

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const runId = crypto.randomUUID().slice(0, 8);
const password = `Rz-${runId}-Secure-12345!`;
const plainUserEmail = `community-rls-user-${runId}@rollerzone.test`;
const editorEmail = `community-rls-editor-${runId}@rollerzone.test`;
const adminEmail = `community-rls-admin-${runId}@rollerzone.test`;

const approvedName = `qa-approved-${runId}`;
const pendingName = `qa-pending-${runId}`;
const rejectedName = `qa-rejected-${runId}`;
const sensitiveEmail = `secreto-${runId}@example.com`;
const sensitivePhone = `+34900${runId.slice(0, 6)}`;

let plainUserId, editorUserId, adminUserId;
let approvedId, pendingId, rejectedId;

const results = [];
function record(name, ok, err) {
  results.push({ name, ok, err });
  console.log(`${ok ? "✅" : "❌"} ${name}${err ? ` — ${err.message || err}` : ""}`);
}

async function createUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const uid = data.user.id;
  if (role) {
    const { error: rErr } = await admin
      .from("user_roles")
      .insert({ user_id: uid, role });
    if (rErr) throw rErr;
  }
  return uid;
}

async function signedClient(email) {
  const c = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

async function seed() {
  plainUserId = await createUser(plainUserEmail, null);
  editorUserId = await createUser(editorEmail, "editor");
  adminUserId = await createUser(adminEmail, "admin");

  const rows = [
    { name: approvedName, status: "aprobada" },
    { name: pendingName, status: "pendiente" },
    { name: rejectedName, status: "rechazada" },
  ].map((r) => ({
    submission_type: "noticia",
    name: r.name,
    title: `Título ${r.name}`,
    description: "RLS test row",
    email: sensitiveEmail,
    phone: sensitivePhone,
    status: r.status,
  }));
  const { data, error } = await admin
    .from("community_submissions")
    .insert(rows)
    .select("id,name");
  if (error) throw error;
  approvedId = data.find((r) => r.name === approvedName).id;
  pendingId = data.find((r) => r.name === pendingName).id;
  rejectedId = data.find((r) => r.name === rejectedName).id;
}

async function cleanup() {
  await admin
    .from("community_submissions")
    .delete()
    .in("id", [approvedId, pendingId, rejectedId].filter(Boolean));
  for (const uid of [plainUserId, editorUserId, adminUserId].filter(Boolean)) {
    await admin.from("user_roles").delete().eq("user_id", uid);
    await admin.from("profiles").delete().eq("user_id", uid);
    await admin.auth.admin.deleteUser(uid);
  }
}

async function test(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (e) {
    record(name, false, e);
  }
}

async function run() {
  await seed();

  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userClient = await signedClient(plainUserEmail);
  const editorClient = await signedClient(editorEmail);
  const adminClient = await signedClient(adminEmail);

  // ── community_submissions_public ──────────────────────────────────────
  await test("anon puede leer community_submissions_public (sólo aprobadas)", async () => {
    const { data, error } = await anon
      .from("community_submissions_public")
      .select("*")
      .in("id", [approvedId, pendingId, rejectedId]);
    assert.ok(!error, error?.message);
    const ids = (data || []).map((r) => r.id);
    assert.ok(ids.includes(approvedId), "debe incluir la aprobada");
    assert.ok(!ids.includes(pendingId), "no debe incluir pendiente");
    assert.ok(!ids.includes(rejectedId), "no debe incluir rechazada");
  });

  await test("la vista pública NO expone email ni phone", async () => {
    const { data, error } = await anon
      .from("community_submissions_public")
      .select("*")
      .eq("id", approvedId)
      .maybeSingle();
    assert.ok(!error, error?.message);
    assert.ok(data, "fila aprobada debe existir en la vista");
    assert.ok(!("email" in data), "no debe exponer email");
    assert.ok(!("phone" in data), "no debe exponer phone");
  });

  await test("usuario autenticado sin rol NO ve email/phone vía vista pública", async () => {
    const { data, error } = await userClient
      .from("community_submissions_public")
      .select("*")
      .eq("id", approvedId)
      .maybeSingle();
    assert.ok(!error, error?.message);
    assert.ok(!("email" in (data || {})));
    assert.ok(!("phone" in (data || {})));
  });

  // ── community_submissions (tabla base) ────────────────────────────────
  await test("anon NO puede seleccionar email/phone de community_submissions", async () => {
    const { data, error } = await anon
      .from("community_submissions")
      .select("email,phone")
      .eq("id", approvedId);
    // O bien permission denied, o filas vacías; nunca devolver datos sensibles.
    if (!error) {
      const leaked = (data || []).some((r) => r.email || r.phone);
      assert.ok(!leaked, "no debe filtrar email/phone");
    }
  });

  await test("usuario autenticado sin rol NO puede leer email/phone", async () => {
    const { data, error } = await userClient
      .from("community_submissions")
      .select("email,phone")
      .eq("id", approvedId);
    if (!error) {
      const leaked = (data || []).some((r) => r.email || r.phone);
      assert.ok(!leaked, "no debe filtrar email/phone");
    }
  });

  // ── RPC admin_list_community_submissions ──────────────────────────────
  await test("anon NO puede invocar admin_list_community_submissions", async () => {
    const { data, error } = await anon.rpc("admin_list_community_submissions");
    assert.ok(error || !(data && data.length), "debe fallar o devolver vacío");
    if (data && data.length) {
      throw new Error("anon recibió datos del RPC de admin");
    }
  });

  await test("usuario sin rol NO puede invocar admin_list_community_submissions", async () => {
    const { data, error } = await userClient.rpc(
      "admin_list_community_submissions",
    );
    assert.ok(error || !(data && data.length), "debe fallar o devolver vacío");
  });

  await test("editor SÍ puede invocar admin_list_community_submissions", async () => {
    const { data, error } = await editorClient.rpc(
      "admin_list_community_submissions",
    );
    assert.ok(!error, error?.message);
    assert.ok(Array.isArray(data) && data.length > 0, "debe devolver filas");
    const row = data.find((r) => r.id === approvedId);
    assert.ok(row, "editor debe ver la fila aprobada");
    assert.equal(row.email, sensitiveEmail, "editor sí debe ver email completo");
  });

  await test("admin SÍ puede invocar admin_list_community_submissions y ver pendientes", async () => {
    const { data, error } = await adminClient.rpc(
      "admin_list_community_submissions",
    );
    assert.ok(!error, error?.message);
    const ids = data.map((r) => r.id);
    assert.ok(ids.includes(pendingId), "admin debe ver pendientes");
    assert.ok(ids.includes(rejectedId), "admin debe ver rechazadas");
  });
}

let exitCode = 0;
try {
  await run();
} catch (e) {
  console.error("Fallo inesperado:", e);
  exitCode = 1;
} finally {
  await cleanup();
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\nResumen: ${results.length - failed.length}/${results.length} pruebas OK`,
);
if (failed.length) exitCode = 1;
process.exit(exitCode);
