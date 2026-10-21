/**
 * ========================================================
 * VANDIAS PAY — STORE ADMINISTRATEUR (PERSISTANT)
 * Paramètres plateforme, contrôles par marchand, journal d'audit.
 *
 * Stocké dans .vandias-data/admin-store.json : le dossier commence par
 * un point, donc express.static (dotfiles: 'ignore') ne le sert jamais.
 * ========================================================
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '.vandias-data');
const STORE_FILE = path.join(DATA_DIR, 'admin-store.json');
const MAX_AUDIT = 1000;

const DEFAULT_SETTINGS = {
  platform_fee_percent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5'),
  maintenance_mode: false,
  maintenance_message: 'VandiasPay est en maintenance programmée. Les paiements reprendront très bientôt.',
  announcement: { active: false, message: '', type: 'info' },
  signups_enabled: true,
  payouts_enabled: true,
  min_payout_amount: 500,
  max_transaction_amount: 5000000,
  disabled_payment_methods: [],
  disabled_countries: [],
  support_email: 'support@vandiaspay.com',
  support_whatsapp: ''
};

let store = {
  settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
  merchant_overrides: {},
  link_overrides: {},
  audit_logs: []
};

function load() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      store.settings = { ...store.settings, ...(raw.settings || {}) };
      store.merchant_overrides = raw.merchant_overrides || {};
      store.link_overrides = raw.link_overrides || {};
      store.audit_logs = Array.isArray(raw.audit_logs) ? raw.audit_logs : [];
    }
  } catch (e) {
    console.warn('⚠️ Admin store illisible, valeurs par défaut utilisées:', e.message);
  }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
    } catch (e) {
      // Ex : système de fichiers en lecture seule (Vercel). Les données restent en mémoire.
      console.warn('⚠️ Sauvegarde admin store impossible:', e.message);
    }
  }, 150);
}

load();

// ---------- Paramètres plateforme ----------
const toBool = v => v === true || v === 'true';
const toNum = (v, min, max) => {
  const n = parseFloat(v);
  if (isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
};
const toUpperList = v => (Array.isArray(v) ? v : String(v || '').split(','))
  .map(s => String(s).trim().toUpperCase())
  .filter(Boolean);

function getSettings() {
  return JSON.parse(JSON.stringify(store.settings));
}

function updateSettings(patch = {}) {
  const s = store.settings;
  if (patch.platform_fee_percent !== undefined) {
    const n = toNum(patch.platform_fee_percent, 0, 20);
    if (n !== null) s.platform_fee_percent = n;
  }
  if (patch.maintenance_mode !== undefined) s.maintenance_mode = toBool(patch.maintenance_mode);
  if (patch.maintenance_message !== undefined) s.maintenance_message = String(patch.maintenance_message).slice(0, 500);
  if (patch.announcement !== undefined && typeof patch.announcement === 'object') {
    const a = patch.announcement;
    s.announcement = {
      active: toBool(a.active),
      message: String(a.message || '').slice(0, 500),
      type: ['info', 'success', 'warning', 'danger'].includes(a.type) ? a.type : 'info'
    };
  }
  if (patch.signups_enabled !== undefined) s.signups_enabled = toBool(patch.signups_enabled);
  if (patch.payouts_enabled !== undefined) s.payouts_enabled = toBool(patch.payouts_enabled);
  if (patch.min_payout_amount !== undefined) {
    const n = toNum(patch.min_payout_amount, 0, 100000000);
    if (n !== null) s.min_payout_amount = n;
  }
  if (patch.max_transaction_amount !== undefined) {
    const n = toNum(patch.max_transaction_amount, 1, 1000000000);
    if (n !== null) s.max_transaction_amount = n;
  }
  if (patch.disabled_payment_methods !== undefined) s.disabled_payment_methods = toUpperList(patch.disabled_payment_methods);
  if (patch.disabled_countries !== undefined) s.disabled_countries = toUpperList(patch.disabled_countries);
  if (patch.support_email !== undefined) s.support_email = String(patch.support_email).slice(0, 200);
  if (patch.support_whatsapp !== undefined) s.support_whatsapp = String(patch.support_whatsapp).slice(0, 50);
  save();
  return getSettings();
}

// Configuration exposée publiquement (dashboard marchand + checkout)
function publicConfig() {
  const s = store.settings;
  return {
    maintenance_mode: s.maintenance_mode,
    maintenance_message: s.maintenance_message,
    announcement: s.announcement,
    signups_enabled: s.signups_enabled,
    payouts_enabled: s.payouts_enabled,
    min_payout_amount: s.min_payout_amount,
    max_transaction_amount: s.max_transaction_amount,
    platform_fee_percent: s.platform_fee_percent,
    disabled_payment_methods: s.disabled_payment_methods,
    disabled_countries: s.disabled_countries,
    support_email: s.support_email,
    support_whatsapp: s.support_whatsapp
  };
}

// ---------- Contrôles par marchand ----------
function getMerchantOverride(id) {
  return store.merchant_overrides[id] || {};
}

function setMerchantOverride(id, patch = {}) {
  const cur = { ...(store.merchant_overrides[id] || {}) };
  if (patch.status !== undefined) {
    cur.status = ['ACTIVE', 'SUSPENDED'].includes(patch.status) ? patch.status : 'ACTIVE';
  }
  if (patch.suspension_reason !== undefined) cur.suspension_reason = String(patch.suspension_reason || '').slice(0, 300);
  if (patch.kyc_status !== undefined) {
    cur.kyc_status = ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'].includes(patch.kyc_status) ? patch.kyc_status : 'PENDING';
  }
  if (patch.custom_fee_percent !== undefined) {
    if (patch.custom_fee_percent === null || patch.custom_fee_percent === '') {
      delete cur.custom_fee_percent;
    } else {
      const n = toNum(patch.custom_fee_percent, 0, 20);
      if (n !== null) cur.custom_fee_percent = n;
    }
  }
  if (patch.balance_fcfa !== undefined) {
    cur.balance_fcfa = parseFloat(patch.balance_fcfa);
  }
  if (patch.admin_note !== undefined) cur.admin_note = String(patch.admin_note || '').slice(0, 1000);
  cur.updated_at = new Date().toISOString();
  store.merchant_overrides[id] = cur;
  save();
  return cur;
}

function applyMerchantOverride(merchant) {
  if (!merchant) return merchant;
  const o = store.merchant_overrides[merchant.id];
  if (!o) return { ...merchant, status: merchant.status || 'ACTIVE' };
  return {
    ...merchant,
    balance_fcfa: o.balance_fcfa !== undefined ? o.balance_fcfa : merchant.balance_fcfa,
    status: o.status || merchant.status || 'ACTIVE',
    suspension_reason: o.suspension_reason || null,
    kyc_status: o.kyc_status || merchant.kyc_status,
    custom_fee_percent: o.custom_fee_percent !== undefined ? o.custom_fee_percent : null,
    admin_note: o.admin_note || null
  };
}

function isMerchantSuspended(id) {
  return (store.merchant_overrides[id] || {}).status === 'SUSPENDED';
}

function getFeePercent(merchantId) {
  const o = store.merchant_overrides[merchantId];
  if (o && typeof o.custom_fee_percent === 'number') return o.custom_fee_percent;
  return store.settings.platform_fee_percent;
}

// ---------- Contrôles par lien ----------
function setLinkOverride(id, patch = {}) {
  const cur = { ...(store.link_overrides[id] || {}) };
  if (patch.is_active !== undefined) cur.is_active = toBool(patch.is_active);
  store.link_overrides[id] = cur;
  save();
  return cur;
}

function getLinkOverride(id) {
  return store.link_overrides[id] || {};
}

function applyLinkOverride(link) {
  if (!link) return link;
  const o = store.link_overrides[link.id];
  if (!o || o.is_active === undefined) return link;
  return { ...link, is_active: o.is_active };
}

// ---------- Journal d'audit ----------
function addAudit({ admin, action, target_type, target_id, details }) {
  const entry = {
    id: 'aud_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    admin: admin || 'system',
    action,
    target_type: target_type || null,
    target_id: target_id || null,
    details: details || null,
    created_at: new Date().toISOString()
  };
  store.audit_logs.unshift(entry);
  if (store.audit_logs.length > MAX_AUDIT) store.audit_logs.length = MAX_AUDIT;
  save();
  return entry;
}

function getAudit({ target_id, limit = 200 } = {}) {
  let list = store.audit_logs;
  if (target_id) list = list.filter(a => a.target_id === target_id);
  return list.slice(0, limit);
}

module.exports = {
  getSettings,
  updateSettings,
  publicConfig,
  getMerchantOverride,
  setMerchantOverride,
  applyMerchantOverride,
  isMerchantSuspended,
  getFeePercent,
  setLinkOverride,
  getLinkOverride,
  applyLinkOverride,
  addAudit,
  getAudit
};
