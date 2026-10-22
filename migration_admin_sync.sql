-- ========================================================
-- VANDIAS PAY — MIGRATION SYNCHRONISATION ADMIN ⇄ MARCHAND
-- Script SQL pour Supabase (Dashboard > SQL Editor > New query > Run)
-- Version: 3.0 (Temps Réel, Grand Livre, Audit & Paramètres)
-- ========================================================

-- 1. Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Colonnes administratives dans la table MERCHANTS
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS custom_fee_percent NUMERIC(5, 2);
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'merchant' NOT NULL;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_merchants_is_suspended ON public.merchants(is_suspended);
CREATE INDEX IF NOT EXISTS idx_merchants_role ON public.merchants(role);

-- 3. Mise à jour de l'administrateur principal
UPDATE public.merchants 
SET is_admin = TRUE, role = 'SUPER_ADMIN' 
WHERE email = 'gnitessowedeou@gmail.com';

-- 4. TABLE DES ÉVÉNEMENTS TEMPS RÉEL (EVENTS)
-- Stocke les notifications pour affichage cloche et replay si hors-ligne
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target VARCHAR(100) NOT NULL, -- 'all', 'admin', ou 'merchant:<uuid>'
    event_type VARCHAR(100) NOT NULL, -- 'payment.succeeded', 'payout.approved', etc.
    payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_target ON public.events(target);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_is_read ON public.events(is_read);

-- 5. TABLE DU JOURNAL D'AUDIT ADMINISTRATEUR (AUDIT_LOGS)
-- Immuable et infalsifiable
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(100),
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'MERCHANT_SUSPENDED', 'PAYOUT_APPROVED', etc.
    target_type VARCHAR(50), -- 'MERCHANT', 'TRANSACTION', 'PAYOUT', 'SETTINGS'
    target_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);

-- 6. TABLE DES PARAMÈTRES GLOBAUX PLATEFORME (PLATFORM_SETTINGS)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'global',
    platform_fee_percent NUMERIC(5, 2) DEFAULT 2.50 NOT NULL,
    maintenance_mode BOOLEAN DEFAULT FALSE NOT NULL,
    maintenance_message TEXT DEFAULT 'VandiasPay est en maintenance programmée. Les paiements reprendront très bientôt.',
    announcement JSONB DEFAULT '{"active": false, "message": "", "type": "info"}'::jsonb NOT NULL,
    signups_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    payouts_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    min_payout_amount NUMERIC(15, 2) DEFAULT 500 NOT NULL,
    max_transaction_amount NUMERIC(15, 2) DEFAULT 5000000 NOT NULL,
    disabled_payment_methods JSONB DEFAULT '[]'::jsonb NOT NULL,
    disabled_countries JSONB DEFAULT '[]'::jsonb NOT NULL,
    support_email VARCHAR(255) DEFAULT 'support@vandiaspay.com' NOT NULL,
    support_whatsapp VARCHAR(100) DEFAULT '' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insertion de la configuration initiale si non existante
INSERT INTO public.platform_settings (id, platform_fee_percent, maintenance_mode, announcement)
VALUES ('global', 2.50, FALSE, '{"active": false, "message": "", "type": "info"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 7. Ajout des colonnes de gel et de solde bloqué dans WALLETS
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS held_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL;

-- 8. Ajout des colonnes d'approbation dans PAYOUTS
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS decided_by VARCHAR(255);
ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

-- 9. RLS (Row Level Security) permissif pour le backend Service Role
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_service_full') THEN
        CREATE POLICY events_service_full ON public.events FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_service_full') THEN
        CREATE POLICY audit_logs_service_full ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'platform_settings' AND policyname = 'platform_settings_service_full') THEN
        CREATE POLICY platform_settings_service_full ON public.platform_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
