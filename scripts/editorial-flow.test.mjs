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
const editorEmail = `editorial-flow-${runId}@rollerzone.test`;
const password = `Rz-${runId}-Secure-12345!`;
const sectionSlug = `qa-editorial-${runId}`;
const pendingSlug = `qa-editor-pending-${runId}`;
const rejectedSlug = `qa-editor-rejected-${runId}`;

let editorUserId;
let sectionId;
let pendingNewsId;
let rejectedNewsId;

async function cleanup() {
  await admin.from("news").delete().in("slug", [pendingSlug, rejectedSlug]);
  if (editorUserId) {
    await admin.from("user_roles").delete().eq("user_id", editorUserId);
    await admin.from("profiles").delete().eq("user_id", editorUserId);
    await admin.auth.admin.deleteUser(editorUserId);
  }
  if (sectionId) await admin.from("sections").delete().eq("id", sectionId);
}

async function mustFail(label, promise) {
  const { error } = await promise;
  assert.ok(error, `${label} debía fallar`);
  return error;
}

try {
  const { data: section, error: sectionError } = await admin
    .from("sections")
    .insert({ name: `QA Editorial ${runId}`, slug: sectionSlug, active: true })
    .select("id")
    .single();
  assert.ifError(sectionError);
  sectionId = section.id;

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email: editorEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: `Editor QA ${runId}` },
  });
  assert.ifError(createUserError);
  editorUserId = createdUser.user.id;

  await admin.from("user_roles").delete().eq("user_id", editorUserId);
  const { error: roleError } = await admin.from("user_roles").insert({ user_id: editorUserId, role: "editor" });
  assert.ifError(roleError);

  const { error: profileError } = await admin
    .from("profiles")
    .update({ section_id: sectionId, display_name: `Editor QA ${runId}` })
    .eq("user_id", editorUserId);
  assert.ifError(profileError);

  const editor = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: loginError } = await editor.auth.signInWithPassword({ email: editorEmail, password });
  assert.ifError(loginError);

  const { data: insertedPending, error: insertPendingError } = await editor
    .from("news")
    .insert({
      title: `QA pendiente ${runId}`,
      slug: pendingSlug,
      excerpt: "Noticia creada por editor para revisión.",
      content: "Contenido de prueba para validar el flujo editorial completo.",
      author: `Editor QA ${runId}`,
      created_by: editorUserId,
      section_id: sectionId,
      status: "published",
      published: true,
      featured: true,
    })
    .select("id, status, published, featured, section_id, created_by")
    .single();
  assert.ifError(insertPendingError);
  pendingNewsId = insertedPending.id;
  assert.equal(insertedPending.status, "pending", "El editor siempre crea en pendiente");
  assert.equal(insertedPending.published, false, "El editor no puede dejar la noticia publicada");
  assert.equal(insertedPending.featured, false, "El editor no puede destacar contenido");
  assert.equal(insertedPending.section_id, sectionId, "La noticia queda en su sección asignada");
  assert.equal(insertedPending.created_by, editorUserId, "La autoría queda asociada al editor");

  const publishAttempt = await editor
    .from("news")
    .update({ status: "published", published: true })
    .eq("id", pendingNewsId)
    .select("status, published")
    .single();
  assert.ifError(publishAttempt.error);
  assert.equal(publishAttempt.data.status, "pending", "Un editor no puede publicar por actualización");
  assert.equal(publishAttempt.data.published, false, "La noticia sigue sin publicarse tras el intento del editor");

  const { data: hiddenBeforeApproval, error: hiddenBeforeApprovalError } = await createClient(url, anonKey)
    .from("news")
    .select("id")
    .eq("slug", pendingSlug)
    .eq("published", true)
    .maybeSingle();
  assert.ifError(hiddenBeforeApprovalError);
  assert.equal(hiddenBeforeApproval, null, "La noticia pendiente no aparece en consultas públicas");

  const { data: approved, error: approveError } = await admin
    .from("news")
    .update({ status: "published", review_feedback: null })
    .eq("id", pendingNewsId)
    .select("id, status, published")
    .single();
  assert.ifError(approveError);
  assert.equal(approved.status, "published", "El admin aprueba la noticia");
  assert.equal(approved.published, true, "La aprobación marca la noticia como publicada");

  const { data: publicApproved, error: publicApprovedError } = await createClient(url, anonKey)
    .from("news")
    .select("id, slug, title")
    .eq("slug", pendingSlug)
    .eq("published", true)
    .single();
  assert.ifError(publicApprovedError);
  assert.equal(publicApproved.id, pendingNewsId, "La noticia aprobada aparece en la web pública");

  const { data: insertedRejected, error: insertRejectedError } = await editor
    .from("news")
    .insert({
      title: `QA rechazada ${runId}`,
      slug: rejectedSlug,
      excerpt: "Noticia que será rechazada.",
      content: "Contenido de prueba pendiente de corrección.",
      author: `Editor QA ${runId}`,
      created_by: editorUserId,
      section_id: sectionId,
      status: "pending",
    })
    .select("id, status, published")
    .single();
  assert.ifError(insertRejectedError);
  rejectedNewsId = insertedRejected.id;
  assert.equal(insertedRejected.status, "pending");
  assert.equal(insertedRejected.published, false);

  const feedback = "Falta contraste de fuentes y verificación de datos.";
  const { data: rejected, error: rejectError } = await admin
    .from("news")
    .update({ status: "rejected", review_feedback: feedback })
    .eq("id", rejectedNewsId)
    .select("status, published, review_feedback")
    .single();
  assert.ifError(rejectError);
  assert.equal(rejected.status, "rejected", "El admin puede rechazar con feedback");
  assert.equal(rejected.published, false, "La rechazada no queda publicada");
  assert.equal(rejected.review_feedback, feedback, "El feedback editorial se guarda");

  const { data: publicRejected, error: publicRejectedError } = await createClient(url, anonKey)
    .from("news")
    .select("id")
    .eq("slug", rejectedSlug)
    .eq("published", true)
    .maybeSingle();
  assert.ifError(publicRejectedError);
  assert.equal(publicRejected, null, "Las noticias rechazadas no aparecen en la web pública");

  console.log("✓ editor crea noticias en pendiente");
  console.log("✓ editor no puede publicar");
  console.log("✓ admin aprueba y la noticia aparece públicamente");
  console.log("✓ admin rechaza con feedback y la noticia no se publica");
} finally {
  await cleanup();
}
