// Cliente mínimo de la GA4 Data API (solo servidor). La clave de la cuenta de
// servicio se lee de process.env y nunca sale del servidor.
type SA = { client_email: string; private_key: string; token_uri?: string };

let cached: { token: string; exp: number } | null = null;

function b64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function readSA(): SA {
  const raw = process.env["GA4_SERVICE_ACCOUNT_JSON"];
  if (!raw) throw new Error("GA4_NOT_CONFIGURED");
  const sa = JSON.parse(raw) as SA;
  if (!sa.client_email || !sa.private_key) throw new Error("GA4_BAD_CREDENTIALS");
  return sa;
}

export function ga4Configured(): boolean {
  return !!process.env["GA4_SERVICE_ACCOUNT_JSON"] && !!process.env["GA4_PROPERTY_ID"];
}

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const sa = readSA();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`));
  const jwt = `${header}.${claim}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`GA4 token failed [${res.status}]: ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

export type GaRow = { d: string[]; m: number[] };

async function call(kind: "runReport" | "runRealtimeReport", body: unknown): Promise<GaRow[]> {
  const id = process.env["GA4_PROPERTY_ID"];
  if (!id) throw new Error("GA4_NOT_CONFIGURED");
  const token = await accessToken();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${id}:${kind}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GA4 ${kind} failed [${res.status}]: ${await res.text()}`);
  const j = (await res.json()) as {
    rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
  };
  return (j.rows ?? []).map((r) => ({
    d: (r.dimensionValues ?? []).map((v) => v.value),
    m: (r.metricValues ?? []).map((v) => Number(v.value) || 0),
  }));
}

export const runReport = (body: unknown) => call("runReport", body);
export const runRealtime = (body: unknown) => call("runRealtimeReport", body);
