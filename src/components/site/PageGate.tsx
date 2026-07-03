import { type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { usePageStatus, usePageSettings } from "@/lib/pageSettings";
import { ComingSoon } from "./ComingSoon";

interface Props {
  slug: string;
  children: ReactNode;
  title?: string;
}

/**
 * Envoltorio de página. Según el estado configurado en el admin:
 * - active: muestra el contenido normalmente
 * - coming_soon: muestra pantalla "Muy pronto disponible"
 * - hidden: redirige a "/"
 */
export function PageGate({ slug, children, title }: Props) {
  const { loading } = usePageSettings();
  const status = usePageStatus(slug);

  if (loading) return <>{children}</>;
  if (status === "hidden") return <Navigate to="/" />;
  if (status === "coming_soon") return <ComingSoon title={title} />;
  return <>{children}</>;
}
