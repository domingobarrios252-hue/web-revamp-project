import { useState } from "react";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/security/public-forms.functions";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  NEWSLETTER_CONSENT_TEXT,
  NEWSLETTER_CONSENT_TEXT_EN,
} from "@/lib/newsletter/consent-text";
import { Loader2, CheckCircle2, MailCheck } from "lucide-react";

const emailSchema = z.string().trim().min(1).max(255).email();

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const subscribe = useServerFn(subscribeNewsletter);
  const en = lang === "en";

  const pendingMsg = en
    ? "Almost there: check your inbox and click the confirmation link to activate your subscription."
    : "Ya casi está: revisa tu correo y pulsa el enlace de confirmación para activar la suscripción.";
  const queuedMsg = en
    ? "We have registered your request. Your subscription stays pending until you confirm it from the confirmation email."
    : "Hemos registrado tu solicitud. La suscripción queda pendiente hasta que la confirmes con el email de confirmación.";
  const invalidMsg = en ? "Please enter a valid email" : "Introduce un email válido";
  const consentMsg = en
    ? "You must accept the consent checkbox to subscribe"
    : "Debes marcar la casilla de consentimiento para suscribirte";
  const dupMsg = en ? "This email is already subscribed" : "Este email ya está suscrito";
  const genericErr = en ? "Something went wrong. Try again." : "Algo salió mal. Inténtalo de nuevo.";
  const infoText = en
    ? "One email with the essentials of speed skating. No spam, unsubscribe whenever you want."
    : "Un email con lo esencial del patinaje de velocidad. Sin spam, puedes darte de baja cuando quieras.";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setStatus("error");
      setMessage(invalidMsg);
      return;
    }
    if (!consent) {
      setStatus("error");
      setMessage(consentMsg);
      return;
    }

    setStatus("loading");
    setMessage("");

    let res: { ok: boolean; error?: string; mailSent?: boolean };
    try {
      res = await subscribe({
        data: {
          email: parsed.data.toLowerCase(),
          source,
          consent: true,
          turnstileToken: captchaToken,
        },
      });
    } catch {
      res = { ok: false, error: "generic" };
    }

    if (!res.ok) {
      setStatus("error");
      setMessage(
        res.error === "duplicate" ? dupMsg : res.error && res.error !== "generic" ? res.error : genericErr,
      );
      return;
    }

    setStatus("success");
    setMessage(res.mailSent ? pendingMsg : queuedMsg);
    setEmail("");
    setConsent(false);
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-md items-start gap-2 border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-3 text-sm text-[#F5F5F5]"
      >
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" aria-hidden="true" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-2" noValidate>
      <div className="flex w-full gap-2">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          placeholder="tu@email.com"
          aria-label="Email"
          aria-invalid={status === "error"}
          maxLength={255}
          className="flex-1 border border-[#333] bg-[#0F0F0F] px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#666] focus:border-[#D4A017] focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-[#D4A017] bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#D4A017] transition-colors hover:bg-[#D4A017] hover:text-[#1A1A1A] disabled:opacity-60"
        >
          {status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t("footer.newsletterCta")}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-2 py-1 text-xs leading-relaxed text-[#B5B5B5]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          required
          aria-describedby="newsletter-consent-text"
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#D4A017]"
        />
        <span id="newsletter-consent-text">{en ? NEWSLETTER_CONSENT_TEXT_EN : NEWSLETTER_CONSENT_TEXT}</span>
      </label>

      <p className="text-[11px] leading-relaxed text-[#8A8A8A]">
        {infoText}{" "}
        <Link
          to="/legal/$slug"
          params={{ slug: "privacidad" }}
          className="text-[#D4A017] underline hover:text-[#B8860B]"
        >
          {en ? "Privacy Policy" : "Política de Privacidad"}
        </Link>
        .
      </p>

      <TurnstileWidget onToken={setCaptchaToken} />
      {status === "error" && message && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-400">
          {message}
        </p>
      )}
    </form>

  );
}
