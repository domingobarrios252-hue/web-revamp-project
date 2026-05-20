import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Federation = {
  id: string;
  name: string;
  slug: string;
  short_name: string | null;
  type: "nacional" | "autonomica";
  country_code: string;
  region_code: string | null;
  region_name: string | null;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  president: string | null;
  address: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  social: { instagram?: string; facebook?: string; youtube?: string; twitter?: string };
  parent_id: string | null;
  featured: boolean;
  published: boolean;
  founded_year: number | null;
};

export type FederationDocument = {
  id: string;
  federation_id: string;
  title: string;
  doc_type: string;
  file_url: string;
  description: string | null;
  published_at: string;
};

export function useFederations(countryCode: string) {
  const [federations, setFederations] = useState<Federation[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("federations")
      .select("*")
      .eq("country_code", countryCode)
      .eq("published", true)
      .order("type", { ascending: true })
      .order("name")
      .then(({ data }) => {
        if (cancelled) return;
        setFederations((data as unknown as Federation[]) ?? []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);
  return { federations, loading };
}

export function useFederation(slug: string) {
  const [federation, setFederation] = useState<Federation | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("federations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setFederation((data as unknown as Federation) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);
  return { federation, loading };
}

export function useFederationDocuments(federationId: string | undefined) {
  const [docs, setDocs] = useState<FederationDocument[]>([]);
  useEffect(() => {
    if (!federationId) return;
    let cancelled = false;
    supabase
      .from("federation_documents")
      .select("*")
      .eq("federation_id", federationId)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setDocs((data as unknown as FederationDocument[]) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [federationId]);
  return docs;
}

export type FederationNews = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  published_at: string;
};

export function useFederationNews(federationId: string | undefined) {
  const [news, setNews] = useState<FederationNews[]>([]);
  useEffect(() => {
    if (!federationId) return;
    let cancelled = false;
    supabase
      .from("news_federations")
      .select("news(id, slug, title, excerpt, image_url, published_at, published)")
      .eq("federation_id", federationId)
      .limit(12)
      .then(({ data }) => {
        if (cancelled) return;
        const rows = ((data as unknown as Array<{ news: FederationNews & { published: boolean } }>) ?? [])
          .map((r) => r.news)
          .filter((n) => n && (n as unknown as { published: boolean }).published)
          .sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
        setNews(rows as FederationNews[]);
      });
    return () => {
      cancelled = true;
    };
  }, [federationId]);
  return news;
}
