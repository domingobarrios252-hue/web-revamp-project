import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

function Check({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 flex-none accent-[hsl(var(--gold,45_80%_46%))]"
      />
      <span className="text-muted-foreground">{children}</span>
    </label>
  );
}

export function LegalConsentChecks({
  idPrefix = "signup",
  ageOk,
  termsOk,
  onAgeChange,
  onTermsChange,
}: {
  idPrefix?: string;
  ageOk: boolean;
  termsOk: boolean;
  onAgeChange: (v: boolean) => void;
  onTermsChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <Check id={`${idPrefix}-age14`} checked={ageOk} onChange={onAgeChange}>
        Confirmo que tengo <strong className="text-foreground">14 años o más</strong>.
      </Check>
      <Check id={`${idPrefix}-terms`} checked={termsOk} onChange={onTermsChange}>
        He leído y acepto las{" "}
        <Link
          to="/legal/$slug"
          params={{ slug: "condiciones-uso" }}
          target="_blank"
          className="text-gold underline"
        >
          Condiciones de Uso y Registro
        </Link>{" "}
        y la{" "}
        <Link
          to="/legal/$slug"
          params={{ slug: "privacidad" }}
          target="_blank"
          className="text-gold underline"
        >
          Política de Privacidad
        </Link>
        .
      </Check>
      <p className="text-xs text-muted-foreground">
        No pedimos DNI ni fecha de nacimiento. Solo guardamos la constancia de estas confirmaciones y
        su fecha.
      </p>
    </div>
  );
}
