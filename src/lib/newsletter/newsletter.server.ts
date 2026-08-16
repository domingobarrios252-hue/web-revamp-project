import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getRequestUrl } from "@tanstack/react-start/server";

/** Caducidad del enlace de confirmación (doble opt-in). */
export const CONFIRM_TTL_HOURS = 48;

export function newToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Comparación en tiempo constante de dos hashes hex. */
export function sameHash(a: string | null | undefined, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Origen público de la petición actual, para construir los enlaces del email. */
export function siteOrigin(): string {
  try {
    const url = getRequestUrl();
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://rollerzone.es";
  }
}

export function confirmUrl(token: string): string {
  return `${siteOrigin()}/newsletter/confirmar?token=${token}`;
}

export function unsubscribeUrl(token: string): string {
  return `${siteOrigin()}/newsletter/baja?token=${token}`;
}

/**
 * Envío del email de confirmación.
 *
 * El envío de correo de la web todavía no está configurado (falta el dominio de
 * envío verificado). Mientras no lo esté, la suscripción se guarda como
 * PENDIENTE y no se envía nada: nunca se muestra el enlace al visitante, para
 * que el doble opt-in siga acreditando que el email es realmente suyo.
 */
export async function sendNewsletterConfirmation(
  email: string,
  token: string,
): Promise<{ sent: boolean; reason?: string }> {
  const endpoint = `${siteOrigin()}/lovable/email/transactional/send`;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { sent: false, reason: "email_not_configured" };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      // Sin seguir redirecciones: si la ruta de correo no existe, el servidor
      // redirige a HTML y no queremos interpretarlo como "enviado".
      redirect: "manual",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        templateName: "newsletter-confirmation",
        recipientEmail: email,
        idempotencyKey: `newsletter-confirm-${hashToken(token).slice(0, 24)}`,
        templateData: { confirmUrl: confirmUrl(token) },
      }),
    });
    const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
    if (!res.ok || !isJson) {
      return { sent: false, reason: "email_not_configured" };
    }
    return { sent: true };
  } catch (err) {
    console.error("Newsletter confirmation email error", err);
    return { sent: false, reason: "email_not_configured" };
  }
}

