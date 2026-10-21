-- ========================================================
-- VANDIAS PAY — SCRIPT DE SYNCHRONISATION SUPABASE
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- ========================================================

-- 1. Ajout des colonnes manquantes dans la table merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Burkina Faso';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(10);
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS kyc_type VARCHAR(20) DEFAULT 'PARTICULIER';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS kyc_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS active_app_id UUID;

-- 2. Création de la table applications (si elle n'existe pas encore)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_applications_merchant_id ON public.applications(merchant_id);

-- 3. Création de la table webhook_logs (pour l'historique et le replay des webhooks)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id VARCHAR(100) PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    event VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_code INTEGER,
    attempts INTEGER DEFAULT 1,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant_id ON public.webhook_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- 4. Politiques RLS (Row Level Security) permissives pour le Service Role
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'applications_service_full_access'
    ) THEN
        CREATE POLICY applications_service_full_access ON public.applications FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webhook_logs' AND policyname = 'webhook_logs_service_full_access'
    ) THEN
        CREATE POLICY webhook_logs_service_full_access ON public.webhook_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
