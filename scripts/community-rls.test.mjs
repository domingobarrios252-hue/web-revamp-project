// Pruebas automáticas de RLS para community_submissions, su vista pública y
// magazine_purchases. Verifica:
//  1. Vista community_submissions_public: anon, usuarios autenticados sin rol,
//     colaborador y compradores sólo ven filas aprobadas y NUNCA email/phone.
//  2. Tabla community_submissions: ningún rol no privilegiado puede leer
//     columnas sensibles (email, phone), aunque la fila esté aprobada.
//  3. RPC admin_list_community_submissions: falla para anon, usuario sin rol,
//     colaborador y comprador; funciona para editor y admin con email/phone.
//  4. magazine_purchases: cada comprador sólo ve sus propias compras,
//     no las de otros; admin puede ver todas; anon no ve nada.
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
const colabEmail = `community-rls-colab-${runId}@rollerzone.test`;
const buyerAEmail = `community-rls-buyerA-${runId}@rollerzone.test`;
const buyerBEmail = `community-rls-buyerB-${runId}@rollerzone.test`;

const approvedName = `qa-approved-${runId}`;
const pendingName = `qa-pending-${runId}`;
const rejectedName = `qa-rejected-${runId}`;
const sensitiveEmail = `secreto-${runId}@example.com`;
const sensitivePhone = `+34900${runId.slice(0, 6)}`;
const SENSITIVE_FIELDS = ["email", "phone"];

let plainUserId, editorUserId, adminUserId, colabUserId, buyerAId, buyerBId;
let approvedId, pendingId, rejectedId;
let magazineId, purchaseAId, purchaseBId;

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
  await admin.from("user_roles").delete().eq("user_id", uid);
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

function assertNoSensitiveLeak(rows, label) {
  for (const row of rows || []) {
    for (const f of SENSITIVE_FIELDS) {
      assert.ok(
        !(f in row) || row[f] == null,
        `${label}: campo sensible '${f}' no debería estar disponible`,
      );
    }
  }
}

async function seed() {
  plainUserId = await createUser(plainUserEmail, null);
  editorUserId = await createUser(editorEmail, "editor");
  adminUserId = await createUser(adminEmail, "admin");
  colabUserId = await createUser(colabEmail, "colaborador");
  buyerAId = await createUser(buyerAEmail, null);
  buyerBId = await createUser(buyerBEmail, null);

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

  // Sembrar magazine_purchases para dos compradores distintos.
  const { data: mag } = await admin.from("magazines").select("id").limit(1).maybeSingle();
  if (mag?.id) {
    magazineId = mag.id;
    const { data: purchases, error: pErr } = await admin
      .from("magazine_purchases")
      .insert([
        { user_id: buyerAId, magazine_id: magazineId, payment_id: `pay_A_${runId}`, amount_paid: 9.99 },
        { user_id: buyerBId, magazine_id: magazineId, payment_id: `pay_B_${runId}`, amount_paid: 9.99 },
      ])
      .select("id,user_id");
    if (pErr) throw pErr;
    purchaseAId = purchases.find((p) => p.user_id === buyerAId)?.id;
    purchaseBId = purchases.find((p) => p.user_id === buyerBId)?.id;
  }
}

