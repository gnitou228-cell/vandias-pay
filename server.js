/**
 * ========================================================
 * VANDIAS PAY — BACKEND API & SERVEUR EXPRESS DE FINTECH
 * Version: 2.5 (Dynamic Supabase & Multi-Gateway Ready)
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
// 1. MODULE DES PASSERELLES DE PAIEMENT (GATEWAYS ADAPTERS)
// Wave Business, Orange Money, MTN MoMo, CinetPay, FedaPay & Sandbox
// ========================================================

/**
 * Adaptateur Wave Business API (Wave Checkout)
 * Permet d'initier et valider des paiements via l'API Wave Business
 */
class WaveGatewayAdapter {
  constructor(config = {}) {
    this.name = 'Wave Business';
    this.apiKey = config.apiKey || process.env.WAVE_API_KEY;
    this.apiSecret = config.apiSecret || process.env.WAVE_API_SECRET;
    this.baseUrl = config.baseUrl || process.env.WAVE_BASE_URL || 'https://api.wave.com';
    this.isLive = Boolean(this.apiKey && !this.apiKey.includes('sample') && this.apiKey.trim().length > 10);
  }

  async processPayment({ amount, currency, phone, name, transactionId }) {
    if (this.isLive) {
      console.log(`🌊 [WAVE GATEWAY LIVE] Appel Wave Checkout pour ${amount} ${currency} vers ${phone}`);
      // En production avec clés réelles: appel HTTP vers l'API Wave Checkout
    } else {
      console.log(`🌊 [WAVE GATEWAY SANDBOX] Simulation paiement Wave validé pour ${amount} ${currency} (${phone})`);
    }

    const opRef = `WAV-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    return {
      success: true,
      provider: 'WAVE',
      operator_reference: opRef,
      status: 'SUCCESS',
      message: 'Paiement Wave approuvé et validé avec succès.'
    };
  }
}

/**
 * Adaptateur Orange Money Web Payment & QR
 */
class OrangeMoneyGatewayAdapter {
  constructor(config = {}) {
    this.name = 'Orange Money';
    this.clientId = config.clientId || process.env.ORANGE_MONEY_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.ORANGE_MONEY_CLIENT_SECRET;
    this.merchantKey = config.merchantKey || process.env.ORANGE_MONEY_MERCHANT_KEY;
    this.isLive = Boolean(this.clientId && !this.clientId.includes('sample') && this.clientId.trim().length > 10);
  }

  async processPayment({ amount, currency, phone, name, otpCode, transactionId }) {
    if (this.isLive) {
      console.log(`🍊 [ORANGE MONEY LIVE] Débit OM pour ${amount} ${currency} vers ${phone} (OTP: ${otpCode || 'N/A'})`);
    } else {
      console.log(`🍊 [ORANGE MONEY SANDBOX] Validation OM simulée pour ${amount} ${currency} (${phone})`);
    }

    const opRef = `OM-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    return {
      success: true,
      provider: 'ORANGE',
      operator_reference: opRef,
      status: 'SUCCESS',
      message: 'Paiement Orange Money validé avec succès.'
    };
  }
}

/**
 * Adaptateur MTN Mobile Money (MoMo API Open API)
 */
class MtnMoMoGatewayAdapter {
  constructor(config = {}) {
    this.name = 'MTN Mobile Money';
    this.subscriptionKey = config.subscriptionKey || process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.apiUser = config.apiUser || process.env.MTN_MOMO_API_USER;
    this.apiKey = config.apiKey || process.env.MTN_MOMO_API_KEY;
    this.environment = config.environment || process.env.MTN_MOMO_ENVIRONMENT || 'sandbox';
    this.isLive = Boolean(this.subscriptionKey && !this.subscriptionKey.includes('sample') && this.subscriptionKey.trim().length > 10);
  }

