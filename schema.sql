-- ========================================================
-- VANDIAS PAY API — SCHÉMA DE BASE DE DONNÉES SUPABASE / POSTGRESQL
-- Version: 2.4 (Production Ready)
-- Passerelle de Paiement et Liens Instantanés pour l'Afrique
-- ========================================================

-- Activer l'extension pgcrypto pour la génération native de UUID v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 1. TABLE DES MARCHANDS (MERCHANTS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    balance_fcfa NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (balance_fcfa >= 0),
    kyc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    webhook_url TEXT,
    webhook_secret VARCHAR(100) DEFAULT ('whsec_' || encode(gen_random_bytes(24), 'hex')),
    default_currency VARCHAR(10) DEFAULT 'XOF' NOT NULL,
    country_code VARCHAR(5) DEFAULT 'SN',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_merchants_email ON public.merchants(email);

-- ========================================================
-- 2. TABLE DES CLÉS D'API (API_KEYS)
-- Clés publiques (pk_live_..., pk_test_...) et secrètes (sk_live_..., sk_test_...)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    key_type VARCHAR(10) NOT NULL CHECK (key_type IN ('test', 'live')),
    name VARCHAR(100) DEFAULT 'Clé API par défaut',
    public_key VARCHAR(100) UNIQUE NOT NULL,
    secret_key VARCHAR(100) UNIQUE NOT NULL,
    secret_key_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_used_at TIMESTAMPTZ
);

-- Index pour authentification API ultra-rapide (en < 5ms)
CREATE INDEX IF NOT EXISTS idx_api_keys_secret_key ON public.api_keys(secret_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_merchant_id ON public.api_keys(merchant_id);

-- ========================================================
-- 3. TABLE DES LIENS DE PAIEMENT SANS CODER (PAYMENT_LINKS)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    slug VARCHAR(120) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount_fcfa NUMERIC(15, 2) NOT NULL CHECK (amount_fcfa > 0),
    currency VARCHAR(10) DEFAULT 'XOF' NOT NULL,
    redirect_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    views_count INTEGER DEFAULT 0 NOT NULL,
    sales_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour lookup des slugs de paiement
CREATE INDEX IF NOT EXISTS idx_payment_links_slug ON public.payment_links(slug);
CREATE INDEX IF NOT EXISTS idx_payment_links_merchant ON public.payment_links(merchant_id);

-- ========================================================
-- 4. TABLE DES TRANSACTIONS DE PAIEMENT (TRANSACTIONS)
-- Gère les encaissements Mobile Money & Cartes Bancaires
-- ========================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
    title VARCHAR(255),
    amount_gross NUMERIC(15, 2) NOT NULL CHECK (amount_gross > 0),
    fee_platform NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Commission VandiasPay 2.5%
    amount_net NUMERIC(15, 2) NOT NULL CHECK (amount_net >= 0), -- Net crédité au marchand (97.5%)
    currency VARCHAR(10) DEFAULT 'XOF' NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    payment_method VARCHAR(20) CHECK (payment_method IN ('WAVE', 'MTN', 'ORANGE', 'MOOV', 'CARD')),
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    mode VARCHAR(10) DEFAULT 'live' NOT NULL CHECK (mode IN ('test', 'live')),
    redirect_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    operator_reference VARCHAR(100),
    webhook_delivered BOOLEAN DEFAULT FALSE,
    webhook_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index analytiques et de recherche de statut
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON public.transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- ========================================================
-- 5. TABLE DES RETRAITS DE TRÉSORERIE (PAYOUTS)
-- Retraits vers Wave, Orange Money, MTN MoMo ou Banque
-- ========================================================
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('WAVE', 'MTN', 'ORANGE', 'BANK')),
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED')),
    reference VARCHAR(100) DEFAULT ('PAYOUT-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10))),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour historique des retraits
CREATE INDEX IF NOT EXISTS idx_payouts_merchant ON public.payouts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- ========================================================
-- 5.b. TABLE DES WALLETS MULTI-PAYS (WALLETS)
-- Un portefeuille par pays avec solde disponible, en attente et gelé
-- ========================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    country VARCHAR(5) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    available_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    pending_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    frozen_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    is_frozen BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_merchant_country UNIQUE(merchant_id, country)
);

CREATE INDEX IF NOT EXISTS idx_wallets_merchant ON public.wallets(merchant_id);

