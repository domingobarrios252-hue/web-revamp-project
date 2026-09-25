ALTER TABLE public.sponsors
  ADD COLUMN show_on_tv boolean NOT NULL DEFAULT false,
  ADD COLUMN tv_tier text NOT NULL DEFAULT 'colaborador' CHECK (tv_tier IN ('principal','colaborador')),
  ADD COLUMN tv_sort_order integer NOT NULL DEFAULT 0;