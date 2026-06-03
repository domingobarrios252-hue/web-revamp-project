-- Extend magazines table
ALTER TABLE public.magazines
  ADD COLUMN IF NOT EXISTS edition_number INTEGER,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'spain' CHECK (country IN ('spain','colombia')),
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT false;

-- Create magazine_purchases
CREATE TABLE IF NOT EXISTS public.magazine_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  magazine_id UUID NOT NULL REFERENCES public.magazines(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_id TEXT,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_magazine_purchases_user ON public.magazine_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_magazine_purchases_magazine ON public.magazine_purchases(magazine_id);

GRANT SELECT, INSERT ON public.magazine_purchases TO authenticated;
GRANT ALL ON public.magazine_purchases TO service_role;

ALTER TABLE public.magazine_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases"
  ON public.magazine_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own purchases"
  ON public.magazine_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins delete purchases"
  ON public.magazine_purchases FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));