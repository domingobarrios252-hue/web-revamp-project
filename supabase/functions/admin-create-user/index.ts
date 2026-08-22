import { createClient } from "npm:@supabase/supabase-js@2.103.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  action?: "create" | "delete" | "reset-password";
  email?: string;
  password?: string;
  displayName?: string;
  role?: "admin" | "editor" | "lector";
  sectionId?: string | null;
  countryCode?: string | null;
  userId?: string;
  newPassword?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "Configuración de backend incompleta" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sesión requerida" }, 401);

  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Sesión no válida" }, 401);

  const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: authData.user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) return json({ error: "Solo administradores" }, 403);

  // Segundo factor obligatorio para operaciones críticas (crear/eliminar usuarios y roles).
  // Se evalúa con el token del propio administrador: mfa_satisfied() exige AAL2 cuando
  // la cuenta ya tiene un factor TOTP verificado.
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!anonKey) return json({ error: "Configuración de backend incompleta" }, 500);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: mfaOk, error: mfaError } = await userClient.rpc("admin_mfa_ok");
  if (mfaError || mfaOk !== true) {
    return json(
      {
        error:
          "Se requiere verificación en dos pasos (AAL2) para gestionar usuarios y roles. Verifica tu doble factor en Panel → Seguridad y accesos.",
      },
      403,
    );
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Datos no válidos" }, 400);
  }

  // --- Acción: eliminar usuario ---
  if (payload.action === "delete") {
    const uid = payload.userId;
    if (!uid) return json({ error: "userId requerido" }, 400);
    if (uid === authData.user.id) return json({ error: "No puedes eliminarte a ti mismo" }, 400);
    const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(uid);
    if (delAuthErr) return json({ error: delAuthErr.message }, 400);
    // Las tablas referenciadas cascadean por FK a auth.users; forzamos limpieza defensiva:
    await adminClient.from("user_roles").delete().eq("user_id", uid);
    await adminClient.from("profiles").delete().eq("user_id", uid);
    return json({ ok: true });
  }

  // --- Acción: restablecer contraseña (nunca se muestra la anterior) ---
  if (payload.action === "reset-password") {
    const uid = payload.userId;
    const newPassword = payload.newPassword ?? "";
    if (!uid) return json({ error: "userId requerido" }, 400);
    if (newPassword.length < 10) {
      return json({ error: "La nueva contraseña debe tener al menos 10 caracteres" }, 400);
    }
    const { error: pwError } = await adminClient.auth.admin.updateUserById(uid, {
      password: newPassword,
    });
    if (pwError) return json({ error: pwError.message }, 400);
    await adminClient.from("security_audit_log").insert({
      actor_id: authData.user.id,
      action: "admin_reset_password",
      resource: "auth.users",
      resource_id: uid,
      result: "success",
      details: {},
    });
    return json({ ok: true });
  }

  // --- Acción: reenviar enlace para establecer contraseña ---
  if (payload.action === "invite-link") {
    const targetEmail = payload.email?.trim().toLowerCase();
    if (!targetEmail) return json({ error: "Email requerido" }, 400);
    const { error: linkError } = await adminClient.auth.resetPasswordForEmail(targetEmail);
    if (linkError) return json({ error: linkError.message }, 400);
    await adminClient.from("security_audit_log").insert({
      actor_id: authData.user.id,
      action: "admin_send_password_link",
      resource: "auth.users",
      resource_id: payload.userId ?? null,
      result: "success",
      details: {},
    });
    return json({ ok: true });
  }

  // --- Acción por defecto: crear ---
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";
  const displayName = payload.displayName?.trim() || email?.split("@")[0] || "Usuario";
  const role: "admin" | "editor" | "lector" =
    payload.role === "admin" ? "admin" : payload.role === "lector" ? "lector" : "editor";
  const countryCode = role === "editor" ? (payload.countryCode || null) : null;
  const sectionId = role === "editor" && !countryCode ? payload.sectionId : null;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Email no válido" }, 400);
  const useInvite = password.length === 0;
  if (!useInvite && password.length < 8) {
    return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
  }
  if (role === "editor" && !sectionId && !countryCode) {
    return json({ error: "El editor necesita una sección o un territorio" }, 400);
  }

  // Sin contraseña => invitación por email: el editor establece su propia clave.
  const { data: created, error: createError } = useInvite
    ? await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { display_name: displayName },
      })
    : await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { display_name: displayName },
      });
  if (createError || !created.user) {
    return json({ error: createError?.message ?? "No se pudo crear el usuario" }, 400);
  }

  const userId = created.user.id;
  // El email NO se copia a profiles: queda sólo en auth.users.
  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      user_id: userId,
      display_name: displayName,
      section_id: sectionId,
    },
    { onConflict: "user_id" },
  );

  if (profileError) return json({ error: profileError.message }, 400);

  await adminClient.from("user_roles").delete().eq("user_id", userId);
  const { error: roleInsertError } = await adminClient.from("user_roles").insert({
    user_id: userId,
    role,
  });
  if (roleInsertError) return json({ error: roleInsertError.message }, 400);

  // Territorio del editor (Miami, España, Colombia…): se fija SIEMPRE en servidor.
  if (countryCode) {
    await adminClient.from("editor_countries").delete().eq("user_id", userId);
    const { error: terrError } = await adminClient
      .from("editor_countries")
      .insert({ user_id: userId, country_code: countryCode });
    if (terrError) return json({ error: terrError.message }, 400);

    // Permisos mínimos del editor territorial: crear y editar noticias y entrevistas.
    // Nunca publicar ni eliminar: eso queda reservado al ADMIN.
    await adminClient.from("editor_permissions").delete().eq("user_id", userId);
    const { error: permError } = await adminClient.from("editor_permissions").insert(
      ["noticias", "entrevistas"].map((section) => ({
        user_id: userId,
        section,
        can_create: true,
        can_edit: true,
        can_delete: false,
        can_publish: false,
      })),
    );
    if (permError) return json({ error: permError.message }, 400);
  }

  await adminClient.from("security_audit_log").insert({
    actor_id: authData.user.id,
    action: "admin_create_account",
    resource: "auth.users",
    resource_id: userId,
    result: "success",
    details: { role, country_code: countryCode, section_id: sectionId, invited: useInvite },
  });

  return json({ userId, invited: useInvite });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
