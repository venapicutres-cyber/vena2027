ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS google_maps_link text;

NOTIFY pgrst, 'reload schema';


ALTER TABLE public.users
DROP COLUMN IF EXISTS password;

DO $$
DECLARE
  table_name text;
  app_tables text[] := ARRAY[
    'add_ons',
    'calendar_events',
    'cards',
    'client_feedback',
    'clients',
    'contracts',
    'galleries',
    'inventory_items',
    'leads',
    'notifications',
    'packages',
    'pockets',
    'profiles',
    'project_add_ons',
    'project_team_assignments',
    'projects',
    'promo_codes',
    'team_members',
    'team_payment_records',
    'team_project_payments',
    'transactions',
    'vendor_portfolios',
    'vendor_profiles',
    'wedding_day_checklists'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH table_name IN ARRAY app_tables LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = table_name
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END;
$$;


-- Data halaman tautan publik (link-in-bio).
-- Aman dijalankan berulang kali.

CREATE TABLE IF NOT EXISTS public.bio_link_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    title TEXT NOT NULL DEFAULT '',
    subtitle TEXT NOT NULL DEFAULT '',
    whatsapp_number TEXT NOT NULL DEFAULT '',
    whatsapp_label TEXT NOT NULL DEFAULT 'WhatsApp',
    avatar_url TEXT NOT NULL DEFAULT '',
    cover_url TEXT NOT NULL DEFAULT '',
    links JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(links) = 'array'),
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bio_link_pages
    ADD COLUMN IF NOT EXISTS whatsapp_label TEXT NOT NULL DEFAULT 'WhatsApp';

CREATE UNIQUE INDEX IF NOT EXISTS bio_link_pages_one_primary
    ON public.bio_link_pages (is_primary)
    WHERE is_primary = true;

ALTER TABLE public.bio_link_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published bio link pages" ON public.bio_link_pages;
CREATE POLICY "Public can view published bio link pages"
    ON public.bio_link_pages FOR SELECT TO anon, authenticated
    USING (is_published = true);

DROP POLICY IF EXISTS "Authenticated users can manage bio link pages" ON public.bio_link_pages;
DROP POLICY IF EXISTS "Administrators can manage bio link pages" ON public.bio_link_pages;
CREATE POLICY "Administrators can manage bio link pages"
    ON public.bio_link_pages FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.users AS app_user
            WHERE lower(app_user.email) = lower(auth.jwt() ->> 'email')
              AND lower(app_user.role) = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users AS app_user
            WHERE lower(app_user.email) = lower(auth.jwt() ->> 'email')
              AND lower(app_user.role) = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION public.set_bio_link_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bio_link_pages_updated_at ON public.bio_link_pages;
CREATE TRIGGER bio_link_pages_updated_at
    BEFORE UPDATE ON public.bio_link_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_bio_link_pages_updated_at();

NOTIFY pgrst, 'reload schema';
ALTER TABLE public.projects
    ALTER COLUMN date DROP NOT NULL;


-- Add PDF metadata support for public pricelist galleries.
-- Safe to run repeatedly.

ALTER TABLE public.galleries
    ADD COLUMN IF NOT EXISTS pdf_url TEXT,
    ADD COLUMN IF NOT EXISTS pdf_name TEXT;

NOTIFY pgrst, 'reload schema';
