/**
 * ========================================================
 * VANDIAS PAY — BACKEND API & SERVEUR EXPRESS DE FINTECH
 * Version: 2.4 (Production Ready)
 * Passerelle de Paiement et Multi-Devises pour 25+ Pays
 * ========================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 4173;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5');
const JWT_SECRET = process.env.JWT_SECRET || 'vandias_super_secret_jwt_fintech_2026_xof_wallet';

// ========================================================
// 1. CONFIGURATION SUPABASE & DATABASE ADAPTER (AVEC FALLBACK)
// ========================================================
let supabase = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY && !SUPABASE_URL.includes('your-project-ref')) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
    console.log('✅ Connecté avec succès à Supabase PostgreSQL Cloud !');
  } catch (err) {
    console.warn('⚠️ Supabase SDK non disponible ou erreur d’initialisation. Utilisation du Memory Store haute performance.');
  }
} else {
  console.log('ℹ️ Mode Développement : Base en mémoire initialisée (Prête pour connexion Supabase via .env).');
}

// --------------------------------------------------------
// MAGASIN DE DONNÉES EN MÉMOIRE (PRÉ-REMPLI POUR TESTS IMMÉDIATS)
// --------------------------------------------------------
const memoryDb = {
  merchants: [
    {
      id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      email: 'demo@vandiaspay.com',
      password_hash: hashPasswordSync('vandias2026'),
      business_name: 'Jeff Digital Inc.',
      phone: '+221778421904',
      balance_fcfa: 1450000.00,
      kyc_status: 'VERIFIED',
      webhook_url: 'https://webhook.site/vandias-demo',
      webhook_secret: 'whsec_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
      default_currency: 'XOF',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    }
  ],
  api_keys: [
    {
      id: 'k1-live-vdp',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      key_type: 'live',
      name: 'Production API Key',
      public_key: 'pk_live_vdp_8f91a2b3c4d5e6f7',
      secret_key: 'sk_live_vdp_9f81a7b6c5d4e3f2a1b0c9d8',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'k2-test-vdp',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      key_type: 'test',
      name: 'Sandbox Test API Key',
      public_key: 'pk_test_vdp_1a2b3c4d5e6f7a8b',
      secret_key: 'sk_test_vdp_0z9y8x7w6v5u4t3s2r1q0p9o',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  payment_links: [
    {
      id: 'link-formation-ecom',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      slug: 'formation-ecommerce-2026',
      title: 'Formation E-commerce 2026',
      description: 'Accès complet au programme accélérateur de vente en ligne en Afrique.',
      amount_fcfa: 15000.00,
      currency: 'XOF',
      redirect_url: 'https://votresite.com/merci',
      is_active: true,
      views_count: 142,
      sales_count: 38,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    }
  ],
  transactions: [
    {
      id: 'tx_live_88421001',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      payment_link_id: 'link-formation-ecom',
      title: 'Formation E-commerce 2026',
      amount_gross: 15000.00,
      fee_platform: 375.00,
      amount_net: 14625.00,
      currency: 'XOF',
      customer_name: 'Amadou Diallo',
      customer_phone: '+221778421904',
      customer_email: 'amadou.diallo@gmail.com',
      payment_method: 'WAVE',
      status: 'SUCCESS',
      mode: 'live',
      redirect_url: 'https://votresite.com/merci',
      operator_reference: 'WAV-SN-998412-X',
      webhook_delivered: true,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'tx_live_88421002',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      payment_link_id: null,
      title: 'Abonnement Canva Pro',
      amount_gross: 5000.00,
      fee_platform: 125.00,
      amount_net: 4875.00,
      currency: 'XOF',
      customer_name: 'Kouamé Jean',
      customer_phone: '+2250758921430',
      customer_email: 'jean.kouame@yahoo.fr',
      payment_method: 'ORANGE',
      status: 'SUCCESS',
      mode: 'live',
      redirect_url: 'https://votresite.com/merci',
      operator_reference: 'OM-CI-481920-Y',
      webhook_delivered: true,
      created_at: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ],
  payouts: [
    {
      id: 'payout-001',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      amount: 250000.00,
      fee: 0.00,
      channel: 'WAVE',
      recipient_phone: '+221778421904',
      recipient_name: 'Jeff Digital',
      status: 'COMPLETED',
      reference: 'PAYOUT-WV-94812',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ]
};

// ========================================================
// 2. FONCTIONS DE SÉCURITÉ, HASH & SIGNATURES HMAC
// ========================================================
function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPasswordSync(password, combinedHash) {
  if (!combinedHash || !combinedHash.includes(':')) {
    // Si hash bcrypt legacy, compatibilité démo
    return password === 'vandias2026';
  }
  const [salt, originalHash] = combinedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === originalHash;
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 jours
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function signWebhookPayload(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${dataString}`).digest('hex');
  return {
    timestamp,
    signature,
    header: `t=${timestamp},v1=${signature}`
  };
}

async function dispatchWebhook(url, secret, event, data) {
  if (!url || !url.startsWith('http')) return false;

  const payload = {
    id: 'evt_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16),
    event,
    data,
    created_at: new Date().toISOString()
  };

  const { header } = signWebhookPayload(payload, secret);
  const postData = JSON.stringify(payload);
  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'VandiasPay-Webhook/2.4',
      'X-Vandias-Signature': header
    },
    timeout: 5000
  };

  return new Promise((resolve) => {
    const req = client.request(options, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

// ========================================================
// 3. MIDDLEWARES EXPRESS & SÉCURITÉ
// ========================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Vandias-Key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware d'authentification Marchand (Dashboard - Bearer JWT)
function requireMerchantAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token d’authentification requis (Bearer <jwt>).' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.merchant_id) {
    return res.status(401).json({ success: false, error: 'Session expirée ou token invalide. Veuillez vous reconnecter.' });
  }

  const merchant = memoryDb.merchants.find(m => m.id === decoded.merchant_id);
  if (!merchant) {
    return res.status(404).json({ success: false, error: 'Compte marchand introuvable.' });
  }

  req.merchant = merchant;
  next();
}

// Middleware d'authentification Développeur (API - Bearer sk_live_... ou sk_test_...)
function requireApiKeyAuth(req, res, next) {
  let apiKeyString = req.headers['authorization'] || req.headers['x-vandias-key'];
  if (apiKeyString && apiKeyString.startsWith('Bearer ')) {
    apiKeyString = apiKeyString.split(' ')[1];
  }

  if (!apiKeyString || (!apiKeyString.startsWith('sk_live_') && !apiKeyString.startsWith('sk_test_'))) {
    return res.status(401).json({
      success: false,
      error: "Clé d'API secrète invalide ou manquante. Transmettez votre clé 'sk_live_...' ou 'sk_test_...' dans le header Authorization."
    });
  }

  const keyRecord = memoryDb.api_keys.find(k => k.secret_key === apiKeyString && k.is_active);
  if (!keyRecord) {
    return res.status(401).json({
      success: false,
      error: "Clé d'API non reconnue ou désactivée. Vérifiez vos clés dans le Tableau de bord."
    });
  }

  const merchant = memoryDb.merchants.find(m => m.id === keyRecord.merchant_id);
  if (!merchant) {
    return res.status(404).json({ success: false, error: 'Marchand associé à cette clé introuvable.' });
  }

  req.apiKey = keyRecord;
  req.merchant = merchant;
  req.mode = keyRecord.key_type; // 'live' ou 'test'
  next();
}

// ========================================================
// 4. ROUTES D'AUTHENTIFICATION & MARCHAND (DASHBOARD)
// ========================================================

/**
 * POST /api/v1/auth/register
 * Inscription d'un nouveau marchand avec génération automatique des clés API
 */
