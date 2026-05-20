import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EntityKind = "clubs" | "skaters" | "federations";

const CONFIG: Record<EntityKind, { table: string; labelCol: string; secondaryCol?: string }> = {
  clubs: { table: "clubs", labelCol: "name", secondaryCol: "city" },
  skaters: { table: "skaters", labelCol: "full_name", secondaryCol: "category" },
  federations: { table: "federations", labelCol: "name", secondaryCol: "region_name" },
};

type Option = { id: string; label: string; secondary?: string | null };

export function EntityRelationsField({
  kind,
  country,
  value,
  onChange,
  label,
}: {
  kind: EntityKind;
  country?: string;
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const cfg = CONFIG[kind];
  const [options, setOptions] = useState<Option[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const supa = supabase as unknown as {
      from: (t: string) => {
        select: (s: string) => {
          eq: (c: string, v: string) => { order: (c: string) => Promise<{ data: Record<string, unknown>[] | null }> };
          order: (c: string) => Promise<{ data: Record<string, unknown>[] | null }>;
        };
      };
    };
    const cols = `id, ${cfg.labelCol}${cfg.secondaryCol ? `, ${cfg.secondaryCol}` : ""}, country_code`;
    const q = supa.from(cfg.table).select(cols);
    const promise = country ? q.eq("country_code", country).order(cfg.labelCol) : q.order(cfg.labelCol);
    promise.then(({ data }) => {
      setOptions(
        (data ?? []).map((row) => ({
          id: row.id as string,
          label: row[cfg.labelCol] as string,
          secondary: cfg.secondaryCol ? ((row[cfg.secondaryCol] as string) ?? null) : null,
        })),
      );
    });
  }, [kind, country, cfg.table, cfg.labelCol, cfg.secondaryCol]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(s) || (o.secondary ?? "").toLowerCase().includes(s),
    );
  }, [options, search]);

  const selectedSet = new Set(value);
  const selected = options.filter((o) => selectedSet.has(o.id));

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="border border-border bg-background p-3">
      <div className="font-condensed mb-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>{label ?? kind}</span>
        <span className="text-gold">{selected.length} seleccionados</span>
      </div>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className="font-condensed inline-flex items-center gap-1 border border-gold bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/20"
            >
              {o.label} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="w-full border border-border bg-surface py-1.5 pl-7 pr-2 text-xs"
        />
      </div>
      <div className="max-h-48 overflow-y-auto border border-border/50">
        {filtered.length === 0 ? (
          <div className="p-2 text-[11px] text-muted-foreground">Sin resultados</div>
        ) : (
          filtered.slice(0, 200).map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-2 border-b border-border/30 px-2 py-1.5 text-xs last:border-0 hover:bg-surface"
            >
              <input
                type="checkbox"
                checked={selectedSet.has(o.id)}
                onChange={() => toggle(o.id)}
                className="h-3.5 w-3.5 accent-[oklch(0.78_0.16_70)]"
              />
              <span className="truncate">{o.label}</span>
              {o.secondary && <span className="text-[10px] text-muted-foreground truncate">· {o.secondary}</span>}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------------

const LINK: Record<
  "news" | "events",
  { clubs: { table: string; fk: string }; skaters: { table: string; fk: string }; federations: { table: string; fk: string } }
> = {
  news: {
    clubs: { table: "news_clubs", fk: "news_id" },
    skaters: { table: "news_skaters", fk: "news_id" },
    federations: { table: "news_federations", fk: "news_id" },
  },
  events: {
    clubs: { table: "event_clubs", fk: "event_id" },
    skaters: { table: "event_skaters", fk: "event_id" },
    federations: { table: "event_federations", fk: "event_id" },
  },
};

export async function loadRelations(
  parentKind: "news" | "events",
  childKind: EntityKind,
  parentId: string,
): Promise<string[]> {
  const link = LINK[parentKind][childKind];
  const childCol = childKind === "clubs" ? "club_id" : childKind === "skaters" ? "skater_id" : "federation_id";
  const supa = supabase as unknown as {
    from: (t: string) => {
      select: (s: string) => { eq: (c: string, v: string) => Promise<{ data: Record<string, unknown>[] | null }> };
    };
  };
  const { data } = await supa.from(link.table).select(childCol).eq(link.fk, parentId);
  return (data ?? []).map((r) => r[childCol] as string);
}

export async function saveRelations(
  parentKind: "news" | "events",
  childKind: EntityKind,
  parentId: string,
  newIds: string[],
): Promise<void> {
  const link = LINK[parentKind][childKind];
  const childCol = childKind === "clubs" ? "club_id" : childKind === "skaters" ? "skater_id" : "federation_id";
  const current = await loadRelations(parentKind, childKind, parentId);
  const toAdd = newIds.filter((id) => !current.includes(id));
  const toRemove = current.filter((id) => !newIds.includes(id));
  const supa = supabase as unknown as {
    from: (t: string) => {
      insert: (rows: Record<string, string>[]) => Promise<{ error: { message: string } | null }>;
      delete: () => {
        eq: (c: string, v: string) => { in: (c: string, v: string[]) => Promise<{ error: { message: string } | null }> };
      };
    };
  };
  if (toAdd.length) {
    await supa.from(link.table).insert(toAdd.map((id) => ({ [link.fk]: parentId, [childCol]: id })));
  }
  if (toRemove.length) {
    await supa.from(link.table).delete().eq(link.fk, parentId).in(childCol, toRemove);
  }
}