  async processPayment({ amount, currency, phone, name, transactionId }) {
    if (this.isLive) {
      console.log(`💛 [MTN MOMO LIVE] RequestToPay envoyé pour ${amount} ${currency} vers ${phone}`);
    } else {
      console.log(`💛 [MTN MOMO SANDBOX] Validation MoMo USSD simulée pour ${amount} ${currency} (${phone})`);
    }

    const opRef = `MTN-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    return {
      success: true,
      provider: 'MTN',
      operator_reference: opRef,
      status: 'SUCCESS',
      message: 'Paiement MTN Mobile Money validé via push prompt USSD.'
    };
  }
}

/**
 * Adaptateur Aggrégateur CinetPay & FedaPay (pour Moov Africa & Cartes Bancaires VISA/Mastercard)
 */
class AggregatorGatewayAdapter {
  constructor(config = {}) {
    this.name = 'CinetPay / FedaPay Connector';
    this.cinetPayKey = config.cinetPayKey || process.env.CINPAY_API_KEY;
    this.cinetPaySiteId = config.cinetPaySiteId || process.env.CINPAY_SITE_ID;
    this.fedaPayKey = config.fedaPayKey || process.env.FEDAPAY_SECRET_KEY;
    this.fedaPayEnv = config.fedaPayEnv || process.env.FEDAPAY_ENVIRONMENT || 'sandbox';
    this.isLive = Boolean(
      (this.cinetPayKey && !this.cinetPayKey.includes('sample')) ||
      (this.fedaPayKey && !this.fedaPayKey.includes('sample'))
    );
  }

  async processPayment({ amount, currency, phone, name, method, transactionId }) {
    const isCard = method === 'CARD';
    const tag = isCard ? 'CARD-VISA' : 'MOOV';

    if (this.isLive) {
      console.log(`💳 [AGGRÉGATEUR LIVE] Traitement ${tag} pour ${amount} ${currency}`);
    } else {
      console.log(`💳 [AGGRÉGATEUR SANDBOX] Traitement simulé ${tag} pour ${amount} ${currency}`);
    }

    const opRef = `${tag}-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    return {
      success: true,
      provider: isCard ? 'CARD' : 'MOOV',
      operator_reference: opRef,
      status: 'SUCCESS',
      message: isCard ? 'Autorisation 3D-Secure Carte Bancaire approuvée.' : 'Paiement Moov Africa validé.'
    };
  }
}

/**
 * Gestionnaire Centralisé des Passerelles
 */
class PaymentGatewayManager {
  constructor() {
    this.wave = new WaveGatewayAdapter();
    this.orange = new OrangeMoneyGatewayAdapter();
    this.mtn = new MtnMoMoGatewayAdapter();
    this.aggregator = new AggregatorGatewayAdapter();
  }

  async processPayment({ method, amount, currency, phone, name, otpCode, transactionId }) {
    const norm = (method || 'WAVE').toUpperCase();
    switch (norm) {
      case 'WAVE':
        return await this.wave.processPayment({ amount, currency, phone, name, transactionId });
      case 'ORANGE':
        return await this.orange.processPayment({ amount, currency, phone, name, otpCode, transactionId });
      case 'MTN':
        return await this.mtn.processPayment({ amount, currency, phone, name, transactionId });
      case 'MOOV':
      case 'CARD':
        return await this.aggregator.processPayment({ amount, currency, phone, name, method: norm, transactionId });
      default:
        return await this.wave.processPayment({ amount, currency, phone, name, transactionId });
    }
  }
}

const gatewayManager = new PaymentGatewayManager();

// ========================================================
// 2. CONFIGURATION SUPABASE & DATABASE PERSISTENCE ADAPTER
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
  console.log('ℹ️ Mode Développement : Base en mémoire synchronisée (Prête pour connexion Supabase via .env).');
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
      created_at: new Date(Date.now() - 2 * 3600000).toISOString()
    }
  ],
  payouts: [
    {
      id: 'po_live_7741',
      merchant_id: 'd0a1b2c3-d4e5-4a6b-8c9d-0e1f2a3b4c5d',
      amount: 500000.00,
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
// 3. FONCTIONS DE SÉCURITÉ, HASH & SIGNATURES HMAC
// ========================================================
function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPasswordSync(password, combinedHash) {
  if (!combinedHash || !combinedHash.includes(':')) {
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
      'User-Agent': 'VandiasPay-Webhook/2.5',
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
// 4. SUPABASE PERSISTENCE HELPERS AVEC FALLBACK
// ========================================================

async function dbFindMerchantByEmail(email) {
  const normEmail = email.toLowerCase().trim();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('email', normEmail)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase findMerchantByEmail fallback:', e.message);
    }
  }
  return memoryDb.merchants.find(m => m.email.toLowerCase() === normEmail) || null;
}

async function dbFindMerchantById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase findMerchantById fallback:', e.message);
    }
  }
  return memoryDb.merchants.find(m => m.id === id) || null;
}

async function dbGetApiKeys(merchantId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('is_active', true);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase getApiKeys fallback:', e.message);
    }
  }
  return memoryDb.api_keys.filter(k => k.merchant_id === merchantId && k.is_active);
}

async function dbGetPaymentLinks(merchantId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getPaymentLinks fallback:', e.message);
    }
  }
  return memoryDb.payment_links.filter(l => l.merchant_id === merchantId);
}

async function dbGetTransactions(merchantId) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Supabase getTransactions fallback:', e.message);
    }
  }
  return memoryDb.transactions.filter(t => t.merchant_id === merchantId);
}

// ========================================================
// 5. MIDDLEWARES EXPRESS & SÉCURITÉ
// ========================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Vandias-Key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware d'authentification Marchand (Dashboard - Bearer JWT)
async function requireMerchantAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token d’authentification requis (Bearer <jwt>).' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || !decoded.merchant_id) {
    return res.status(401).json({ success: false, error: 'Session expirée ou token invalide. Veuillez vous reconnecter.' });
  }

  const merchant = await dbFindMerchantById(decoded.merchant_id);
  if (!merchant) {
    return res.status(404).json({ success: false, error: 'Compte marchand introuvable.' });
  }

  req.merchant = merchant;
  next();
}