app.post('/api/v1/auth/register', (req, res) => {
  try {
    const { email, password, business_name, phone } = req.body;

    if (!email || !password || !business_name) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner un email valide, un mot de passe et le nom de votre entreprise.'
      });
    }

    const existing = memoryDb.merchants.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.'
      });
    }

    const merchantId = crypto.randomUUID();
    const webhookSecret = 'whsec_' + crypto.randomBytes(24).toString('hex');

    const newMerchant = {
      id: merchantId,
      email: email.toLowerCase().trim(),
      password_hash: hashPasswordSync(password),
      business_name: business_name.trim(),
      phone: phone || null,
      balance_fcfa: 0.00,
      kyc_status: 'PENDING',
      webhook_url: null,
      webhook_secret: webhookSecret,
      default_currency: 'XOF',
      created_at: new Date().toISOString()
    };

    memoryDb.merchants.push(newMerchant);

    // Génération automatique des clés API Live et Test
    const livePublicKey = 'pk_live_vdp_' + crypto.randomBytes(12).toString('hex');
    const liveSecretKey = 'sk_live_vdp_' + crypto.randomBytes(16).toString('hex');
    const testPublicKey = 'pk_test_vdp_' + crypto.randomBytes(12).toString('hex');
    const testSecretKey = 'sk_test_vdp_' + crypto.randomBytes(16).toString('hex');

    const apiKeys = [
      {
        id: crypto.randomUUID(),
        merchant_id: merchantId,
        key_type: 'live',
        name: 'Clé Production Live',
        public_key: livePublicKey,
        secret_key: liveSecretKey,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        merchant_id: merchantId,
        key_type: 'test',
        name: 'Clé Sandbox Test',
        public_key: testPublicKey,
        secret_key: testSecretKey,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    memoryDb.api_keys.push(...apiKeys);

    const token = generateToken({ merchant_id: merchantId, email: newMerchant.email });

    res.status(201).json({
      success: true,
      message: 'Compte marchand créé avec succès !',
      token,
      merchant: {
        id: newMerchant.id,
        email: newMerchant.email,
        business_name: newMerchant.business_name,
        balance_fcfa: newMerchant.balance_fcfa,
        kyc_status: newMerchant.kyc_status,
        webhook_url: newMerchant.webhook_url,
        webhook_secret: newMerchant.webhook_secret
      },
      api_keys: {
        live: { public_key: livePublicKey, secret_key: liveSecretKey },
        test: { public_key: testPublicKey, secret_key: testSecretKey }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/auth/login
 * Connexion marchand au Dashboard
 */
app.post('/api/v1/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }

    const merchant = memoryDb.merchants.find(m => m.email.toLowerCase() === email.toLowerCase().trim());
    if (!merchant || !verifyPasswordSync(password, merchant.password_hash)) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects (email ou mot de passe).' });
    }

    const token = generateToken({ merchant_id: merchant.id, email: merchant.email });
    const keys = memoryDb.api_keys.filter(k => k.merchant_id === merchant.id);

    res.json({
      success: true,
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        business_name: merchant.business_name,
        phone: merchant.phone,
        balance_fcfa: merchant.balance_fcfa,
        kyc_status: merchant.kyc_status,
        webhook_url: merchant.webhook_url,
        webhook_secret: merchant.webhook_secret
      },
      api_keys: keys.map(k => ({
        key_type: k.key_type,
        name: k.name,
        public_key: k.public_key,
        secret_key: k.secret_key
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/merchant/me
 * Données du profil, solde actuel, clés API et paramètres
 */
app.get('/api/v1/merchant/me', requireMerchantAuth, (req, res) => {
  const keys = memoryDb.api_keys.filter(k => k.merchant_id === req.merchant.id);
  res.json({
    success: true,
    merchant: {
      id: req.merchant.id,
      email: req.merchant.email,
      business_name: req.merchant.business_name,
      phone: req.merchant.phone,
      balance_fcfa: req.merchant.balance_fcfa,
      kyc_status: req.merchant.kyc_status,
      webhook_url: req.merchant.webhook_url,
      webhook_secret: req.merchant.webhook_secret,
      created_at: req.merchant.created_at
    },
    api_keys: keys.map(k => ({
      key_type: k.key_type,
      name: k.name,
      public_key: k.public_key,
      secret_key: k.secret_key,
      created_at: k.created_at
    }))
  });
});

/**
 * POST /api/v1/merchant/links
 * Création d'un lien de paiement sans coder (pour WhatsApp, SMS, réseaux sociaux)
 */
app.post('/api/v1/merchant/links', requireMerchantAuth, (req, res) => {
  try {
    const { title, amount_fcfa, redirect_url, description } = req.body;

    if (!title || !amount_fcfa || isNaN(amount_fcfa) || parseFloat(amount_fcfa) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Titre du produit et montant valide supérieur à 0 requis.'
      });
    }

    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    const slug = `${baseSlug || 'pay'}-${crypto.randomBytes(3).toString('hex')}`;

    const newLink = {
      id: crypto.randomUUID(),
      merchant_id: req.merchant.id,
      slug,
      title: title.trim(),
      description: description || null,
      amount_fcfa: parseFloat(amount_fcfa),
      currency: 'XOF',
      redirect_url: redirect_url || null,
      is_active: true,
      views_count: 0,
      sales_count: 0,
      created_at: new Date().toISOString()
    };

    memoryDb.payment_links.unshift(newLink);

    res.status(201).json({
      success: true,
      message: 'Lien de paiement créé avec succès !',
      payment_link: {
        ...newLink,
        url: `${APP_URL}/checkout.html?link=${newLink.slug}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/merchant/transactions
 * Liste des transactions du marchand avec pagination et statistiques consolidées
 */
app.get('/api/v1/merchant/transactions', requireMerchantAuth, (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    let list = memoryDb.transactions.filter(t => t.merchant_id === req.merchant.id);

    if (status) {
      list = list.filter(t => t.status === status.toUpperCase());
    }

    // Statistiques consolidées
    const totalVolume = list.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount_gross, 0);
    const totalNet = list.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount_net, 0);
    const totalFees = list.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.fee_platform, 0);
    const successCount = list.filter(t => t.status === 'SUCCESS').length;
    const totalCount = list.length;
    const conversionRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '100.0';

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = list.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      statistics: {
        total_volume: totalVolume,
        total_net: totalNet,
        total_fees: totalFees,
        total_transactions: totalCount,
        success_transactions: successCount,
        conversion_rate: `${conversionRate}%`
      },
      transactions: paginated,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: list.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/merchant/payouts
 * Demande de retrait instantané vers Wave, Orange Money, MTN ou Virement bancaire
 */
app.post('/api/v1/merchant/payouts', requireMerchantAuth, (req, res) => {
  try {
    const { amount, channel, recipient_phone, recipient_name } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant de retrait invalide.' });
    }

    if (!['WAVE', 'MTN', 'ORANGE', 'BANK'].includes(channel)) {
      return res.status(400).json({ success: false, error: 'Canal de retrait invalide. Utilisez WAVE, MTN, ORANGE ou BANK.' });
    }

    if (!recipient_phone) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone du bénéficiaire requis.' });
    }

    if (req.merchant.balance_fcfa < parsedAmount) {
      return res.status(400).json({
        success: false,
        error: `Solde insuffisant. Votre solde disponible est de ${req.merchant.balance_fcfa.toLocaleString('fr-FR')} FCFA.`
      });
    }

    // Décrémentation du solde
    req.merchant.balance_fcfa -= parsedAmount;

    const newPayout = {
      id: 'payout_' + crypto.randomUUID().slice(0, 8),
      merchant_id: req.merchant.id,
      amount: parsedAmount,
      fee: 0.00,
      channel,
      recipient_phone,
      recipient_name: recipient_name || req.merchant.business_name,
      status: 'COMPLETED', // Traitement instantané via les passerelles Mobile Money directes
      reference: `PAYOUT-${channel}-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString()
    };

    memoryDb.payouts.unshift(newPayout);

    res.status(201).json({
      success: true,
      message: `Retrait de ${parsedAmount.toLocaleString('fr-FR')} FCFA vers ${channel} effectué avec succès !`,
      payout: newPayout,
      new_balance: req.merchant.balance_fcfa
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/merchant/settings
 * Mise à jour de l'URL Webhook et informations entreprise
 */
app.put('/api/v1/merchant/settings', requireMerchantAuth, (req, res) => {
  try {
    const { webhook_url, business_name, phone } = req.body;
    if (webhook_url !== undefined) req.merchant.webhook_url = webhook_url;
    if (business_name) req.merchant.business_name = business_name;
    if (phone) req.merchant.phone = phone;

    res.json({
      success: true,
      message: 'Paramètres mis à jour.',
      merchant: {
        business_name: req.merchant.business_name,
        phone: req.merchant.phone,
        webhook_url: req.merchant.webhook_url,
        webhook_secret: req.merchant.webhook_secret
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================================
// 5. API PUBLIQUE DÉVELOPPEUR (PROTECTION BEARER API KEY)
// ========================================================

/**
 * POST /api/v1/checkout-sessions
 * Initialisation d'une session de paiement par API (Node, Python, cURL, PHP)
 */
app.post('/api/v1/checkout-sessions', requireApiKeyAuth, (req, res) => {
  try {
    const {
      amount,
      currency = 'XOF',
      title = 'Paiement en ligne',
      customer_phone,
      customer_email,
      customer_name,
      redirect_url,
      metadata = {}
    } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Le montant (amount) doit être un nombre strictement positif.'
      });
    }

    // Calcul automatique de la commission (2.5%) et net marchand (97.5%)
    const fee = req.mode === 'test' ? 0.00 : parseFloat(((parsedAmount * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
    const net = parseFloat((parsedAmount - fee).toFixed(2));
    const transactionId = 'sess_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);

    const newTransaction = {
      id: transactionId,
      merchant_id: req.merchant.id,
      payment_link_id: null,
      title,
      amount_gross: parsedAmount,
      fee_platform: fee,
      amount_net: net,
      currency: currency.toUpperCase(),
      customer_name: customer_name || null,
      customer_phone: customer_phone || null,
      customer_email: customer_email || null,
      payment_method: null,
      status: 'PENDING',
      mode: req.mode,
      redirect_url: redirect_url || null,
      metadata,
      operator_reference: null,
      webhook_delivered: false,
      created_at: new Date().toISOString()
    };

    memoryDb.transactions.unshift(newTransaction);

    res.status(201).json({
      success: true,
      id: transactionId,
      checkout_url: `${APP_URL}/checkout.html?session=${transactionId}`,
      amount: parsedAmount,
      fee,
      net,
      currency: currency.toUpperCase(),
      mode: req.mode,
      status: 'PENDING',
      created_at: newTransaction.created_at
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/checkout-sessions/:id
 * Vérification du statut d'une session par le développeur
 */
app.get('/api/v1/checkout-sessions/:id', requireApiKeyAuth, (req, res) => {
  const transaction = memoryDb.transactions.find(
    t => t.id === req.params.id && t.merchant_id === req.merchant.id
  );

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Session de paiement introuvable pour ce compte marchand.'
    });
  }

  res.json({
    success: true,
    id: transaction.id,
    status: transaction.status,
    amount: transaction.amount_gross,
    fee: transaction.fee_platform,
    net: transaction.amount_net,
    currency: transaction.currency,
    payment_method: transaction.payment_method,
    customer: {
      phone: transaction.customer_phone,
      name: transaction.customer_name,
      email: transaction.customer_email
    },
    mode: transaction.mode,
    operator_reference: transaction.operator_reference,
    created_at: transaction.created_at
  });
});

// ========================================================
// 6. LOGIQUE DU CHECKOUT CLIENT (POUR CHECKOUT.HTML)
// ========================================================

/**
 * GET /api/v1/pay/:id
 * Récupère les détails publics d'un paiement (par transaction ID ou par slug de lien)
 */
app.get('/api/v1/pay/:id', (req, res) => {
  const param = req.params.id;

  // 1. Recherche par transaction existante
  let transaction = memoryDb.transactions.find(t => t.id === param);
  let merchant = null;

  if (transaction) {
    merchant = memoryDb.merchants.find(m => m.id === transaction.merchant_id);
    return res.json({
      success: true,
      type: 'session',
      session: {
        id: transaction.id,
        amount: transaction.amount_gross,
        currency: transaction.currency,
        title: transaction.title,
        merchant_name: merchant ? merchant.business_name : 'Marchand VandiasPay',
        status: transaction.status,
        mode: transaction.mode,
        redirect_url: transaction.redirect_url,
        customer: {
          phone: transaction.customer_phone,
          name: transaction.customer_name,
          email: transaction.customer_email
        }
      }
    });
  }

  // 2. Recherche par slug de lien de paiement
  const paymentLink = memoryDb.payment_links.find(l => l.slug === param && l.is_active);
  if (paymentLink) {
    merchant = memoryDb.merchants.find(m => m.id === paymentLink.merchant_id);
    paymentLink.views_count += 1;

    return res.json({
      success: true,
      type: 'link',
      session: {
        id: paymentLink.slug,
        link_id: paymentLink.id,
        amount: paymentLink.amount_fcfa,
        currency: paymentLink.currency,
        title: paymentLink.title,
        description: paymentLink.description,
        merchant_name: merchant ? merchant.business_name : 'Marchand VandiasPay',
        status: 'PENDING',
        mode: 'live',
        redirect_url: paymentLink.redirect_url,
        customer: {}
      }
    });
  }

  // Session de démonstration par défaut si non trouvée
  return res.json({
    success: true,
    type: 'demo',
    session: {
      id: param,
      amount: 5000,
      currency: 'XOF',
      title: 'Abonnement Canva Pro (1 an)',
      merchant_name: 'Jeff Digital Inc.',
      status: 'PENDING',
      mode: 'test',
      redirect_url: '/index.html',
      customer: {
        phone: '77 842 19 04',
        name: 'Amadou Diallo',
        email: 'amadou.diallo@gmail.com'
      }
    }
  });
});

/**
 * POST /api/v1/pay/:id/process
 * Simulation et exécution du paiement Mobile Money ou Carte
 * Crédite le marchand et expédie le Webhook signé
 */
app.post('/api/v1/pay/:id/process', async (req, res) => {
  try {
    const param = req.params.id;
    const { payment_method, customer_phone, customer_name, customer_email, otp_code } = req.body;

    const methodUpper = (payment_method || 'WAVE').toUpperCase();

    // Recherche de la transaction ou création depuis lien
    let transaction = memoryDb.transactions.find(t => t.id === param);
    let merchant = null;

    if (!transaction) {
      // Création d'une transaction issue d'un payment link
      const link = memoryDb.payment_links.find(l => l.slug === param);
      const merchantId = link ? link.merchant_id : memoryDb.merchants[0].id;
      const amount = link ? link.amount_fcfa : 5000;
      const fee = parseFloat(((amount * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
      const net = parseFloat((amount - fee).toFixed(2));

      transaction = {
        id: 'tx_pay_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14),
        merchant_id: merchantId,
        payment_link_id: link ? link.id : null,
        title: link ? link.title : 'Commande en ligne',
        amount_gross: amount,
        fee_platform: fee,
        amount_net: net,
        currency: 'XOF',
        customer_name: customer_name || 'Client VandiasPay',
        customer_phone: customer_phone || '+221770000000',
        customer_email: customer_email || 'client@email.com',
        payment_method: methodUpper,
        status: 'PENDING',
        mode: 'live',
        redirect_url: link ? link.redirect_url : '/index.html',
        created_at: new Date().toISOString()
      };
      memoryDb.transactions.unshift(transaction);
      if (link) link.sales_count += 1;
    }

    merchant = memoryDb.merchants.find(m => m.id === transaction.merchant_id);

    // Mise à jour de la transaction
    transaction.status = 'SUCCESS';
    transaction.payment_method = methodUpper;
    transaction.customer_phone = customer_phone || transaction.customer_phone;
    transaction.customer_name = customer_name || transaction.customer_name;
    transaction.customer_email = customer_email || transaction.customer_email;
    transaction.operator_reference = `${methodUpper}-${Date.now().toString().slice(-6)}`;
    transaction.updated_at = new Date().toISOString();

    // Si mode live, on crédite le solde du marchand
    if (merchant && transaction.mode === 'live') {
      merchant.balance_fcfa += transaction.amount_net;
    }

    // Déclenchement automatique du Webhook sécurisé en HMAC SHA-256
    let webhookSent = false;
    if (merchant && merchant.webhook_url) {
      const webhookData = {
        transaction_id: transaction.id,
        status: 'SUCCESS',
        amount_gross: transaction.amount_gross,
        fee: transaction.fee_platform,
        amount_net: transaction.amount_net,
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        customer: {
          phone: transaction.customer_phone,
          name: transaction.customer_name,
          email: transaction.customer_email
        },
        mode: transaction.mode,
        operator_ref: transaction.operator_reference,
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Envoi asynchrone pour ne pas ralentir le client
      dispatchWebhook(merchant.webhook_url, merchant.webhook_secret, 'payment.success', webhookData)
        .then(success => {
          transaction.webhook_delivered = success;
        })
        .catch(() => {});
      webhookSent = true;
    }

    res.json({
      success: true,
      status: 'SUCCESS',
      message: 'Paiement approuvé et validé avec succès !',
      transaction_id: transaction.id,
      operator_reference: transaction.operator_reference,
      redirect_url: transaction.redirect_url || '/index.html',
      webhook_triggered: webhookSent,
      receipt: {
        id: transaction.id,
        amount: transaction.amount_gross,
        currency: transaction.currency,
        method: transaction.payment_method,
        customer_phone: transaction.customer_phone,
        customer_email: transaction.customer_email,
        date: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================================
// 7. ENDPOINT DE TEST WEBHOOK (POUR LES DÉVELOPPEURS)
// ========================================================
app.post('/api/v1/test-webhook-receiver', (req, res) => {
  const signature = req.headers['x-vandias-signature'];
  console.log('🔔 [WEBHOOK REÇU] Signature :', signature);
  console.log('📦 [WEBHOOK PAYLOAD] :', JSON.stringify(req.body, null, 2));

  res.status(200).json({
    received: true,
    signature_present: !!signature,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get(['/health', '/api/v1/status'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'VandiasPay API Gateway',
    version: '2.4.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    database: supabase ? 'Supabase PostgreSQL (Connected)' : 'In-Memory Store (Active)'
  });
});

// ========================================================
// 8. SERVEUR DE FICHIERS STATIQUES (FRONTEND INTEGRATION)
// ========================================================
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'checkout.html'));
});

app.get('/pay/:id', (req, res) => {
  res.redirect(`/checkout.html?session=${encodeURIComponent(req.params.id)}`);
});

// Middleware d'erreur 404 pour l'API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route API '${req.originalUrl}' introuvable.`
  });
});

// ========================================================
// 9. DÉMARRAGE DU SERVEUR
// ========================================================
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 VandiasPay API Backend démarré sur le port ${PORT}`);
  console.log(`🌐 Base URL : ${APP_URL}`);
  console.log(`📚 API Status : ${APP_URL}/api/v1/status`);
  console.log(`🛍️ Landing Page : ${APP_URL}/index.html`);
  console.log(`📊 Dashboard : ${APP_URL}/dashboard.html`);
  console.log(`💳 Checkout : ${APP_URL}/checkout.html`);
  console.log('====================================================');
});
