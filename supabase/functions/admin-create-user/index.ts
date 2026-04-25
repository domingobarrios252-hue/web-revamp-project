import { createClient } from "npm:@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = {
  email?: string;
  password?: string;
  displayName?: string;
  role?: "admin" | "editor";
  sectionId?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Configuración de backend incompleta" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sesión requerida" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Sesión no válida" }, 401);

  const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: authData.user.id,
    _role: "admin",
  });
  if (roleError || !isAdmin) return json({ error: "Solo administradores" }, 403);

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Datos no válidos" }, 400);
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password ?? "";
  const displayName = payload.displayName?.trim() || email?.split("@")[0] || "Usuario";
  const role = payload.role === "admin" ? "admin" : "editor";
  const sectionId = role === "editor" ? payload.sectionId : null;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Email no válido" }, 400);
  if (password.length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
  if (role === "editor" && !sectionId) return json({ error: "El editor necesita una sección" }, 400);

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { display_name: displayName },
  });
  if (createError || !created.user) {
    return json({ error: createError?.message ?? "No se pudo crear el usuario" }, 400);
  }

  const userId = created.user.id;
  const { error: profileError } = await adminClient.from("profiles").upsert(
    {
      user_id: userId,
      display_name: displayName,
      email,
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

  return json({ userId });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