async function cleanup() {
  if (purchaseAId || purchaseBId) {
    await admin
      .from("magazine_purchases")
      .delete()
      .in("id", [purchaseAId, purchaseBId].filter(Boolean));
  }
  await admin
    .from("community_submissions")
    .delete()
    .in("id", [approvedId, pendingId, rejectedId].filter(Boolean));
  for (const uid of [
    plainUserId,
    editorUserId,
    adminUserId,
    colabUserId,
    buyerAId,
    buyerBId,
  ].filter(Boolean)) {
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
  const colabClient = await signedClient(colabEmail);
  const buyerAClient = await signedClient(buyerAEmail);
  const buyerBClient = await signedClient(buyerBEmail);

  // ── community_submissions_public ──────────────────────────────────────
  const publicRoleCases = [
    ["anon", anon],
    ["usuario autenticado sin rol", userClient],
    ["colaborador", colabClient],
    ["comprador sin rol", buyerAClient],
  ];

  for (const [label, client] of publicRoleCases) {
    await test(`${label} sólo ve filas aprobadas en la vista pública`, async () => {
      const { data, error } = await client
        .from("community_submissions_public")
        .select("*")
        .in("id", [approvedId, pendingId, rejectedId]);
      assert.ok(!error, error?.message);
      const ids = (data || []).map((r) => r.id);
      assert.ok(ids.includes(approvedId), "debe incluir aprobada");
      assert.ok(!ids.includes(pendingId), "no debe incluir pendiente");
      assert.ok(!ids.includes(rejectedId), "no debe incluir rechazada");
      assertNoSensitiveLeak(data, `vista pública / ${label}`);
    });

    await test(`${label} NO obtiene email/phone seleccionándolos explícitamente en la vista`, async () => {
      const { data, error } = await client
        .from("community_submissions_public")
        .select("id,email,phone")
        .eq("id", approvedId);
      // Postgrest debería rechazar la columna o devolverla nula; nunca el valor.
      if (!error) {
        const leaked = (data || []).some(
          (r) => r.email === sensitiveEmail || r.phone === sensitivePhone,
        );
        assert.ok(!leaked, "no debe devolver el valor sensible");
      }
    });
  }

  // ── community_submissions (tabla base) ────────────────────────────────
  const baseRoleCases = [
    ["anon", anon],
    ["usuario sin rol", userClient],
    ["colaborador", colabClient],
    ["comprador sin rol", buyerAClient],
  ];

  for (const [label, client] of baseRoleCases) {
    await test(`${label} no puede leer email/phone de community_submissions`, async () => {
      const { data, error } = await client
        .from("community_submissions")
        .select("id,email,phone")
        .eq("id", approvedId);
      if (!error) {
        const leaked = (data || []).some(
          (r) => r.email === sensitiveEmail || r.phone === sensitivePhone,
        );
        assert.ok(!leaked, "no debe filtrar email/phone");
      }
    });
  }

  // ── RPC admin_list_community_submissions ──────────────────────────────
  const rpcDenied = [
    ["anon", anon],
    ["usuario sin rol", userClient],
    ["colaborador", colabClient],
    ["comprador sin rol", buyerAClient],
  ];

  for (const [label, client] of rpcDenied) {
    await test(`${label} NO puede invocar admin_list_community_submissions`, async () => {
      const { data, error } = await client.rpc("admin_list_community_submissions");
      assert.ok(
        error || !(data && data.length),
        `${label}: la RPC no debería devolver datos`,
      );
    });
  }

  await test("editor SÍ invoca admin_list_community_submissions con email/phone", async () => {
    const { data, error } = await editorClient.rpc("admin_list_community_submissions");
    assert.ok(!error, error?.message);
    assert.ok(Array.isArray(data) && data.length > 0, "debe devolver filas");
    const row = data.find((r) => r.id === approvedId);
    assert.ok(row, "editor debe ver la fila aprobada");
    assert.equal(row.email, sensitiveEmail, "editor sí debe ver email completo");
    assert.equal(row.phone, sensitivePhone, "editor sí debe ver phone completo");
  });

  await test("admin SÍ invoca admin_list_community_submissions y ve todos los estados", async () => {
    const { data, error } = await adminClient.rpc("admin_list_community_submissions");
    assert.ok(!error, error?.message);
    const ids = data.map((r) => r.id);
    assert.ok(ids.includes(pendingId), "admin debe ver pendientes");
    assert.ok(ids.includes(rejectedId), "admin debe ver rechazadas");
    const row = data.find((r) => r.id === approvedId);
    assert.equal(row.email, sensitiveEmail);
    assert.equal(row.phone, sensitivePhone);
  });

  // ── magazine_purchases (aislamiento entre compradores) ────────────────
  if (purchaseAId && purchaseBId) {
    await test("comprador A sólo ve sus propias compras", async () => {
      const { data, error } = await buyerAClient
        .from("magazine_purchases")
        .select("id,user_id")
        .in("id", [purchaseAId, purchaseBId]);
      assert.ok(!error, error?.message);
      const ids = (data || []).map((r) => r.id);
      assert.ok(ids.includes(purchaseAId), "debe ver la suya");
      assert.ok(!ids.includes(purchaseBId), "no debe ver la de B");
    });

    await test("comprador B no puede leer la compra de A", async () => {
      const { data, error } = await buyerBClient
        .from("magazine_purchases")
        .select("id")
        .eq("id", purchaseAId);
      assert.ok(!error, error?.message);
      assert.equal((data || []).length, 0, "no debe filtrar compras ajenas");
    });

    await test("usuario sin rol sin compras no ve ninguna compra", async () => {
      const { data, error } = await userClient
        .from("magazine_purchases")
        .select("id")
        .in("id", [purchaseAId, purchaseBId]);
      assert.ok(!error, error?.message);
      assert.equal((data || []).length, 0);
    });

    await test("anon no puede leer magazine_purchases", async () => {
      const { data, error } = await anon
        .from("magazine_purchases")
        .select("id")
        .in("id", [purchaseAId, purchaseBId]);
      assert.ok(error || (data || []).length === 0, "anon nunca debe ver compras");
    });

    await test("admin sí puede leer todas las magazine_purchases", async () => {
      const { data, error } = await adminClient
        .from("magazine_purchases")
        .select("id")
        .in("id", [purchaseAId, purchaseBId]);
      assert.ok(!error, error?.message);
      const ids = (data || []).map((r) => r.id);
      assert.ok(ids.includes(purchaseAId) && ids.includes(purchaseBId));
    });
  } else {
    record("magazine_purchases: sin magazine seed, pruebas omitidas", true);
  }
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