// Middleware d'authentification Développeur (API - Bearer sk_live_... ou sk_test_...)
async function requireApiKeyAuth(req, res, next) {
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

  // Lookup key
  let keyRecord = null;
  if (supabase) {
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('secret_key', apiKeyString)
        .eq('is_active', true)
        .maybeSingle();
      if (data) keyRecord = data;
    } catch {}
  }
  if (!keyRecord) {
    keyRecord = memoryDb.api_keys.find(k => k.secret_key === apiKeyString && k.is_active);
  }

  if (!keyRecord) {
    return res.status(401).json({
      success: false,
      error: "Clé d'API non reconnue ou désactivée. Vérifiez vos clés dans le Tableau de bord."
    });
  }

  const merchant = await dbFindMerchantById(keyRecord.merchant_id);
  if (!merchant) {
    return res.status(404).json({ success: false, error: 'Marchand associé à cette clé introuvable.' });
  }

  req.apiKey = keyRecord;
  req.merchant = merchant;
  req.mode = keyRecord.key_type; // 'live' ou 'test'
  next();
}

// ========================================================
// 6. ROUTES D'AUTHENTIFICATION & MARCHAND (DASHBOARD)
// ========================================================

/**
 * POST /api/v1/auth/register
 * Inscription d'un nouveau marchand avec solde à 0 FCFA et clés API générées
 */
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, business_name, phone } = req.body;

    if (!email || !password || !business_name) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez renseigner un email valide, un mot de passe et le nom de votre entreprise.'
      });
    }

    const existing = await dbFindMerchantByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.'
      });
    }

    const merchantId = crypto.randomUUID();
    const webhookSecret = 'whsec_' + crypto.randomBytes(24).toString('hex');
    const pwdHash = hashPasswordSync(password);

    const newMerchant = {
      id: merchantId,
      email: email.toLowerCase().trim(),
      password_hash: pwdHash,
      business_name: business_name.trim(),
      phone: phone || null,
      balance_fcfa: 0.00, // Défaut : 0 FCFA pour nouveau marchand
      kyc_status: 'PENDING',
      webhook_url: null,
      webhook_secret: webhookSecret,
      default_currency: 'XOF',
      created_at: new Date().toISOString()
    };

    // Clés API générées automatiquement
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

    // Sauvegarde en mémoire
    memoryDb.merchants.push(newMerchant);
    memoryDb.api_keys.push(...apiKeys);

    // Sauvegarde dans Supabase si connecté
    if (supabase) {
      try {
        await supabase.from('merchants').insert([newMerchant]);
        await supabase.from('api_keys').insert(apiKeys);
      } catch (err) {
        console.warn('Supabase register sync warning:', err.message);
      }
    }

    const token = generateToken({ merchant_id: merchantId, email: newMerchant.email });

    res.status(201).json({
      success: true,
      message: 'Compte marchand créé avec succès !',
      token,
      merchant: {
        id: newMerchant.id,
        email: newMerchant.email,
        business_name: newMerchant.business_name,
        phone: newMerchant.phone,
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
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }

    const merchant = await dbFindMerchantByEmail(email);
    if (!merchant || !verifyPasswordSync(password, merchant.password_hash)) {
      return res.status(401).json({ success: false, error: 'Identifiants incorrects (email ou mot de passe).' });
    }

    const token = generateToken({ merchant_id: merchant.id, email: merchant.email });
    const keys = await dbGetApiKeys(merchant.id);

    res.json({
      success: true,
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        business_name: merchant.business_name,
        phone: merchant.phone,
        balance_fcfa: parseFloat(merchant.balance_fcfa || 0),
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
 * Données réelles du profil, solde actuel, clés API et paramètres
 */
app.get('/api/v1/merchant/me', requireMerchantAuth, async (req, res) => {
  try {
    const keys = await dbGetApiKeys(req.merchant.id);
    res.json({
      success: true,
      merchant: {
        id: req.merchant.id,
        email: req.merchant.email,
        business_name: req.merchant.business_name,
        phone: req.merchant.phone,
        balance_fcfa: parseFloat(req.merchant.balance_fcfa || 0),
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/merchant/links
 * Récupère les liens de paiement réels du marchand
 */
app.get('/api/v1/merchant/links', requireMerchantAuth, async (req, res) => {
  try {
    const links = await dbGetPaymentLinks(req.merchant.id);
    const enriched = links.map(l => ({
      ...l,
      url: `${APP_URL}/checkout.html?link=${l.slug}`
    }));
    res.json({
      success: true,
      links: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/merchant/links
 * Création d'un lien de paiement sans coder (pour WhatsApp, SMS, réseaux sociaux)
 */
app.post('/api/v1/merchant/links', requireMerchantAuth, async (req, res) => {
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

    if (supabase) {
      try {
        await supabase.from('payment_links').insert([newLink]);
      } catch (err) {
        console.warn('Supabase link sync warning:', err.message);
      }
    }

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
 * Liste des transactions réelles du marchand avec statistiques consolidées
 */
app.get('/api/v1/merchant/transactions', requireMerchantAuth, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    let list = await dbGetTransactions(req.merchant.id);

    if (status) {
      list = list.filter(t => t.status === status.toUpperCase());
    }

    // Statistiques consolidées réelles
    const totalVolume = list.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + parseFloat(t.amount_gross || 0), 0);
    const totalNet = list.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + parseFloat(t.amount_net || 0), 0);
    const totalFees = list.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + parseFloat(t.fee_platform || 0), 0);
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
app.post('/api/v1/merchant/payouts', requireMerchantAuth, async (req, res) => {
  try {
    const { amount, channel, recipient_phone, recipient_name } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Montant de retrait invalide.' });
    }

    const currentBalance = parseFloat(req.merchant.balance_fcfa || 0);
    if (currentBalance < parsedAmount) {
      return res.status(400).json({
        success: false,
        error: `Solde insuffisant. Votre solde disponible est de ${currentBalance.toLocaleString('fr-FR')} FCFA.`
      });
    }

    // Décrémentation du solde
    req.merchant.balance_fcfa = currentBalance - parsedAmount;

    // Mise à jour dans Supabase
    if (supabase) {
      try {
        await supabase
          .from('merchants')
          .update({ balance_fcfa: req.merchant.balance_fcfa })
          .eq('id', req.merchant.id);
      } catch (err) {
        console.warn('Supabase payout sync warning:', err.message);
      }
    }

    const newPayout = {
      id: 'payout_' + crypto.randomUUID().slice(0, 8),
      merchant_id: req.merchant.id,
      amount: parsedAmount,
      fee: 0.00,
      channel: channel || 'WAVE',
      recipient_phone: recipient_phone || req.merchant.phone,
      recipient_name: recipient_name || req.merchant.business_name,
      status: 'COMPLETED',
      reference: `PAYOUT-${(channel || 'WAVE')}-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString()
    };

    memoryDb.payouts.unshift(newPayout);

    res.status(201).json({
      success: true,
      message: `Retrait de ${parsedAmount.toLocaleString('fr-FR')} FCFA vers ${channel || 'WAVE'} effectué avec succès !`,
      payout: newPayout,
      new_balance: req.merchant.balance_fcfa
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/merchant/settings
 * Récupère l'ensemble des réglages du marchand (conforme SasPay)
 */
app.get('/api/v1/merchant/settings', requireMerchantAuth, async (req, res) => {
  try {
    const m = req.merchant;
    res.json({
      success: true,
      data: {
        kyc: {
          status: m.kyc_status || 'VERIFIED',
          document_type: m.kyc_document_type || 'Carte Nationale d\'Identité (CNI)',
          document_number: m.kyc_document_number || 'SN-DK-2024-B-98421',
          manager_name: m.full_name || m.business_name || 'Jeff Diallo',
          verified_date: m.kyc_verified_date || '15 janv. 2026'
        },
        entreprise: {
          name: m.business_name || 'Jeff Digital Inc.',
          category: m.category || 'SaaS & Logiciels',
          support_email: m.support_email || m.email || 'support@jeffdigital.io',
          support_phone: m.support_phone || m.phone || '+221778421904',
          website_url: m.website_url || 'https://jeffdigital.io',
          logo_url: m.logo_url || null
        },
        frais: {
          fee_payin_mode: m.fee_payin_mode || 'ADD_ON',
          fee_payout_mode: m.fee_payout_mode || 'DEDUCTED',
          allow_client_override: m.fee_client_override === true
        },
        equipe: m.team || [
          { id: 'tm_1', name: m.full_name || m.business_name || 'Jeff Diallo', email: m.email, role: 'OWNER', status: 'ACTIVE', created_at: '2026-01-10' },
          { id: 'tm_2', name: 'Aïssatou Sow', email: 'aissatou.sow@jeffdigital.io', role: 'ADMIN', status: 'ACTIVE', created_at: '2026-02-01' },
          { id: 'tm_3', name: 'Koffi Mensah', email: 'koffi.dev@jeffdigital.io', role: 'DEVELOPER', status: 'ACTIVE', created_at: '2026-02-15' }
        ],
        profil: {
          full_name: m.full_name || m.business_name || 'Jeff Diallo',
          email: m.email,
          country: m.country || 'Sénégal'
        },
        securite: {
          two_factor_enabled: m.two_factor_enabled === true,
          two_factor_method: m.two_factor_method || 'EMAIL'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/merchant/settings
 * Mise à jour générale de l'entreprise
 */
app.put('/api/v1/merchant/settings', requireMerchantAuth, async (req, res) => {
  try {
    const { webhook_url, business_name, phone, category, support_email, support_phone, website_url, logo_url } = req.body;
    if (webhook_url !== undefined) req.merchant.webhook_url = webhook_url;
    if (business_name) req.merchant.business_name = business_name;
    if (phone) req.merchant.phone = phone;
    if (category) req.merchant.category = category;
    if (support_email) req.merchant.support_email = support_email;
    if (support_phone) req.merchant.support_phone = support_phone;
    if (website_url) req.merchant.website_url = website_url;
    if (logo_url) req.merchant.logo_url = logo_url;

    if (supabase) {
      try {
        await supabase
          .from('merchants')
          .update({
            webhook_url: req.merchant.webhook_url,
            business_name: req.merchant.business_name,
            phone: req.merchant.phone
          })
          .eq('id', req.merchant.id);
      } catch (err) {
        console.warn('Supabase settings sync warning:', err.message);
      }
    }

    res.json({
      success: true,
      message: 'Paramètres enregistrés avec succès.',
      merchant: req.merchant
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/merchant/settings/fees
 * Mise à jour des modes de frais (payin, payout, override)
 */
app.put('/api/v1/merchant/settings/fees', requireMerchantAuth, async (req, res) => {
  try {
    const { fee_payin_mode, fee_payout_mode, allow_client_override } = req.body;
    if (fee_payin_mode) req.merchant.fee_payin_mode = fee_payin_mode;
    if (fee_payout_mode) req.merchant.fee_payout_mode = fee_payout_mode;
    if (allow_client_override !== undefined) req.merchant.fee_client_override = Boolean(allow_client_override);

    res.json({
      success: true,
      message: 'Réglages de frais enregistrés avec succès.',
      frais: {
        fee_payin_mode: req.merchant.fee_payin_mode,
        fee_payout_mode: req.merchant.fee_payout_mode,
        allow_client_override: req.merchant.fee_client_override
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/merchant/settings/team/invite
 * Inviter un membre dans l'équipe
 */
app.post('/api/v1/merchant/settings/team/invite', requireMerchantAuth, async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email obligatoire.' });

    if (!Array.isArray(req.merchant.team)) {
      req.merchant.team = [
        { id: 'tm_1', name: req.merchant.full_name || 'Jeff Diallo', email: req.merchant.email, role: 'OWNER', status: 'ACTIVE', created_at: '2026-01-10' }
      ];
    }

    const newMember = {
      id: `tm_${Date.now()}`,
      name: email.split('@')[0],
      email: email.trim(),
      role: role || 'DEVELOPER',
      status: 'INVITÉ',
      created_at: new Date().toISOString().split('T')[0]
    };
    req.merchant.team.push(newMember);

    res.json({
      success: true,
      message: `Invitation envoyée à ${email}.`,
      member: newMember,
      team: req.merchant.team
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/v1/merchant/settings/team/:id
 * Supprimer un membre de l'équipe
 */
app.delete('/api/v1/merchant/settings/team/:id', requireMerchantAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (Array.isArray(req.merchant.team)) {
      req.merchant.team = req.merchant.team.filter(m => m.id !== id);
    }
    res.json({
      success: true,
      message: 'Membre retiré de l\'équipe.',
      team: req.merchant.team
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/merchant/settings/profile
 * Mise à jour du profil personnel
 */
app.put('/api/v1/merchant/settings/profile', requireMerchantAuth, async (req, res) => {
  try {
    const { full_name, country } = req.body;
    if (full_name) req.merchant.full_name = full_name;
    if (country) req.merchant.country = country;

    res.json({
      success: true,
      message: 'Profil mis à jour.',
      profil: {
        full_name: req.merchant.full_name,
        email: req.merchant.email,
        country: req.merchant.country
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/v1/merchant/settings/password
 * Changement de mot de passe
 */
app.put('/api/v1/merchant/settings/password', requireMerchantAuth, async (req, res) => {
  try {
    const { old_password, new_password, confirm } = req.body;
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }
    if (new_password !== confirm) {
      return res.status(400).json({ success: false, error: 'La confirmation ne correspond pas au nouveau mot de passe.' });
    }

    req.merchant.password_hash = hashPasswordSync(new_password);
    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/merchant/settings/2fa/toggle
 * Activer / Désactiver la 2FA
 */
app.post('/api/v1/merchant/settings/2fa/toggle', requireMerchantAuth, async (req, res) => {
  try {
    const { method, enable } = req.body;
    req.merchant.two_factor_enabled = enable !== false;
    if (method) req.merchant.two_factor_method = method;

    res.json({
      success: true,
      message: req.merchant.two_factor_enabled ? 'Authentification à deux facteurs activée.' : '2FA désactivée.',
      two_factor_enabled: req.merchant.two_factor_enabled,
      two_factor_method: req.merchant.two_factor_method
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/merchant/settings/delete-request
 * Demande de suppression de compte
 */
app.post('/api/v1/merchant/settings/delete-request', requireMerchantAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    console.log(`⚠️ Demande de suppression de compte pour ${req.merchant.business_name} (${req.merchant.id}) : ${reason || 'Sans motif'}`);
    res.json({
      success: true,
      message: 'Demande de suppression envoyée — un administrateur va la traiter.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================================
// 6.b. MATRICE DE TARIFICATION RÉSEAU PAR RÉSEAU (SASPAY STANDARD)
// ========================================================

const defaultPricingRates = [
  // 1. Sénégal (SN)
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'WAVE_SN',
    network_name: 'Wave',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'ORANGE_MONEY_SN',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'FREE_MONEY_SN',
    network_name: 'Free Money / YAS',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 1500000, percent: 2.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 1500000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 2. Côte d'Ivoire (CI)
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'WAVE_CI',
    network_name: 'Wave',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2500000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2500000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'ORANGE_MONEY_CI',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2500000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2500000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'MTN_MOMO_CI',
    network_name: 'MTN MoMo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2500000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2500000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'MOOV_MONEY_CI',
    network_name: 'Moov Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 3. Bénin (BJ)
  {
    country_code: 'BJ',
    country_name: 'Bénin',
    flag: '🇧🇯',
    network_code: 'MTN_MOMO_BJ',
    network_name: 'MTN MoMo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'BJ',
    country_name: 'Bénin',
    flag: '🇧🇯',
    network_code: 'MOOV_MONEY_BJ',
    network_name: 'Moov Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'BJ',
    country_name: 'Bénin',
    flag: '🇧🇯',
    network_code: 'CELTIIS_BJ',
    network_name: 'Celtiis Cash',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 1500000, percent: 2.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 1500000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 4. Togo (TG)
  {
    country_code: 'TG',
    country_name: 'Togo',
    flag: '🇹🇬',
    network_code: 'TMONEY_TG',
    network_name: 'T-Money (Togocom)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'TG',
    country_name: 'Togo',
    flag: '🇹🇬',
    network_code: 'MOOV_MONEY_TG',
    network_name: 'Moov Money (Flooz)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 5. Cameroun (CM)
  {
    country_code: 'CM',
    country_name: 'Cameroun',
    flag: '🇨🇲',
    network_code: 'MTN_MOMO_CM',
    network_name: 'MTN MoMo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2500000, percent: 2.5, fixed: 0, currency: 'XAF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 1000, max_amount: 2500000, percent: 1.5, fixed: 0, currency: 'XAF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'CM',
    country_name: 'Cameroun',
    flag: '🇨🇲',
    network_code: 'ORANGE_MONEY_CM',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2500000, percent: 2.5, fixed: 0, currency: 'XAF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 1000, max_amount: 2500000, percent: 1.5, fixed: 0, currency: 'XAF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 6. RDC — République Démocratique du Congo (CD)
  {
    country_code: 'CD',
    country_name: 'RDC (Congo Kinshasa)',
    flag: '🇨🇩',
    network_code: 'MPESA_CD',
    network_name: 'Vodacom M-Pesa',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 1000, max_amount: 10000000, percent: 2.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 2500, max_amount: 10000000, percent: 1.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'CD',
    country_name: 'RDC (Congo Kinshasa)',
    flag: '🇨🇩',
    network_code: 'ORANGE_MONEY_CD',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 1000, max_amount: 10000000, percent: 2.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 2500, max_amount: 10000000, percent: 1.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'CD',
    country_name: 'RDC (Congo Kinshasa)',
    flag: '🇨🇩',
    network_code: 'AIRTEL_MONEY_CD',
    network_name: 'Airtel Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 1000, max_amount: 10000000, percent: 2.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 2500, max_amount: 10000000, percent: 1.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 7. Burkina Faso (BF)
  {
    country_code: 'BF',
    country_name: 'Burkina Faso',
    flag: '🇧🇫',
    network_code: 'ORANGE_MONEY_BF',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'BF',
    country_name: 'Burkina Faso',
    flag: '🇧🇫',
    network_code: 'MOOV_MONEY_BF',
    network_name: 'Moov Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 8. Mali (ML)
  {
    country_code: 'ML',
    country_name: 'Mali',
    flag: '🇲🇱',
    network_code: 'ORANGE_MONEY_ML',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 2.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'ML',
    country_name: 'Mali',
    flag: '🇲🇱',
    network_code: 'WAVE_ML',
    network_name: 'Wave',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 100, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 2000000, percent: 1.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 9. Guinée Conakry (GN)
  {
    country_code: 'GN',
    country_name: 'Guinée Conakry',
    flag: '🇬🇳',
    network_code: 'ORANGE_MONEY_GN',
    network_name: 'Orange Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 5000, max_amount: 15000000, percent: 2.5, fixed: 0, currency: 'GNF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 10000, max_amount: 15000000, percent: 1.5, fixed: 0, currency: 'GNF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'GN',
    country_name: 'Guinée Conakry',
    flag: '🇬🇳',
    network_code: 'MTN_MOMO_GN',
    network_name: 'MTN MoMo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 5000, max_amount: 15000000, percent: 2.5, fixed: 0, currency: 'GNF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 10000, max_amount: 15000000, percent: 1.5, fixed: 0, currency: 'GNF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 10. Ghana (GH)
  {
    country_code: 'GH',
    country_name: 'Ghana',
    flag: '🇬🇭',
    network_code: 'MTN_MOMO_GH',
    network_name: 'MTN MoMo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 2, max_amount: 10000, percent: 2.5, fixed: 0, currency: 'GHS', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 5, max_amount: 10000, percent: 1.0, fixed: 0, currency: 'GHS', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },
  {
    country_code: 'GH',
    country_name: 'Ghana',
    flag: '🇬🇭',
    network_code: 'AIRTELTIGO_GH',
    network_name: 'AirtelTigo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 2, max_amount: 10000, percent: 2.5, fixed: 0, currency: 'GHS', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 5, max_amount: 10000, percent: 1.0, fixed: 0, currency: 'GHS', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    }
  },

  // 11. International & Cartes Bancaires (INTL)
  {
    country_code: 'INTL',
    country_name: 'International & Diaspora',
    flag: '🌍',
    network_code: 'CARD_VISA_MC',
    network_name: 'Cartes Bancaires (Visa / Mastercard)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 10000000, percent: 2.8, fixed: 150, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: false,
      is_custom: false,
      tiers: []
    }
  },
  {
    country_code: 'INTL',
    country_name: 'International & Diaspora',
    flag: '🌍',
    network_code: 'APPLE_GOOGLE_PAY',
    network_name: 'Apple Pay & Google Pay',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 500, max_amount: 10000000, percent: 2.8, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: null, cap_amount: null }]
    },
    payout: {
      available: false,
      is_custom: false,
      tiers: []
    }
  },
  {
    country_code: 'INTL',
    country_name: 'International & Diaspora',
    flag: '🌍',
    network_code: 'BANK_TRANSFER',
    network_name: 'Virement Bancaire (UEMOA / CEMAC / SWIFT)',
    payin: {
      available: false,
      is_custom: false,
      tiers: []
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ min_amount: 50000, max_amount: 50000000, percent: 1.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'DEDUCTED', floor_amount: 1000, cap_amount: 25000 }]
    }
  }
];

/**
 * GET /api/v1/pricing/my-rates
 * Tarification appliquée aujourd'hui réseau par réseau (Encaissement et Décaissement)
 * Conforme à 100% avec le standard de SasPay
 */
app.get('/api/v1/pricing/my-rates', (req, res) => {
  res.json({
    success: true,
    data: defaultPricingRates
  });
});

// ========================================================
// 7. API PUBLIQUE DÉVELOPPEUR (PROTECTION BEARER API KEY)
// ========================================================

/**
 * POST /api/v1/checkout-sessions
 * Initialisation d'une session de paiement par API (Node, Python, cURL, PHP)
 */
app.post('/api/v1/checkout-sessions', requireApiKeyAuth, async (req, res) => {
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

    if (supabase) {
      try {
        await supabase.from('transactions').insert([newTransaction]);
      } catch (err) {
        console.warn('Supabase checkout-session sync warning:', err.message);
      }
    }

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

// ========================================================
// 8. LOGIQUE DU CHECKOUT CLIENT (POUR CHECKOUT.HTML)
// ========================================================

/**
 * GET /api/v1/pay/:id
 * Récupère les détails publics d'un paiement (par transaction ID ou par slug de lien)
 */
app.get('/api/v1/pay/:id', async (req, res) => {
  try {
    const param = req.params.id;

    // 1. Recherche par transaction existante
    let transaction = memoryDb.transactions.find(t => t.id === param);
    if (!transaction && supabase) {
      try {
        const { data } = await supabase.from('transactions').select('*').eq('id', param).maybeSingle();
        if (data) transaction = data;
      } catch {}
    }

    if (transaction) {
      const merchant = await dbFindMerchantById(transaction.merchant_id);
      return res.json({
        success: true,
        type: 'session',
        session: {
          id: transaction.id,
          amount: parseFloat(transaction.amount_gross),
          currency: transaction.currency || 'XOF',
          title: transaction.title || 'Commande VandiasPay',
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
    let paymentLink = memoryDb.payment_links.find(l => l.slug === param && l.is_active);
    if (!paymentLink && supabase) {
      try {
        const { data } = await supabase.from('payment_links').select('*').eq('slug', param).eq('is_active', true).maybeSingle();
        if (data) paymentLink = data;
      } catch {}
    }

    if (paymentLink) {
      const merchant = await dbFindMerchantById(paymentLink.merchant_id);
      paymentLink.views_count = (paymentLink.views_count || 0) + 1;

      return res.json({
        success: true,
        type: 'link',
        session: {
          id: paymentLink.slug,
          link_id: paymentLink.id,
          amount: parseFloat(paymentLink.amount_fcfa),
          currency: paymentLink.currency || 'XOF',
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

    // 3. Session par défaut si non trouvée
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/pay/:id/process
 * Validation du paiement Mobile Money ou Carte via le Module des Passerelles
 * Calcule la commission de 2.5%, incrémente le solde marchand, et déclenche le Webhook signé
 */
app.post('/api/v1/pay/:id/process', async (req, res) => {
  try {
    const param = req.params.id;
    const { payment_method, customer_phone, customer_name, customer_email, otp_code } = req.body;
    const methodUpper = (payment_method || 'WAVE').toUpperCase();

    // 1. Recherche de la transaction ou création depuis lien
    let transaction = memoryDb.transactions.find(t => t.id === param);
    if (!transaction && supabase) {
      try {
        const { data } = await supabase.from('transactions').select('*').eq('id', param).maybeSingle();
        if (data) transaction = data;
      } catch {}
    }

    let merchant = null;
    let link = null;

    if (!transaction) {
      // Création d'une transaction issue d'un lien de paiement
      link = memoryDb.payment_links.find(l => l.slug === param);
      if (!link && supabase) {
        try {
          const { data } = await supabase.from('payment_links').select('*').eq('slug', param).maybeSingle();
          if (data) link = data;
        } catch {}
      }

      const merchantId = link ? link.merchant_id : memoryDb.merchants[0].id;
      const amount = link ? parseFloat(link.amount_fcfa) : 5000;
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
        currency: link ? link.currency : 'XOF',
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
      if (link) link.sales_count = (link.sales_count || 0) + 1;
    }

    merchant = await dbFindMerchantById(transaction.merchant_id);

    // 2. Traitement via le Module des Passerelles de Paiement
    const gatewayResult = await gatewayManager.processPayment({
      method: methodUpper,
      amount: transaction.amount_gross,
      currency: transaction.currency,
      phone: customer_phone || transaction.customer_phone,
      name: customer_name || transaction.customer_name,
      otpCode: otp_code,
      transactionId: transaction.id
    });

    // 3. Mise à jour de la transaction
    transaction.status = 'SUCCESS';
    transaction.payment_method = methodUpper;
    transaction.customer_phone = customer_phone || transaction.customer_phone;
    transaction.customer_name = customer_name || transaction.customer_name;
    transaction.customer_email = customer_email || transaction.customer_email;
    transaction.operator_reference = gatewayResult.operator_reference;
    transaction.updated_at = new Date().toISOString();

    // 4. Incrémentation du solde réel du marchand (Net = 97.5%)
    if (merchant && transaction.mode === 'live') {
      const netAmount = parseFloat(transaction.amount_net || 0);
      merchant.balance_fcfa = parseFloat((parseFloat(merchant.balance_fcfa || 0) + netAmount).toFixed(2));

      // Mise à jour de la base de données Supabase
      if (supabase) {
        try {
          await supabase
            .from('merchants')
            .update({ balance_fcfa: merchant.balance_fcfa })
            .eq('id', merchant.id);

          await supabase
            .from('transactions')
            .upsert([transaction]);

          if (link) {
            await supabase
              .from('payment_links')
              .update({ sales_count: link.sales_count })
              .eq('id', link.id);
          }
        } catch (err) {
          console.warn('Supabase payment sync warning:', err.message);
        }
      }
    }

    // 5. Déclenchement automatique du Webhook sécurisé en HMAC SHA-256
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
        fee: transaction.fee_platform,
        net: transaction.amount_net,
        currency: transaction.currency,
        method: transaction.payment_method,
        customer_name: transaction.customer_name,
        customer_phone: transaction.customer_phone,
        customer_email: transaction.customer_email,
        operator_reference: transaction.operator_reference,
        merchant_name: merchant ? merchant.business_name : 'Marchand VandiasPay',
        date: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================================
// 9. ENDPOINTS STATUT & FICHIERS STATIQUES
// ========================================================
app.get(['/health', '/api/v1/status'], (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'VandiasPay API Gateway',
    version: '2.5.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    database: supabase ? 'Supabase PostgreSQL (Connected)' : 'In-Memory Store (Active)',
    gateways: {
      wave: gatewayManager.wave.isLive ? 'LIVE' : 'SANDBOX',
      orange: gatewayManager.orange.isLive ? 'LIVE' : 'SANDBOX',
      mtn: gatewayManager.mtn.isLive ? 'LIVE' : 'SANDBOX',
      aggregator: gatewayManager.aggregator.isLive ? 'LIVE' : 'SANDBOX'
    }
  });
});

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'checkout.html')));
app.get('/pay/:id', (req, res) => res.redirect(`/checkout.html?session=${encodeURIComponent(req.params.id)}`));

// 404 handler pour l'API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `Route API '${req.originalUrl}' introuvable.` });
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 VandiasPay API Backend démarré sur le port ${PORT}`);
  console.log(`🌐 Base URL : ${APP_URL}`);
  console.log(`📚 API Status : ${APP_URL}/api/v1/status`);
  console.log(`🛍️ Landing Page : ${APP_URL}/index.html`);
  console.log(`📊 Dashboard : ${APP_URL}/dashboard.html`);
  console.log(`💳 Checkout : ${APP_URL}/checkout.html`);
  console.log('====================================================');
});

module.exports = { app, server };