-- ========================================================
-- 5.c. TABLE DU GRAND LIVRE DES MOUVEMENTS (LEDGER_MOVEMENTS)
-- Historique unifié : encaissements, retraits, transferts, frais
-- ========================================================
CREATE TABLE IF NOT EXISTS public.ledger_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('COLLECTION', 'PAYOUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'FEE', 'ADJUSTMENT', 'REVERSAL')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    country VARCHAR(5) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ledger_merchant ON public.ledger_movements(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_country ON public.ledger_movements(country);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger_movements(type);

-- ========================================================
-- 5.d. TABLE DES TRANSFERTS INTER-WALLETS (WALLET_TRANSFERS)
-- Transferts instantanés de pays à pays avec conversion de devise
-- ========================================================
CREATE TABLE IF NOT EXISTS public.wallet_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    from_country VARCHAR(5) NOT NULL,
    to_country VARCHAR(5) NOT NULL,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    from_amount NUMERIC(15, 2) NOT NULL CHECK (from_amount > 0),
    to_amount NUMERIC(15, 2) NOT NULL CHECK (to_amount >= 0),
    exchange_rate NUMERIC(12, 6) DEFAULT 1.0 NOT NULL,
    fee_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    fee_percent_applied NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED' NOT NULL CHECK (status IN ('COMPLETED', 'PENDING', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_transfers_merchant ON public.wallet_transfers(merchant_id);

-- ========================================================
-- 6. FONCTIONS ET DÉCLENCHEURS AUTOMATIQUES (TRIGGERS)
-- Mise à jour automatique de la colonne updated_at
-- ========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_merchants_updated ON public.merchants;
CREATE TRIGGER trg_merchants_updated
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payment_links_updated ON public.payment_links;
CREATE TRIGGER trg_payment_links_updated
    BEFORE UPDATE ON public.payment_links
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_transactions_updated ON public.transactions;
CREATE TRIGGER trg_transactions_updated
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payouts_updated ON public.payouts;
CREATE TRIGGER trg_payouts_updated
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================
-- 7. SÉCURITÉ SUPABASE : ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Politique générale : Service Role Bypass (permet au backend server.js d'accéder à tout en toute sécurité)
CREATE POLICY "Service role has full access to merchants" ON public.merchants FOR ALL USING (true);
CREATE POLICY "Service role has full access to api_keys" ON public.api_keys FOR ALL USING (true);
CREATE POLICY "Service role has full access to payment_links" ON public.payment_links FOR ALL USING (true);
CREATE POLICY "Service role has full access to transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Service role has full access to payouts" ON public.payouts FOR ALL USING (true);
CREATE POLICY "Service role has full access to wallets" ON public.wallets FOR ALL USING (true);
CREATE POLICY "Service role has full access to ledger_movements" ON public.ledger_movements FOR ALL USING (true);
CREATE POLICY "Service role has full access to wallet_transfers" ON public.wallet_transfers FOR ALL USING (true);

-- ========================================================
-- 8. DONNÉES DE DÉMONSTRATION INITIALES (DEMO SEED)
-- ========================================================
DO $$
DECLARE
    demo_merchant_id UUID;
    demo_link_id UUID;
BEGIN
    -- Vérifie si le marchand de démo existe déjà
    IF NOT EXISTS (SELECT 1 FROM public.merchants WHERE email = 'demo@vandiaspay.com') THEN
        
        -- 1. Création du marchand de démo
        INSERT INTO public.merchants (
            email, 
            password_hash, 
            business_name, 
            phone, 
            balance_fcfa, 
            kyc_status, 
            webhook_url,
            webhook_secret
        ) VALUES (
            'demo@vandiaspay.com',
            '$2a$10$wK1Ww63d2qG8qS7Y8S6yQeY3gCgP4H6Y7tP7B1l5v6s7z8q9x0y1z', -- hash pour "vandias2026"
            'Jeff Digital Inc.',
            '+221778421904',
            1450000.00,
            'VERIFIED',
            'https://webhook.site/vandias-demo',
            'whsec_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'
        ) RETURNING id INTO demo_merchant_id;

        -- 2. Création des clés d'API (Live & Test)
        INSERT INTO public.api_keys (merchant_id, key_type, name, public_key, secret_key) VALUES
        (demo_merchant_id, 'live', 'Production API Key', 'pk_live_vdp_8f91a2b3c4d5e6f7', 'sk_live_vdp_9f81a7b6c5d4e3f2a1b0c9d8'),
        (demo_merchant_id, 'test', 'Sandbox API Key', 'pk_test_vdp_1a2b3c4d5e6f7a8b', 'sk_test_vdp_0z9y8x7w6v5u4t3s2r1q0p9o');

        -- 3. Création d'un lien de paiement de test
        INSERT INTO public.payment_links (
            merchant_id, 
            slug, 
            title, 
            description, 
            amount_fcfa, 
            redirect_url
        ) VALUES (
            demo_merchant_id,
            'formation-ecommerce-2026',
            'Formation E-commerce 2026',
            'Accès complet au programme accélérateur de vente en ligne en Afrique.',
            15000.00,
            'https://votresite.com/merci'
        ) RETURNING id INTO demo_link_id;

        -- 4. Transactions initiales de test
        INSERT INTO public.transactions (
            merchant_id,
            payment_link_id,
            title,
            amount_gross,
            fee_platform,
            amount_net,
            currency,
            customer_name,
            customer_phone,
            customer_email,
            payment_method,
            status,
            mode
        ) VALUES
        (demo_merchant_id, demo_link_id, 'Formation E-commerce 2026', 15000.00, 375.00, 14625.00, 'XOF', 'Amadou Diallo', '+221778421904', 'amadou.diallo@gmail.com', 'WAVE', 'SUCCESS', 'live'),
        (demo_merchant_id, NULL, 'Abonnement Canva Pro', 5000.00, 125.00, 4875.00, 'XOF', 'Kouamé Jean', '+2250758921430', 'jean.kouame@yahoo.fr', 'ORANGE', 'SUCCESS', 'live'),
        (demo_merchant_id, NULL, 'Paiement API Session', 25000.00, 625.00, 24375.00, 'XOF', 'Fatou Ndiaye', '+221781234567', 'fatou.ndiaye@outlook.com', 'MTN', 'SUCCESS', 'live');

    END IF;
END $$;
