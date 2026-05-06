import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Loader2, CheckCircle2 } from "lucide-react";

const emailSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .email();

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const successMsg = lang === "en" ? "Thanks for subscribing" : "Gracias por suscribirte";
  const invalidMsg = lang === "en" ? "Please enter a valid email" : "Introduce un email válido";
  const dupMsg = lang === "en" ? "This email is already subscribed" : "Este email ya está suscrito";
  const genericErr = lang === "en" ? "Something went wrong. Try again." : "Algo salió mal. Inténtalo de nuevo.";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setStatus("error");
      setMessage(invalidMsg);
      return;
    }

    setStatus("loading");
    setMessage("");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.toLowerCase(), source });

    if (error) {
      if (error.code === "23505") {
        setStatus("error");
        setMessage(dupMsg);
      } else {
        setStatus("error");
        setMessage(genericErr);
      }
      return;
    }

    setStatus("success");
    setMessage(successMsg);
    setEmail("");
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-md items-center gap-2 border border-[#D4A017]/40 bg-[#D4A017]/10 px-4 py-3 text-sm text-[#F5F5F5]"
      >
        <CheckCircle2 className="h-4 w-4 text-[#D4A017]" aria-hidden="true" />
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
          className="inline-flex items-center justify-center gap-2 border border-[#D4A017] bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#D4A017] transition-colors hover:bg-[#D4A017] hover:text-[#1A1A1A] disabled:opacity-60"
        >
          {status === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t("footer.newsletterCta")}
        </button>
      </div>
      {status === "error" && message && (
        <p role="alert" className="text-xs text-red-400">
          {message}
        </p>
      )}
    </form>
  );
}
