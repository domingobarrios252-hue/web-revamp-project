import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";
import crypto from "node:crypto";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && key && secret);
const opts = { auth: { persistSession: false, autoRefreshToken: false } },
  service = createClient(url, secret, opts);
const users = [],
  rows = { news: [], interviews: [] },
  files = [];
let checks = 0;
const check = (v, label) => {
  assert.ok(v, label);
  checks++;
};
async function account(role, country) {
  const email = `security-${crypto.randomUUID()}@rollerzone.test`,
    password = crypto.randomUUID() + "Aa1!";
  const r = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(r.error);
  const id = r.data.user.id;
  users.push(id);
  assert.ifError((await service.from("user_roles").insert({ user_id: id, role })).error);
  if (country) {
    assert.ifError(
      (await service.from("editor_countries").insert({ user_id: id, country_code: country })).error,
    );
    assert.ifError(
      (
        await service
          .from("editor_permissions")
          .insert(
            ["noticias", "entrevistas"].map((section) => ({
              user_id: id,
              section,
              can_create: true,
              can_edit: true,
              can_delete: false,
              can_publish: false,
            })),
          )
      ).error,
    );
  }
  const client = createClient(url, key, opts);
  assert.ifError((await client.auth.signInWithPassword({ email, password })).error);
  return { id, client };
}
async function blocked(p, label) {
  const r = await p;
  check(r.error || !r.data || r.data.length === 0, label);
}
async function insert(a, t, country) {
  const p = {
    title: "Temporary security test",
    slug: `security-${crypto.randomUUID()}`,
    country_code: country,
    status: "draft",
    published: false,
    created_by: a.id,
  };
  if (t === "interviews") {
    p.interviewee_name = "Temporary test";
    p.interview_date = new Date().toISOString().slice(0, 10);
  }
  const r = await a.client
    .from(t)
    .insert(p)
    .select("id,country_code,created_by,status,published")
    .single();
  assert.ifError(r.error);
  rows[t].push(r.data.id);
  return r.data;
}
try {
  const fr = await account("editor", "fr"),
    pt = await account("editor", "pt"),
    admin = await account("admin");
  for (const t of ["news", "interviews"]) {
    const own = await insert(fr, t, "pt"),
      other = await insert(pt, t, "pt");
    check(own.country_code === "fr", `${t} forced France`);
    check(own.created_by === fr.id, `${t} authenticated owner`);
    await blocked(
      fr.client.from(t).select("id").eq("id", other.id),
      `${t} other country draft hidden`,
    );
    await blocked(
      fr.client.from(t).update({ title: "Forbidden" }).eq("id", other.id).select("id"),
      `${t} cross country update blocked`,
    );
    check(
      (await fr.client.from(t).update({ country_code: "pt" }).eq("id", own.id)).error,
      `${t} country immutable`,
    );
    check(
      (await fr.client.from(t).update({ created_by: pt.id }).eq("id", own.id)).error,
      `${t} owner immutable`,
    );
    const pub = await fr.client
      .from(t)
      .update({ status: "published", published: true })
      .eq("id", own.id)
      .select("status,published")
      .single();
    assert.ifError(pub.error);
    check(pub.data.status === "draft" && !pub.data.published, `${t} editor publication blocked`);
    await blocked(
      fr.client.from(t).delete().eq("id", own.id).select("id"),
      `${t} editor deletion blocked`,
    );
    const pending = await fr.client
      .from(t)
      .update({ status: "pending" })
      .eq("id", own.id)
      .select("status,submitted_at")
      .single();
    assert.ifError(pending.error);
    check(pending.data.status === "pending" && pending.data.submitted_at, `${t} review submission`);
    const reject = await admin.client
      .from(t)
      .update({ status: "rejected", review_feedback: "Test feedback" })
      .eq("id", own.id)
      .select("status,review_feedback")
      .single();
    assert.ifError(reject.error);
    check(
      reject.data.status === "rejected" && reject.data.review_feedback === "Test feedback",
      `${t} administrator review`,
    );
    const revise = await fr.client
      .from(t)
      .update({ status: "draft" })
      .eq("id", own.id)
      .select("status")
      .single();
    assert.ifError(revise.error);
    check(revise.data.status === "draft", `${t} draft revision`);
    // Verify administrator publication inside this isolated test, hide immediately afterwards.
    const approved = await admin.client
      .from(t)
      .update({ status: "published" })
      .eq("id", own.id)
      .select("published,approved_by")
      .single();
    assert.ifError(approved.error);
    check(
      approved.data.published && approved.data.approved_by === admin.id,
      `${t} administrator publication`,
    );
    await blocked(
      fr.client.from(t).update({ title: "Forbidden published edit" }).eq("id", own.id).select("id"),
      `${t} published edit blocked`,
    );
    assert.ifError((await admin.client.from(t).update({ status: "draft" }).eq("id", own.id)).error);
    const same = await insert(admin, t, "fr");
    await blocked(
      fr.client.from(t).select("id").eq("id", same.id),
      `${t} other author draft hidden`,
    );
  }
  for (const t of [
    "live_results",
    "events",
    "schedule_items",
    "medal_standings",
    "magazines",
    "tv_settings",
    "ad_banners",
    "sponsors",
    "site_settings",
    "result_events",
  ]) {
    const r = await service.from(t).select("*").limit(1).maybeSingle();
    assert.ifError(r.error);
    const col = t === "site_settings" ? "key" : "id",
      id = r.data?.[col] ?? crypto.randomUUID(),
      patch = t === "site_settings" ? { value: r.data?.value ?? "" } : { id };
    await blocked(
      fr.client.from(t).update(patch).eq(col, id).select(col),
      `${t} direct update blocked`,
    );
  }
  await blocked(fr.client.from("community_submissions").select("id"), "private proposals hidden");
  check(
    (await fr.client.rpc("admin_list_community_submissions")).error,
    "private proposals RPC blocked",
  );
  check(
    (await fr.client.rpc("convert_live_to_result_event", { _event_id: crypto.randomUUID() })).error,
    "conversion RPC blocked",
  );
  const ownPath = `news/security-${crypto.randomUUID()}.png`,
    otherPath = `news/security-${crypto.randomUUID()}.png`,
    bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    );
  files.push(ownPath, otherPath);
  assert.ifError(
    (await fr.client.storage.from("media").upload(ownPath, bytes, { contentType: "image/png" }))
      .error,
  );
  check(true, "own photograph upload");
  assert.ifError(
    (await pt.client.storage.from("media").upload(otherPath, bytes, { contentType: "image/png" }))
      .error,
  );
  check(
    (
      await fr.client.storage
        .from("media")
        .upload(otherPath, bytes, { contentType: "image/png", upsert: true })
    ).error,
    "other photograph overwrite blocked",
  );
  await fr.client.storage.from("media").remove([otherPath]);
  check(
    !(await service.storage.from("media").download(otherPath)).error,
    "other photograph survives deletion",
  );
  for (const bucket of ["magazine-pages", "community-pending"]) {
    const r = await fr.client.storage.from(bucket).list("", { limit: 10 });
    check(r.error || r.data.length === 0, `${bucket} private files hidden`);
  }
  // Result files published for everyone must remain accessible; test only a hidden object.
  const hiddenPath = `security-private-${crypto.randomUUID()}.pdf`;
  try {
    assert.ifError(
      (
        await service.storage
          .from("result-documents")
          .upload(hiddenPath, Buffer.from("%PDF-1.4\n"), { contentType: "application/pdf" })
      ).error,
    );
    check(
      (await fr.client.storage.from("result-documents").download(hiddenPath)).error,
      "private result document inaccessible",
    );
  } finally {
    assert.ifError((await service.storage.from("result-documents").remove([hiddenPath])).error);
  }
  check(
    (
      await fr.client
        .from("profiles")
        .update({ suspended_at: new Date().toISOString() })
        .eq("user_id", fr.id)
    ).error,
    "own suspension field protected",
  );
  assert.ifError(
    (
      await admin.client
        .from("profiles")
        .update({ suspended_at: new Date().toISOString() })
        .eq("user_id", fr.id)
    ).error,
  );
  await blocked(fr.client.from("news").select("id"), "existing suspended session blocked");
  await blocked(
    fr.client.from("profiles").update({ suspended_at: null }).eq("user_id", fr.id).select("id"),
    "self reactivation blocked",
  );
  const suspendedPath = `news/security-suspended-${crypto.randomUUID()}.png`;
  files.push(suspendedPath);
  check(
    (
      await fr.client.storage
        .from("media")
        .upload(suspendedPath, bytes, { contentType: "image/png" })
    ).error,
    "suspended upload blocked",
  );
  assert.ifError(
    (await admin.client.from("profiles").update({ suspended_at: null }).eq("user_id", fr.id)).error,
  );
  check((await fr.client.from("news").select("id")).data.length > 0, "administrator reactivation");
  console.log(`PASS ${checks} authenticated security checks`);
} finally {
  if (files.length) assert.ifError((await service.storage.from("media").remove(files)).error);
  for (const t of ["news", "interviews"])
    if (rows[t].length) assert.ifError((await service.from(t).delete().in("id", rows[t])).error);
  for (const id of users) {
    await service.from("editor_permissions").delete().eq("user_id", id);
    await service.from("editor_countries").delete().eq("user_id", id);
    assert.ifError((await service.auth.admin.deleteUser(id)).error);
  }
  console.log("Temporary accounts, content and files cleaned up");
}
