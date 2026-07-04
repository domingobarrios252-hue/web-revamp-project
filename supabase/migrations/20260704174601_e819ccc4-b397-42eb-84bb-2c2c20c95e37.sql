
ALTER TABLE public.tv_settings
  ADD COLUMN IF NOT EXISTS live_is_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status_label text NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS live_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS premium_autoplay boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS premium_interval_ms integer NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS premium_show_arrows boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_show_dots boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscribe_title text DEFAULT '¿No te quieres perder nada?',
  ADD COLUMN IF NOT EXISTS subscribe_text text DEFAULT 'Suscríbete a nuestro canal y activa las notificaciones para no perderte ningún directo.',
  ADD COLUMN IF NOT EXISTS subscribe_button_text text DEFAULT 'Suscribirse al canal',
  ADD COLUMN IF NOT EXISTS subscribe_button_url text;
