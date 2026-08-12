export type Collaboration = {
  id: string;
  slug: string;
  title: string;
  year: number;
  entity: string;
  category: string;
  type: string;
  short_description: string;
  content_md: string;
  project_md: string;
  objective_md: string;
  collaboration_md: string;
  result_md: string;
  cover_url: string;
  entity_logo_url: string;
  start_date: string | null;
  end_date: string | null;
  gallery: string[];
  video_url: string;
  flipbook_url: string;
  pdf_url: string;
  external_url: string;
  related_news: string[];
  status: string;
  featured_home: boolean;
  sort_order: number;
  published_at: string | null;
  seo_title: string;
  seo_description: string;
};

export const COLLAB_CATEGORIES = [
  { value: "federaciones", label: "Federaciones" },
  { value: "instituciones", label: "Instituciones" },
  { value: "clubes", label: "Clubes" },
  { value: "marcas", label: "Marcas" },
  { value: "editorial", label: "Proyectos editoriales" },
] as const;

export const COLLAB_TYPES = [
  { value: "colaboracion_oficial", label: "Colaboración oficial" },
  { value: "convenio", label: "Convenio" },
  { value: "colaboracion", label: "Colaborador" },
  { value: "partner", label: "Partner" },
  { value: "patrocinador", label: "Patrocinador" },
  { value: "proyecto_editorial", label: "Proyecto editorial" },
  { value: "proyecto_solidario", label: "Proyecto solidario" },
  { value: "colaboracion_institucional", label: "Colaboración institucional" },
] as const;

export const COLLAB_STATUS = [
  { value: "published", label: "Publicada" },
  { value: "draft", label: "Borrador" },
  { value: "hidden", label: "Oculta" },
] as const;

export function categoryLabel(value: string) {
  return COLLAB_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function typeLabel(value: string) {
  return COLLAB_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeCollaboration(row: Record<string, unknown>): Collaboration {
  const gallery = Array.isArray(row.gallery) ? (row.gallery as string[]) : [];
  const relatedNews = Array.isArray(row.related_news) ? (row.related_news as string[]) : [];
  return { ...(row as unknown as Collaboration), gallery, related_news: relatedNews };
}
