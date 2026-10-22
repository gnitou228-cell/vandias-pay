/**
 * ========================================================
 * VANDIAS PAY — DASHBOARD INTERACTIVE ENGINE & SUPABASE AUTH
 * Version: 2.6 (100% Dynamique & Connecté API)
 * ========================================================
 */

// Détection automatique de l'URL du Backend API (compatible avec tout port HTTP/HTTPS 3000/4173 et mode file://)
const API_BASE_URL = (window.location.protocol === 'file:')
  ? (window.__VANDIAS_API_URL || 'http://localhost:3000')
  : '';

// Intercepteur global de fetch pour garantir que tout appel relatif fonctionne même en file:// ou sur un autre serveur
const _nativeFetch = window.fetch ? window.fetch.bind(window) : null;
if (_nativeFetch) {
  window.fetch = function (resource, init) {
    let target = resource;
    if (typeof target === 'string' && target.startsWith('/api/')) {
      target = API_BASE_URL + target;
    }
    return _nativeFetch(target, init);
  };
}

// Helpers globaux d'URL de paiement disponibles immédiatement
window.formatCheckoutLink = function formatCheckoutLink(rawUrl, slugOrId) {
  const slug = slugOrId || '';
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.port === '10000' || (u.hostname === 'localhost' && window.location.hostname !== 'localhost')) {
        return `${window.location.origin}/checkout.html?link=${encodeURIComponent(slug || u.searchParams.get('link') || '')}`;
      }
      return rawUrl;
    } catch (e) {
      if (rawUrl.startsWith('/')) {
        return `${window.location.origin}${rawUrl}`;
      }
    }
  }
  return `${window.location.origin}/checkout.html?link=${encodeURIComponent(slug)}`;
};

window.formatSessionLink = function formatSessionLink(rawUrl, sessionId) {
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.port === '10000' || (u.hostname === 'localhost' && window.location.hostname !== 'localhost')) {
        return `${window.location.origin}/checkout.html?session=${encodeURIComponent(sessionId || u.searchParams.get('session') || '')}`;
      }
      return rawUrl;
    } catch (e) {
      if (rawUrl.startsWith('/')) {
        return `${window.location.origin}${rawUrl}`;
      }
    }
  }
  return `${window.location.origin}/checkout.html?session=${encodeURIComponent(sessionId)}`;
};

var formatCheckoutLink = window.formatCheckoutLink;
var formatSessionLink = window.formatSessionLink;

function safeGetCheckoutUrl(url, slug) {
  try {
    if (typeof window.formatCheckoutLink === 'function') {
      return window.formatCheckoutLink(url, slug);
    }
  } catch (e) {}
  return `${window.location.origin}/checkout.html?link=${encodeURIComponent(slug || '')}`;
}

// État de l'application Dashboard
const VPState = {
  token: localStorage.getItem('vandias_token') || null,
  merchant: null,
  apiKeys: [],
  transactions: [],
  paymentLinks: [],
  wallets: [
    { code: "XOF", country: "TG", name: "Togo", balance: 0, flag: "🇹🇬", symbol: "XOF" },
    { code: "USD", country: "XC", name: "XC", balance: 0, flag: "🌐", symbol: "USD" },
    { code: "ZMW", country: "ZM", name: "Zambie", balance: 0, flag: "🇿🇲", symbol: "ZMW" },
    { code: "USD", country: "US_INTL", name: "International (USD)", balance: 0, flag: "🇺🇸", symbol: "USD" },
    { code: "USD", country: "US", name: "États-Unis", balance: 0, flag: "🇺🇸", symbol: "USD" },
    { code: "UGX", country: "UG", name: "Ouganda", balance: 0, flag: "🇺🇬", symbol: "UGX" },
    { code: "TZS", country: "TZ", name: "Tanzanie", balance: 0, flag: "🇹🇿", symbol: "TZS" },
    { code: "XOF", country: "SN", name: "Sénégal", balance: 0, flag: "🇸🇳", symbol: "XOF" },
    { code: "RWF", country: "RW", name: "Rwanda", balance: 0, flag: "🇷🇼", symbol: "RWF" },
    { code: "NGN", country: "NG", name: "Nigeria", balance: 0, flag: "🇳🇬", symbol: "NGN" },
    { code: "XOF", country: "NE", name: "Niger", balance: 0, flag: "🇳🇪", symbol: "XOF" },
    { code: "MZN", country: "MZ", name: "Mozambique", balance: 0, flag: "🇲🇿", symbol: "MZN" },
    { code: "MWK", country: "MW", name: "Malawi", balance: 0, flag: "🇲🇼", symbol: "MWK" },
    { code: "XOF", country: "ML", name: "Mali", balance: 0, flag: "🇲🇱", symbol: "XOF" },
    { code: "KES", country: "KE", name: "Kenya", balance: 0, flag: "🇰🇪", symbol: "KES" },
    { code: "INR", country: "IN", name: "Inde", balance: 0, flag: "🇮🇳", symbol: "INR" },
    { code: "GNF", country: "GN", name: "Guinée", balance: 0, flag: "🇬🇳", symbol: "GNF" },
    { code: "GHS", country: "GH", name: "Ghana", balance: 0, flag: "🇬🇭", symbol: "GHS" },
    { code: "XAF", country: "GA", name: "Gabon", balance: 0, flag: "🇬🇦", symbol: "XAF" },
    { code: "XAF", country: "CM", name: "Cameroun", balance: 0, flag: "🇨🇲", symbol: "XAF" },
    { code: "XOF", country: "CI", name: "Côte d'Ivoire", balance: 0, flag: "🇨🇮", symbol: "XOF" },
    { code: "XAF", country: "CG", name: "Congo", balance: 0, flag: "🇨🇬", symbol: "XAF" },
    { code: "CDF", country: "CD", name: "Congo (République démocratique du)", balance: 0, flag: "🇨🇩", symbol: "CDF" },
    { code: "XOF", country: "BJ", name: "Bénin", balance: 0, flag: "🇧🇯", symbol: "XOF" },
    { code: "XOF", country: "BF", name: "Burkina Faso", balance: 0, flag: "🇧🇫", symbol: "XOF" }
  ],
  pricingRates: [],
  settings: null,
  activeSettingsSubTab: 'kyc',
  walletsList: [],
  ledgerMovements: [],
  walletTransfers: [],
  ledgerCountryFilter: '',
  ledgerSearchFilter: '',
  ledgerPage: 1,
  ledgerLimit: 10,
  ledgerTotalPages: 1,
  payoutsList: [],
  payoutMethods: [],
  activePayoutSubTab: 'settlements',
  payoutPage: 1,
  payoutPageSize: 20,
  payoutSearchQuery: '',
  payoutCount: 0,
  payoutTotalPages: 1,
  methodIdToDelete: null,
  payoutIdToCancel: null,
  apiKeysList: [],
  ipWhitelist: [],
  activeDevSubTab: 'keys',
  devKeySearchQuery: '',
  keyIdToRevoke: null,
  keyIdToDelete: null,
  ipIdToDelete: null,
  webhooksList: [],
  webhookLogsList: [],
  webhookSearchQuery: '',
  webhookLogsSearchQuery: '',
  webhookLogsFilterWebhook: '',
  webhookLogsFilterStatus: '',
  webhookLogsFilterEvent: '',
  webhookIdToDelete: null,
  selectedWebhookLog: null,
  applications: [],
  currentApp: null,
  pendingEmail: '',
  selectedKycType: 'PARTICULIER',
  txSearchQuery: '',
  txStatusFilter: 'ALL',
  txDirectionFilter: 'ALL',
  txCountryFilter: 'ALL',
  txNetworkFilter: 'ALL',
  txDateFrom: '',
  txDateTo: '',
  txPage: 1,
  txPageSize: 20,
  txTotal: 0,
  paymentLinksSearchQuery: '',
  paymentLinksPage: 1,
  paymentLinksPageSize: 20,
  paymentLinksTotal: 0,
  checkoutSessions: [],
  checkoutSessionsSearchQuery: '',
  checkoutSessionsPage: 1,
  checkoutSessionsPageSize: 20,
  checkoutSessionsTotal: 0,
  customers: [],
  customersSearchQuery: '',
  customersPage: 1,
  customersPageSize: 20,
  customersTotal: 0,
  disputes: [],
  disputesStatusFilter: 'ALL'
};

document.addEventListener('DOMContentLoaded', async () => {
  // Support impersonation directe depuis la console administrateur
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const impToken = urlParams.get('impersonate_token') || urlParams.get('token');
    if (impToken) {
      localStorage.setItem('vandias_token', impToken);
      VPState.token = impToken;
      // Nettoyer l'URL proprement sans recharger la page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {
    console.warn('[Dashboard] Parsing query params:', e);
  }

  initSidebarTabs();
  initMobileDrawer();
  initProfileDropdown();
  initAuthModalEvents();
  initActionModals();
  initOnboardingFlow();
  initSettingsAndWebhookHandlers();
  initCopyButtons();
  initPricingSection();
  initSettingsSubTabs();
  initAllSettingsForms();
  initWalletSection();
  initPayoutsSection();
  initDeveloperSection();
  initWebhooksSection();
  initWebhookLogsSection();
  initTransactionsSection();
  initPaymentLinksSection();
  initCheckoutSessionsSection();
  initCustomersSection();
  initDisputesSection();

  // Chargement des annonces globales & paramètres publics
  checkPlatformAnnouncement();

  // Vérification de la session et chargement dynamique
  if (VPState.token) {
    const success = await loadMerchantDashboard();
    if (!success) {
      promptAuthModal();
    }
  } else {
    // Si aucun token présent, ouvrir la modal de connexion / inscription
    promptAuthModal();
  }
});

async function checkPlatformAnnouncement() {
  try {
    const res = await fetch('/api/v1/public/config');
    if (!res.ok) return;
    const data = await res.json();
    const ann = (data && data.announcement) || (data && data.config && data.config.announcement);
    if (!ann) return;

    if (ann.active && ann.message) {
      displayPlatformAnnouncement(ann);
    }
  } catch (err) {
    console.warn('[Platform Announcement] Non disponible:', err);
  }
}

function displayPlatformAnnouncement(ann) {
  const existing = document.getElementById('platformAnnouncementBanner');
  if (existing) existing.remove();

  const mainContent = document.getElementById('dashboardMainContent');
  if (!mainContent) return;

  const bgStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    danger: 'bg-rose-50 border-rose-200 text-rose-900'
  };

  const icons = {
    info: '📢',
    success: '🎉',
    warning: '⚠️',
    danger: '🚨'
  };

  const banner = document.createElement('div');
  banner.id = 'platformAnnouncementBanner';
  banner.className = `p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-xs mb-4 ${bgStyles[ann.type] || bgStyles.info}`;
  banner.innerHTML = `
    <div class="flex items-center gap-2.5">
      <span class="text-base">${icons[ann.type] || '📢'}</span>
      <span>${ann.message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="opacity-60 hover:opacity-100 text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5">✕</button>
  `;

  mainContent.insertBefore(banner, mainContent.firstChild);
}

/* ========================================================
   1. AUTHENTIFICATION & CHARGEMENT DYNAMIQUE DU MARCHAND
   ======================================================== */

function hideMainDashboard() {
  const sidebar = document.getElementById('dashboardSidebar');
  const main = document.getElementById('dashboardMainLayout');
  if (sidebar) sidebar.classList.add('hidden');
  if (main) main.classList.add('hidden');
}

function showMainDashboard() {
  const sidebar = document.getElementById('dashboardSidebar');
  const main = document.getElementById('dashboardMainLayout');
  if (sidebar) sidebar.classList.remove('hidden');
  if (main) main.classList.remove('hidden');
}

function promptAuthModal() {
  hideMainDashboard();
  const onboardingContainer = document.getElementById('onboardingFlowContainer');
  if (onboardingContainer) onboardingContainer.classList.add('hidden');
  openModal('modalAuth');
}

window.closeAuthModalIfAllowed = function() {
  if (!VPState.token) {
    showToast('Accès restreint', 'Veuillez vous connecter ou créer un compte pour accéder au tableau de bord.');
    return;
  }
  closeModal('modalAuth');
};

window.handleSignOut = function() {
  localStorage.removeItem('vandias_token');
  localStorage.removeItem('vandias_merchant');
  VPState.token = null;
  VPState.merchant = null;
  VPState.applications = [];
  hideMainDashboard();
  const onboardingContainer = document.getElementById('onboardingFlowContainer');
  if (onboardingContainer) onboardingContainer.classList.add('hidden');
  promptAuthModal();
  showToast('Déconnexion réussie', 'Vous avez été déconnecté avec succès.');
};

async function loadMerchantDashboard() {
  if (!VPState.token) {
    promptAuthModal();
    return false;
  }

  // 0. Restauration optimiste depuis le localStorage pour affichage instantané sans scintillement
  try {
    const cachedMerchant = localStorage.getItem('vandias_merchant');
    if (cachedMerchant && (!VPState.merchant || !VPState.merchant.id)) {
      VPState.merchant = JSON.parse(cachedMerchant);
      VPState.applications = VPState.merchant.applications || [];
      showMainDashboard();
      closeModal('modalAuth');
      renderAllDashboardElements();
    }
  } catch (e) {
    console.warn('[Dashboard] Restauration cache marchand:', e);
  }

  try {
    // 1. Profil Marchand & Clés API
    const meRes = await fetch('/api/v1/merchant/me', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });

    if (!meRes.ok) {
      if (meRes.status === 401 || meRes.status === 403) {
        localStorage.removeItem('vandias_token');
        localStorage.removeItem('vandias_merchant');
        VPState.token = null;
        VPState.merchant = null;
        promptAuthModal();
        showToast('Session expirée', 'Veuillez vous reconnecter.', 'danger');
        return false;
      }
      // Si 502/503 ou problème réseau temporaire, maintenir l'accès si les données locales existent
      if (VPState.merchant) {
        console.warn('[Dashboard] Serveur temporairement indisponible, utilisation des données locales.');
        return true;
      }
      promptAuthModal();
      return false;
    }

    const meData = await meRes.json();
    if (!meData.success || !meData.merchant) {
      if (VPState.merchant) return true;
      promptAuthModal();
      return false;
    }

    VPState.merchant = meData.merchant;
    VPState.apiKeys = meData.api_keys || [];
    VPState.applications = meData.merchant.applications || [];
    localStorage.setItem('vandias_merchant', JSON.stringify(meData.merchant));

    // VÉRIFICATION DU PARCOURS D'ONBOARDING :
    const hasApps = VPState.applications && VPState.applications.length > 0;
    const isCompleted = meData.merchant.onboarding_completed === true;

    if (!isCompleted && !hasApps) {
      hideMainDashboard();
      closeModal('modalAuth');
      showOnboardingFlow(meData.merchant);
      return true;
    }

    // Le marchand est entièrement validé : Révéler le grand tableau de bord
    showMainDashboard();
    closeModal('modalAuth');
    const container = document.getElementById('onboardingFlowContainer');
    if (container) container.classList.add('hidden');

    // 2. Transactions réelles
    const txRes = await fetch('/api/v1/merchant/transactions', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (txRes.ok) {
      const txData = await txRes.json();
      VPState.transactions = txData.transactions || [];
    }

    // 3. Liens de paiement réels
    const linksRes = await fetch('/api/v1/merchant/links', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (linksRes.ok) {
      const linksData = await linksRes.json();
      VPState.paymentLinks = linksData.links || [];
    }

    // 4. Tarification réseau
    await fetchPricingRates();

    // Mise à jour de l'interface complète
    renderAllDashboardElements();
    return true;
  } catch (err) {
    console.error('Erreur de chargement du dashboard:', err);
    return false;
  }
}

function renderAllDashboardElements() {
  if (!VPState.merchant) return;

  const m = VPState.merchant;
  const initial = (m.business_name || 'V').charAt(0).toUpperCase();
  const balanceFCFA = parseFloat(m.balance_fcfa || 0);

  // Application active (Sidebar Top Workspace)
  const activeApp = m.active_app || (m.applications && m.applications.find(a => a.id === m.active_app_id)) || null;
  const activeAppName = activeApp ? activeApp.name : (m.business_name || 'VANDIAS PAY');
  const activeAppCat = activeApp ? activeApp.category : 'Automatisation & IA';
  
  const sbAppName = document.getElementById('sidebarActiveAppName');
  if (sbAppName) sbAppName.textContent = activeAppName;
  const sbAppCat = document.getElementById('sidebarActiveAppCategory');
  if (sbAppCat) sbAppCat.textContent = activeAppCat;

  // 1. Topbar & Profile Trigger
  const topbarLetter = document.getElementById('topbarAvatarLetter');
  const topbarName = document.getElementById('topbarMerchantName');
  if (topbarLetter) topbarLetter.textContent = initial;
  if (topbarName) topbarName.textContent = activeAppName;

  // 2. Profile Dropdown
  const menuLetter = document.getElementById('menuAvatarLetter');
  const menuName = document.getElementById('menuMerchantName');
  const menuEmail = document.getElementById('menuMerchantEmail');
  if (menuLetter) menuLetter.textContent = initial;
  if (menuName) menuName.textContent = activeAppName;
  if (menuEmail) menuEmail.textContent = m.email;

  // 3. Sidebar Bottom User Pill
  const sidebarLetter = document.getElementById('sidebarAvatarLetter');
  const sidebarName = document.getElementById('sidebarMerchantName');
  const sidebarSub = document.getElementById('sidebarMerchantSub');
  if (sidebarLetter) sidebarLetter.textContent = initial;
  if (sidebarName) sidebarName.textContent = m.business_name;
  if (sidebarSub) sidebarSub.textContent = m.email;

  // 4. Wallet XOF (Solde réel du marchand)
  const xofWalletEl = document.getElementById('xofWalletBalance');
  if (xofWalletEl) {
    xofWalletEl.textContent = balanceFCFA.toLocaleString('fr-FR');
  }

  // Mettre à jour le solde dans la liste multi-devises
  const xofObj = VPState.wallets.find(w => w.code === 'XOF');
  if (xofObj) xofObj.balance = balanceFCFA;
  renderDetailedWallets();
  renderOverviewDashboardKPIs();

  // 5. Clés API et Whitelist dans l'onglet Développeur (100% conforme SasPay)
  const devMerchantName = document.getElementById('devMerchantName');
  if (devMerchantName) devMerchantName.textContent = m.business_name || 'VANDIA IA';
  loadAndRenderApiKeys(VPState.devKeySearchQuery);
  loadAndRenderIpWhitelist();

  // 6. Webhooks & Journal des Webhooks (100% conforme SasPay)
  const webhooksMerchantName = document.getElementById('webhooksMerchantName');
  if (webhooksMerchantName) webhooksMerchantName.textContent = m.business_name || 'VANDIA IA';
  const webhookLogsMerchantName = document.getElementById('webhookLogsMerchantName');
  if (webhookLogsMerchantName) webhookLogsMerchantName.textContent = m.business_name || 'VANDIA IA';
  loadAndRenderWebhooks(VPState.webhookSearchQuery);
  loadAndRenderWebhookLogs();

  // 7. Paramètres de l'entreprise
  const settingsNameInput = document.getElementById('settingsBusinessName');
  const settingsEmailInput = document.getElementById('settingsOwnerEmail');
  const settingsPhoneInput = document.getElementById('settingsPhone');
  if (settingsNameInput) settingsNameInput.value = m.business_name;
  if (settingsEmailInput) settingsEmailInput.value = m.email;
  if (settingsPhoneInput) settingsPhoneInput.value = m.phone || '';

  // Synchronisation dynamique du nom de l'application active dans tous les sous-titres
  document.querySelectorAll('.active-app-name-display').forEach(el => {
    el.textContent = activeAppName;
  });

  // 8. Rendu des transactions (avec mise en page 100% conforme capture)
  renderTransactionsList();
  renderFullTransactionsList();

  // 9. Liens de paiement (table + pagination conforme capture)
  renderPaymentLinksList();

  // 10. Sessions de checkout (table + pagination conforme capture)
  renderCheckoutSessionsList();

  // 11. Clients CRM (table + pagination conforme capture)
  renderCustomersList();

  // 12. Litiges (conforme capture)
  renderDisputes();

  // 13. Tarification réseau (conforme SasPay)
  renderPricingRates();

  // 12. Paramètres avancés (100% conforme SasPay)
  loadAndRenderSettings();

  // 13. Wallets multi-devises, mouvements ledger et transferts (100% conforme SasPay)
  loadAndRenderWallets();
  loadAndRenderWalletLedger();
  loadAndRenderWalletTransfers();

  // 14. Retraits et méthodes de retrait (100% conforme SasPay)
  const payoutsMerchantEl = document.getElementById('payoutsMerchantName');
  if (payoutsMerchantEl) {
    payoutsMerchantEl.textContent = m.business_name || 'VANDIA IA';
  }
  loadAndRenderPayouts();
  loadAndRenderPayoutMethods();
}

/* ========================================================
   2. RENDU DU TABLEAU DE BORD (KPIS, VOLUME & LIENS RAPIDES)
   ======================================================== */

function formatOverviewTxDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = d.getDate();
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

function renderOverviewRecentTransactions() {
  const container = document.getElementById('overviewRecentTxList');
  if (!container) return;

  container.innerHTML = '';
  const txs = VPState.transactions || [];

  if (txs.length === 0) {
    container.innerHTML = `
      <div class="py-12 px-4 text-center">
        <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm mx-auto mb-2">
          +
        </div>
        <p class="text-xs font-semibold text-slate-600">Aucune transaction pour le moment</p>
        <p class="text-[11px] text-slate-400 mt-1">Vos transactions récentes s'afficheront ici en direct.</p>
      </div>
    `;
    return;
  }

  // Affiche les 5 transactions les plus récentes (100% conforme au screenshot SasPay)
  const recents = txs.slice(0, 5);
  recents.forEach(t => {
    const rawId = String(t.id || t.reference || '');
    const displayId = rawId.length > 15 ? (rawId.substring(0, 15) + '...') : rawId;
    const dateFormatted = formatOverviewTxDate(t.created_at);
    const amountVal = parseFloat(t.amount_gross || t.amount || 0);
    const amountFormatted = amountVal.toLocaleString('fr-FR');
    const currency = t.currency || 'XOF';

    let statusLabel = 'Échoué';
    let statusClass = 'text-[#F43F5E]';
    const st = (t.status || '').toUpperCase();
    if (st === 'SUCCESS' || st === 'REUSSI' || st === 'COMPLETED' || st === 'SUCCEEDED') {
      statusLabel = 'Réussi';
      statusClass = 'text-[#10B981]';
    } else if (st === 'PENDING' || st === 'WAITING' || st === 'PROCESSING') {
      statusLabel = 'En attente';
      statusClass = 'text-[#F59E0B]';
    } else if (st === 'CANCELLED' || st === 'ANNULE') {
      statusLabel = 'Annulé';
      statusClass = 'text-slate-400';
    } else {
      statusLabel = 'Échoué';
      statusClass = 'text-[#F43F5E]';
    }

    const item = document.createElement('div');
    item.className = 'flex items-center justify-between py-2.5 px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer group';
    item.title = `Transaction ${rawId} — Cliquer pour voir les détails`;
    item.onclick = () => {
      switchTab('transactions');
    };

    item.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F3F4F6] text-[#9CA3AF] flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-blue-50 group-hover:text-[#0052FF] transition-colors">
          +
        </div>
        <div class="min-w-0">
          <span class="text-xs sm:text-sm font-bold text-[#111827] block truncate" title="${rawId}">
            ${displayId}
          </span>
          <span class="text-[11px] text-[#6B7280] block mt-0.5">
            ${dateFormatted}
          </span>
        </div>
      </div>
      <div class="text-right shrink-0 ml-3">
        <span class="text-xs sm:text-sm font-bold text-[#111827] block font-mono">
          +${amountFormatted} ${currency}
        </span>
        <span class="text-[11px] font-semibold ${statusClass} block mt-0.5">
          ${statusLabel}
        </span>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderOverviewDashboardKPIs() {
  if (!VPState.merchant) return;
  const balanceFCFA = parseFloat(VPState.merchant.balance_fcfa || 0);

  // 1. Solde disponible principal
  const xofWalletEl = document.getElementById('xofWalletBalance');
  if (xofWalletEl) xofWalletEl.textContent = balanceFCFA.toLocaleString('fr-FR');

  const keyXofEl = document.getElementById('keyWalletXOF');
  if (keyXofEl) keyXofEl.textContent = balanceFCFA.toLocaleString('fr-FR');

  // Helper pour trouver le solde disponible par devise
  const getCurrencyBal = (code) => {
    if (code === 'XOF') return balanceFCFA;
    if (VPState.walletsList && VPState.walletsList.length > 0) {
      const match = VPState.walletsList.find(w => (w.currency || '').toUpperCase() === code);
      if (match) return parseFloat(match.available_amount || 0);
    }
    const wMatch = (VPState.wallets || []).find(w => (w.code || '').toUpperCase() === code);
    return wMatch ? parseFloat(wMatch.balance || 0) : 0;
  };

  const formatBal = (val) => {
    if (val === 0) return '0';
    return val % 1 === 0 ? val.toLocaleString('fr-FR') : val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // 2. Mise à jour des 6 devises du tableau de bord (exactement selon capture SasPay)
  const balUSD = document.getElementById('overviewBalUSD');
  if (balUSD) balUSD.textContent = formatBal(getCurrencyBal('USD'));

  const balZMW = document.getElementById('overviewBalZMW');
  if (balZMW) balZMW.textContent = formatBal(getCurrencyBal('ZMW'));

  const balUGX = document.getElementById('overviewBalUGX');
  if (balUGX) balUGX.textContent = formatBal(getCurrencyBal('UGX'));

  const balTZS = document.getElementById('overviewBalTZS');
  if (balTZS) balTZS.textContent = formatBal(getCurrencyBal('TZS'));

  const balXOF = document.getElementById('overviewBalXOF');
  if (balXOF) balXOF.textContent = formatBal(getCurrencyBal('XOF'));

  const balRWF = document.getElementById('overviewBalRWF');
  if (balRWF) balRWF.textContent = formatBal(getCurrencyBal('RWF'));

  // 3. Rendu des transactions récentes sur le tableau de bord
  renderOverviewRecentTransactions();
}

function renderTransactionsList() {
  const container = document.getElementById('recentTxList');
  if (!container) return;

  container.innerHTML = '';

  // Si aucune transaction (nouveau marchand), afficher l'état vide élégant
  if (!VPState.transactions || VPState.transactions.length === 0) {
    container.innerHTML = `
      <div id="emptyTxState" class="p-6 text-center bg-[#F8F9FD] rounded-2xl border border-dashed border-[#ECEEF6] my-2">
        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052FF] font-bold flex items-center justify-center text-xl mx-auto mb-3 shadow-sm">
          ⚡
        </div>
        <h3 class="text-sm font-bold text-[#111827] mb-1">Aucune transaction pour le moment</h3>
        <p class="text-xs text-slate-500 mb-4 max-w-xs mx-auto leading-relaxed">
          Créez votre premier lien de paiement pour commencer à encaisser vos clients !
        </p>
        <button onclick="openCreateLinkModal()" class="px-4 py-2.5 rounded-xl bg-[#0052FF] hover:bg-[#0040D0] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2">
          <span>+ Créer un premier lien</span>
        </button>
      </div>
    `;
    return;
  }

  // Rendu des 5 transactions les plus récentes
  const recents = VPState.transactions.slice(0, 5);
  recents.forEach(t => {
    const isSuccess = t.status === 'SUCCESS';
    const isPending = t.status === 'PENDING';
    const dateFormatted = formatTxDate(t.created_at);
    const amountGross = parseFloat(t.amount_gross || 0).toLocaleString('fr-FR');
    const currency = t.currency || 'XOF';

    let methodIcon = '🌊';
    if (t.payment_method === 'ORANGE') methodIcon = '🍊';
    if (t.payment_method === 'MTN') methodIcon = '💛';
    if (t.payment_method === 'CARD') methodIcon = '💳';

    const card = document.createElement('div');
    card.className = 'tx-item p-3 rounded-2xl hover:bg-[#F8F9FD] transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-[#ECEEF6]';
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full ${isSuccess ? 'bg-emerald-50 text-emerald-600' : isPending ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'} font-bold flex items-center justify-center text-sm shadow-sm">
          ${methodIcon}
        </div>
        <div>
          <span class="text-xs font-mono font-bold text-[#111827] block truncate max-w-[150px] sm:max-w-[180px]">${t.id}</span>
          <span class="text-[10px] text-slate-400">${dateFormatted} • ${t.customer_name || 'Client'}</span>
        </div>
      </div>
      <div class="text-right">
        <span class="text-xs font-bold ${isSuccess ? 'text-emerald-600' : 'text-slate-700'} block font-mono">+${amountGross} ${currency}</span>
        <span class="text-[10px] font-semibold ${isSuccess ? 'text-emerald-500' : isPending ? 'text-amber-500' : 'text-rose-500'}">
          ${isSuccess ? 'Réussi' : isPending ? 'En attente' : 'Échoué'}
        </span>
      </div>
    `;
    container.appendChild(card);
  });
  renderOverviewRecentTransactions();
}

function formatTxDateSplit(isoString) {
  if (!isoString) return { day: '—', month: '—', year: '—' };
  try {
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    const year = d.getFullYear();
    return { day, month, year };
  } catch {
    return { day: '—', month: '—', year: '—' };
  }
}

function getOperatorDotColor(net) {
  const n = (net || '').toUpperCase();
  if (n.includes('ORANGE')) return 'bg-[#FF7900] ring-1 ring-orange-300';
  if (n.includes('MTN')) return 'bg-[#FFCC00] ring-1 ring-yellow-400';
  if (n.includes('MOOV')) return 'bg-[#008080] ring-1 ring-teal-400';
  if (n.includes('WAVE')) return 'bg-[#1DC4FA] ring-1 ring-sky-300';
  return 'bg-slate-800';
}

function getOperatorDisplayLabel(t) {
  if (t.operator_name) return t.operator_name;
  const pm = (t.payment_method || '').toUpperCase();
  const country = (t.country || '').toUpperCase();
  const countryName = getCountryName(country);

  if (pm === 'ORANGE') return `Orange ${countryName}`;
  if (pm === 'MTN') return `MTN MoMo ${countryName}`;
  if (pm === 'MOOV') return `Moov Money ${countryName}`;
  if (pm === 'WAVE') return `Wave ${countryName}`;
  if (pm === 'CARD') return `Carte Bancaire`;
  return t.payment_method || 'Mobile Money';
}

function getTransactionCountry(t) {
  if (t.country) {
    return { code: t.country.toUpperCase(), name: getCountryName(t.country) };
  }
  const phone = (t.customer_phone || '').replace(/[^0-9]/g, '');
  if (phone.startsWith('226')) return { code: 'BF', name: 'Burkina Faso' };
  if (phone.startsWith('229')) return { code: 'BJ', name: 'Bénin' };
  if (phone.startsWith('228')) return { code: 'TG', name: 'Togo' };
  if (phone.startsWith('225')) return { code: 'CI', name: "Côte d'Ivoire" };
  if (phone.startsWith('221')) return { code: 'SN', name: 'Sénégal' };
  if (phone.startsWith('223')) return { code: 'ML', name: 'Mali' };
  if (phone.startsWith('227')) return { code: 'NE', name: 'Niger' };
  if (phone.startsWith('224')) return { code: 'GN', name: 'Guinée' };
  if (phone.startsWith('237')) return { code: 'CM', name: 'Cameroun' };
  return { code: 'BF', name: 'Burkina Faso' };
}

/* ========================================================
   SECTION 3 : RENDU DES TRANSACTIONS (100% CONFORME CAPTURE)
   ======================================================== */

async function renderFullTransactionsList() {
  const tbody = document.getElementById('fullTransactionsBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" class="py-10 text-center text-slate-400 text-xs">Chargement des transactions...</td></tr>';

  try {
    const params = new URLSearchParams({
      page: VPState.txPage,
      limit: VPState.txPageSize
    });
    if (VPState.txStatusFilter && VPState.txStatusFilter !== 'ALL') params.append('status', VPState.txStatusFilter);
    if (VPState.txSearchQuery) params.append('search', VPState.txSearchQuery);
    if (VPState.txCountryFilter && VPState.txCountryFilter !== 'ALL') params.append('country', VPState.txCountryFilter);
    if (VPState.txNetworkFilter && VPState.txNetworkFilter !== 'ALL') params.append('network', VPState.txNetworkFilter);
    if (VPState.txDirectionFilter && VPState.txDirectionFilter !== 'ALL') params.append('direction', VPState.txDirectionFilter);
    if (VPState.txDateFrom) params.append('date_from', VPState.txDateFrom);
    if (VPState.txDateTo) params.append('date_to', VPState.txDateTo);

    const res = await fetch(`/api/v1/merchant/transactions?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    const list = (data.success && data.transactions) ? data.transactions : (VPState.transactions || []);
    const total = data.pagination?.total ?? list.length;
    VPState.txTotal = total;

    tbody.innerHTML = '';

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="py-12 text-center text-slate-400 text-xs">
            <div class="flex flex-col items-center justify-center">
              <span class="text-2xl mb-2">🧾</span>
              <span class="text-xs font-semibold text-[#111827]">Aucune transaction trouvée</span>
              <span class="text-[11px] text-slate-400 mt-0.5">Vos règlements clients s'afficheront ici en temps réel.</span>
            </div>
          </td>
        </tr>
      `;
      updateTxPagination(0, 0, 0);
      return;
    }

    list.forEach(t => {
      const isSuccess = t.status === 'SUCCESS';
      const isPending = t.status === 'PENDING';
      const isFailed = t.status === 'FAILED';
      const isCancelled = t.status === 'CANCELLED';

      const statusBadge = isSuccess
        ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F8F0] text-[#10B981]">Réussi</span>'
        : (isPending
          ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF8E6] text-[#D97706]">En attente</span>'
          : (isCancelled
            ? '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Annulé</span>'
            : '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEECEE] text-[#EF4444]">Échoué</span>'));

      const isPayout = (t.type === 'OUT' || (t.id && t.id.startsWith('po_')));
      const typeBadge = isPayout
        ? `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0052FF]">Décaissement</span><span class="text-[10px] text-slate-400 block mt-0.5">Retrait</span>`
        : `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF2FF] text-[#2563EB]">Encaissement</span><span class="text-[10px] text-slate-400 block mt-0.5">Paiement</span>`;

      const countryInfo = getTransactionCountry(t);
      const networkLabel = getOperatorDisplayLabel(t);
      const dotClass = getOperatorDotColor(t.payment_method || networkLabel);
      const dateSplit = formatTxDateSplit(t.created_at);
      const phone = t.customer_phone || t.recipient_phone || '—';
      const grossAmount = parseFloat(t.amount_gross || t.amount || 0).toLocaleString('fr-FR');
      const currency = t.currency || 'XOF';
      const sign = isPayout ? '-' : '+';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F8F9FD] transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-3">
          <span class="font-mono text-xs font-semibold text-[#111827] block truncate max-w-[150px]" title="${t.id}">${t.id}</span>
        </td>
        <td class="py-3 px-3">${typeBadge}</td>
        <td class="py-3 px-3">
          <span class="text-[10px] text-slate-400 font-bold tracking-wider block">${countryInfo.code}</span>
          <span class="text-xs text-slate-700 font-medium block whitespace-nowrap">${countryInfo.name}</span>
        </td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-2 whitespace-nowrap">
            <span class="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0 ${dotClass}"></span>
            <span class="text-xs text-slate-700 font-medium">${networkLabel}</span>
          </div>
        </td>
        <td class="py-3 px-3">
          <span class="text-xs font-mono text-slate-600 block">${phone}</span>
        </td>
        <td class="py-3 px-3">
          <div class="text-xs text-slate-700 font-medium leading-tight">
            <span>${dateSplit.day}</span><br>
            <span>${dateSplit.month}</span><br>
            <span>${dateSplit.year}</span>
          </div>
        </td>
        <td class="py-3 px-3">${statusBadge}</td>
        <td class="py-3 px-3 text-right">
          <span class="text-xs font-extrabold text-[#111827] font-mono whitespace-nowrap">${sign}${grossAmount} ${currency}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });

    const start = (VPState.txPage - 1) * VPState.txPageSize + 1;
    const end = Math.min(VPState.txPage * VPState.txPageSize, total);
    updateTxPagination(start, end, total);
  } catch (err) {
    console.error('Erreur renderFullTransactionsList:', err);
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-rose-500 text-xs">Erreur de chargement: ${err.message}</td></tr>`;
  }
}

function updateTxPagination(start, end, total) {
  const info = document.getElementById('txPaginationInfo');
  if (info) info.textContent = `${total === 0 ? 0 : start}-${end} sur ${total}`;
  const btnPrev = document.getElementById('btnPrevTx');
  const btnNext = document.getElementById('btnNextTx');
  if (btnPrev) btnPrev.disabled = VPState.txPage <= 1;
  if (btnNext) btnNext.disabled = end >= total;
}

function initTransactionsSection() {
  const searchInput = document.getElementById('txSearchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        VPState.txSearchQuery = e.target.value;
        VPState.txPage = 1;
        renderFullTransactionsList();
      }, 300);
    });
  }

  const pills = document.querySelectorAll('.tx-status-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => {
        p.classList.remove('active', 'bg-[#0052FF]', 'text-white');
        p.classList.add('text-slate-600');
      });
      pill.classList.add('active', 'bg-[#0052FF]', 'text-white');
      pill.classList.remove('text-slate-600');

      VPState.txStatusFilter = pill.getAttribute('data-status') || 'ALL';
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  });

  const directionFilter = document.getElementById('txDirectionFilter');
  if (directionFilter) {
    directionFilter.addEventListener('change', (e) => {
      VPState.txDirectionFilter = e.target.value;
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  }

  const countryFilter = document.getElementById('txCountryFilter');
  if (countryFilter) {
    countryFilter.addEventListener('change', (e) => {
      VPState.txCountryFilter = e.target.value;
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  }

  const networkFilter = document.getElementById('txNetworkFilter');
  if (networkFilter) {
    networkFilter.addEventListener('change', (e) => {
      VPState.txNetworkFilter = e.target.value;
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  }

  const dateFrom = document.getElementById('txDateFrom');
  if (dateFrom) {
    dateFrom.addEventListener('change', (e) => {
      VPState.txDateFrom = e.target.value;
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  }

  const dateTo = document.getElementById('txDateTo');
  if (dateTo) {
    dateTo.addEventListener('change', (e) => {
      VPState.txDateTo = e.target.value;
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  }

  const pageSize = document.getElementById('txPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', (e) => {
      VPState.txPageSize = parseInt(e.target.value);
      VPState.txPage = 1;
      renderFullTransactionsList();
    });
  }

  const btnPrev = document.getElementById('btnPrevTx');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (VPState.txPage > 1) {
        VPState.txPage -= 1;
        renderFullTransactionsList();
      }
    });
  }

  const btnNext = document.getElementById('btnNextTx');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      VPState.txPage += 1;
      renderFullTransactionsList();
    });
  }

  const exportBtn = document.getElementById('btnExportCsv');
  if (exportBtn) {
    exportBtn.onclick = () => {
      const csv = "RÉFÉRENCE,TYPE,PAYS,RÉSEAU,NUMÉRO,DATE,STATUT,MONTANT,DEVISE\n" + (VPState.transactions || []).map(t => {
        const c = getTransactionCountry(t);
        const net = getOperatorDisplayLabel(t);
        const date = t.created_at || '';
        return `"${t.id}","${t.type || 'Encaissement'}","${c.code} ${c.name}","${net}","${t.customer_phone || ''}","${date}","${t.status || ''}",${t.amount_gross || t.amount || 0},"${t.currency || 'XOF'}"`;
      }).join("\n");
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `transactions_export_${Date.now()}.csv`);
      a.click();
      showToast("Exporté !", "Fichier CSV téléchargé avec succès.");
    };
  }
}

/* ========================================================
   SECTION 4 : RENDU DES LIENS DE PAIEMENT & HELPERS URL
   ======================================================== */
function formatCheckoutLink(rawUrl, slugOrId) {
  const slug = slugOrId || '';
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.port === '10000' || (u.hostname === 'localhost' && window.location.hostname !== 'localhost')) {
        return `${window.location.origin}/checkout.html?link=${encodeURIComponent(slug || u.searchParams.get('link') || '')}`;
      }
      return rawUrl;
    } catch (e) {
      if (rawUrl.startsWith('/')) {
        return `${window.location.origin}${rawUrl}`;
      }
    }
  }
  return `${window.location.origin}/checkout.html?link=${encodeURIComponent(slug)}`;
}

function formatSessionLink(rawUrl, sessionId) {
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.port === '10000' || (u.hostname === 'localhost' && window.location.hostname !== 'localhost')) {
        return `${window.location.origin}/checkout.html?session=${encodeURIComponent(sessionId || u.searchParams.get('session') || '')}`;
      }
      return rawUrl;
    } catch (e) {
      if (rawUrl.startsWith('/')) {
        return `${window.location.origin}${rawUrl}`;
      }
    }
  }
  return `${window.location.origin}/checkout.html?session=${encodeURIComponent(sessionId)}`;
}

async function renderPaymentLinksList() {
  const tbody = document.getElementById('paymentLinksTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/v1/merchant/links', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.links)) {
      const linkMap = new Map();
      (VPState.paymentLinks || []).forEach(l => linkMap.set(l.id || l.slug, l));
      data.links.forEach(l => linkMap.set(l.id || l.slug, l));
      VPState.paymentLinks = Array.from(linkMap.values());
    }
  } catch (e) {
    console.warn('Fallback local paymentLinks:', e.message);
  }

  let list = [...(VPState.paymentLinks || [])];
  if (VPState.paymentLinksSearchQuery) {
    const q = VPState.paymentLinksSearchQuery.toLowerCase().trim();
    list = list.filter(l =>
      (l.title && l.title.toLowerCase().includes(q)) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      (l.slug && l.slug.toLowerCase().includes(q))
    );
  }

  const total = list.length;
  VPState.paymentLinksTotal = total;

  const pageSize = VPState.paymentLinksPageSize;
  const startIndex = (VPState.paymentLinksPage - 1) * pageSize;
  const paginated = list.slice(startIndex, startIndex + pageSize);

  tbody.innerHTML = '';

  if (paginated.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-slate-400 text-xs">
          <div class="flex flex-col items-center justify-center">
            <span class="text-2xl mb-2">🔗</span>
            <span class="text-xs font-semibold text-[#111827]">Aucun lien de paiement trouvé</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Cliquez sur « + Créer un lien » pour générer un lien instantané.</span>
          </div>
        </td>
      </tr>
    `;
    updatePaymentLinksPagination(0, 0, 0);
    return;
  }

  paginated.forEach(lnk => {
    const isFixed = lnk.is_fixed_amount !== false;
    const currencyStr = lnk.currency || 'XOF';
    const amountVal = parseFloat(lnk.amount_fcfa || lnk.amount || 0);
    const amountFormatted = amountVal.toLocaleString('fr-FR');
    const amountStr = isFixed ? `${amountFormatted} ${currencyStr}` : `Montant libre (${currencyStr})`;
    const uses = lnk.sales_count ?? 0;
    const usesStr = lnk.max_uses ? `${uses} / ${lnk.max_uses}` : `${uses}`;
    const desc = lnk.description || 'Sans description';
    const linkUrl = formatCheckoutLink(lnk.url, lnk.slug || lnk.id);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F8F9FD] transition-colors';
    tr.innerHTML = `
      <td class="py-3.5 px-3">
        <div class="font-bold text-xs text-[#111827]">${lnk.title}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">${desc}</div>
      </td>
      <td class="py-3.5 px-3">
        <span class="text-xs font-bold text-[#111827] font-mono">${amountStr}</span>
      </td>
      <td class="py-3.5 px-3">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F8F0] text-[#10B981]">Actif</span>
      </td>
      <td class="py-3.5 px-3">
        <span class="text-xs text-slate-700 font-medium">${usesStr}</span>
      </td>
      <td class="py-3.5 px-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="text-slate-400 hover:text-[#0052FF] p-1.5 transition-colors" title="Copier le lien" onclick="navigator.clipboard.writeText('${linkUrl}'); showToast('Copié !', 'Lien copié dans le presse-papier.');">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
          </button>
          <a href="${linkUrl}" target="_blank" class="text-slate-400 hover:text-[#0052FF] p-1.5 transition-colors" title="Ouvrir la page de paiement">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </a>
          <button class="text-rose-500 hover:text-rose-700 p-1.5 transition-colors" title="Supprimer" onclick="deletePaymentLink('${lnk.id}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const start = startIndex + 1;
  const end = Math.min(startIndex + pageSize, total);
  updatePaymentLinksPagination(start, end, total);
}

function updatePaymentLinksPagination(start, end, total) {
  const info = document.getElementById('paymentLinksPaginationInfo');
  if (info) info.textContent = `${total === 0 ? 0 : start}-${end} sur ${total}`;
  const btnPrev = document.getElementById('btnPrevPaymentLinks');
  const btnNext = document.getElementById('btnNextPaymentLinks');
  if (btnPrev) btnPrev.disabled = VPState.paymentLinksPage <= 1;
  if (btnNext) btnNext.disabled = end >= total;
}

async function deletePaymentLink(id) {
  if (!confirm('Voulez-vous vraiment supprimer ce lien de paiement ?')) return;
  try {
    const res = await fetch(`/api/v1/merchant/links/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    if (data.success) {
      VPState.paymentLinks = VPState.paymentLinks.filter(l => l.id !== id);
      renderPaymentLinksList();
      showToast('Supprimé', 'Le lien a été supprimé.');
    } else {
      showToast('Erreur', data.error || 'Erreur lors de la suppression.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

function initPaymentLinksSection() {
  const searchInput = document.getElementById('paymentLinksSearchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        VPState.paymentLinksSearchQuery = e.target.value;
        VPState.paymentLinksPage = 1;
        renderPaymentLinksList();
      }, 300);
    });
  }

  const pageSize = document.getElementById('paymentLinksPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', (e) => {
      VPState.paymentLinksPageSize = parseInt(e.target.value);
      VPState.paymentLinksPage = 1;
      renderPaymentLinksList();
    });
  }

  const btnPrev = document.getElementById('btnPrevPaymentLinks');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (VPState.paymentLinksPage > 1) {
        VPState.paymentLinksPage -= 1;
        renderPaymentLinksList();
      }
    });
  }

  const btnNext = document.getElementById('btnNextPaymentLinks');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      VPState.paymentLinksPage += 1;
      renderPaymentLinksList();
    });
  }
}

/* ========================================================
   SECTION 5 : RENDU DES SESSIONS DE CHECKOUT (100% CONFORME CAPTURE)
   ======================================================== */

function formatCheckoutSessionDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const day = d.getDate();
    const month = d.toLocaleDateString('fr-FR', { month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${day} ${month} ${year}, ${time}`;
  } catch {
    return '—';
  }
}

async function renderCheckoutSessionsList() {
  const tbody = document.getElementById('checkoutSessionsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-slate-400 text-xs">Chargement des sessions...</td></tr>';

  try {
    const params = new URLSearchParams({
      page: VPState.checkoutSessionsPage,
      limit: VPState.checkoutSessionsPageSize
    });
    if (VPState.checkoutSessionsSearchQuery) params.append('search', VPState.checkoutSessionsSearchQuery);

    const res = await fetch(`/api/v1/merchant/checkout-sessions?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    const list = (data.success && data.sessions) ? data.sessions : [];
    const total = data.pagination?.total ?? list.length;
    VPState.checkoutSessions = list;
    VPState.checkoutSessionsTotal = total;

    tbody.innerHTML = '';

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400 text-xs">
            <div class="flex flex-col items-center justify-center">
              <span class="text-2xl mb-2">⚡</span>
              <span class="text-xs font-semibold text-[#111827]">Aucune session de checkout</span>
              <span class="text-[11px] text-slate-400 mt-0.5">Créez une session à usage unique pré-remplie pour vos clients.</span>
            </div>
          </td>
        </tr>
      `;
      updateCheckoutSessionsPagination(0, 0, 0);
      return;
    }

    list.forEach(s => {
      const isPaid = s.status === 'PAID' || s.status === 'SUCCESS';
      const isExpired = s.status === 'EXPIRED' || s.status === 'FAILED';
      const statusBadge = isPaid
        ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F8F0] text-[#10B981]">Payée</span>'
        : (isExpired
          ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Expirée</span>'
          : '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF8E6] text-[#D97706]">En attente</span>');

      const amountStr = parseFloat(s.amount || 0).toLocaleString('fr-FR');
      const currencyStr = s.currency || 'XOF';
      const clientName = s.customer_name || 'Client';
      const clientEmail = s.customer_email || 'client@vandiaspay.com';
      const sessionUrl = formatSessionLink(s.checkout_url, s.id);

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F8F9FD] transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-3">
          <div class="font-bold text-xs text-[#111827]">${clientName}</div>
          <div class="text-[11px] text-slate-400 font-mono mt-0.5">${clientEmail}</div>
        </td>
        <td class="py-3.5 px-3">
          <span class="font-mono text-xs text-slate-600 truncate max-w-[150px] inline-block" title="${s.id}">${s.id}</span>
        </td>
        <td class="py-3.5 px-3">
          <span class="text-xs font-semibold text-[#111827] font-mono">${amountStr} ${currencyStr}</span>
        </td>
        <td class="py-3.5 px-3">${statusBadge}</td>
        <td class="py-3.5 px-3 text-slate-600 text-xs">${formatCheckoutSessionDate(s.created_at)}</td>
        <td class="py-3.5 px-3 text-right">
          <button onclick="navigator.clipboard.writeText('${sessionUrl}'); showToast('Copié !', 'Lien de la session copié dans le presse-papier.');" class="px-3.5 py-1.5 rounded-xl bg-white border border-[#ECEEF6] hover:bg-slate-50 text-xs font-semibold text-[#111827] transition-colors shadow-sm">
            Copier le lien
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    const start = (VPState.checkoutSessionsPage - 1) * VPState.checkoutSessionsPageSize + 1;
    const end = Math.min(VPState.checkoutSessionsPage * VPState.checkoutSessionsPageSize, total);
    updateCheckoutSessionsPagination(start, end, total);
  } catch (err) {
    console.error('Erreur renderCheckoutSessionsList:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-rose-500 text-xs">Erreur: ${err.message}</td></tr>`;
  }
}

function updateCheckoutSessionsPagination(start, end, total) {
  const info = document.getElementById('checkoutSessionsPaginationInfo');
  if (info) info.textContent = `${total === 0 ? 0 : start}-${end} sur ${total}`;
  const btnPrev = document.getElementById('btnPrevCheckoutSessions');
  const btnNext = document.getElementById('btnNextCheckoutSessions');
  if (btnPrev) btnPrev.disabled = VPState.checkoutSessionsPage <= 1;
  if (btnNext) btnNext.disabled = end >= total;
}

function openCreateCheckoutSessionModal() {
  openModal('modalCreateCheckoutSession');
}

function initCheckoutSessionsSection() {
  const searchInput = document.getElementById('checkoutSessionsSearchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        VPState.checkoutSessionsSearchQuery = e.target.value;
        VPState.checkoutSessionsPage = 1;
        renderCheckoutSessionsList();
      }, 300);
    });
  }

  const pageSize = document.getElementById('checkoutSessionsPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', (e) => {
      VPState.checkoutSessionsPageSize = parseInt(e.target.value);
      VPState.checkoutSessionsPage = 1;
      renderCheckoutSessionsList();
    });
  }

  const btnPrev = document.getElementById('btnPrevCheckoutSessions');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (VPState.checkoutSessionsPage > 1) {
        VPState.checkoutSessionsPage -= 1;
        renderCheckoutSessionsList();
      }
    });
  }

  const btnNext = document.getElementById('btnNextCheckoutSessions');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      VPState.checkoutSessionsPage += 1;
      renderCheckoutSessionsList();
    });
  }

  const form = document.getElementById('createCheckoutSessionForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customer_name = document.getElementById('newSessionCustomerName').value;
      const customer_email = document.getElementById('newSessionCustomerEmail').value;
      const customer_phone = document.getElementById('newSessionCustomerPhone')?.value || '';
      const amount = parseFloat(document.getElementById('newSessionAmount').value);
      const currency = document.getElementById('newSessionCurrency')?.value || 'XOF';
      const title = document.getElementById('newSessionTitle')?.value || '';

      if (!amount || isNaN(amount) || amount <= 0 || !customer_name || !customer_email) {
        showToast("Erreur", "Remplissez tous les champs obligatoires avec un montant valide.");
        return;
      }

      try {
        const res = await fetch('/api/v1/merchant/checkout-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ customer_name, customer_email, customer_phone, amount, currency, title })
        });
        const data = await res.json();
        if (data.success && data.session) {
          VPState.checkoutSessions.unshift(data.session);
          renderCheckoutSessionsList();
          renderCustomersList();
          closeModal('modalCreateCheckoutSession');
          form.reset();
          showToast("Session créée !", `Lien généré pour ${customer_name}`);
        } else {
          showToast("Erreur", data.error || "Impossible de créer la session.");
        }
      } catch (err) {
        showToast("Erreur", err.message);
      }
    });
  }
}

/* ========================================================
   SECTION 6 : RENDU DU RÉPERTOIRE CLIENTS (100% CONFORME CAPTURE)
   ======================================================== */

async function renderCustomersList() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" class="py-10 text-center text-slate-400 text-xs">Chargement des clients...</td></tr>';

  try {
    const params = new URLSearchParams({
      page: VPState.customersPage,
      limit: VPState.customersPageSize
    });
    if (VPState.customersSearchQuery) params.append('search', VPState.customersSearchQuery);

    const res = await fetch(`/api/v1/merchant/customers?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    const list = (data.success && data.customers) ? data.customers : [];
    const total = data.pagination?.total ?? list.length;
    VPState.customers = list;
    VPState.customersTotal = total;

    tbody.innerHTML = '';

    if (!list || list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="py-12 text-center text-slate-400 text-xs">
            <div class="flex flex-col items-center justify-center">
              <span class="text-2xl mb-2">👥</span>
              <span class="text-xs font-semibold text-[#111827]">Aucun client répertorié</span>
              <span class="text-[11px] text-slate-400 mt-0.5">Vos acheteurs apparaîtront automatiquement lors de leurs paiements.</span>
            </div>
          </td>
        </tr>
      `;
      updateCustomersPagination(0, 0, 0);
      return;
    }

    list.forEach(c => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F8F9FD] transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[#EDE9FE] text-[#0052FF] flex items-center justify-center font-bold text-xs flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <span class="font-bold text-xs text-[#111827]">${c.name}</span>
          </div>
        </td>
        <td class="py-3.5 px-3">
          <div class="text-xs text-slate-600 font-mono">${c.email}</div>
          <div class="text-[11px] text-slate-400 font-mono mt-0.5">${c.phone}</div>
        </td>
        <td class="py-3.5 px-3">
          <span class="text-xs text-slate-700 font-medium">${c.country_code} ${c.country_name}</span>
        </td>
        <td class="py-3.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openCustomerDetailsModal('${c.id}')" class="text-slate-400 hover:text-[#0052FF] p-1.5 transition-colors" title="Détails du client">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            <button onclick="deleteCustomer('${c.id}')" class="text-rose-500 hover:text-rose-700 p-1.5 transition-colors" title="Supprimer client">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    const start = (VPState.customersPage - 1) * VPState.customersPageSize + 1;
    const end = Math.min(VPState.customersPage * VPState.customersPageSize, total);
    updateCustomersPagination(start, end, total);
  } catch (err) {
    console.error('Erreur renderCustomersList:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-rose-500 text-xs">Erreur: ${err.message}</td></tr>`;
  }
}

function updateCustomersPagination(start, end, total) {
  const info = document.getElementById('customersPaginationInfo');
  if (info) info.textContent = `${total === 0 ? 0 : start}-${end} sur ${total}`;
  const btnPrev = document.getElementById('btnPrevCustomers');
  const btnNext = document.getElementById('btnNextCustomers');
  if (btnPrev) btnPrev.disabled = VPState.customersPage <= 1;
  if (btnNext) btnNext.disabled = end >= total;
}

function openCreateCustomerModal() {
  openModal('modalCreateCustomer');
}

function openCustomerDetailsModal(id) {
  const c = (VPState.customers || []).find(item => item.id === id);
  if (!c) return;
  const content = document.getElementById('customerDetailsContent');
  if (!content) return;
  content.innerHTML = `
    <div class="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-purple-100">
      <div class="w-12 h-12 rounded-full bg-[#EDE9FE] text-[#0052FF] flex items-center justify-center font-bold text-lg flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      </div>
      <div>
        <h4 class="text-sm font-bold text-[#111827]">${c.name}</h4>
        <p class="text-xs text-slate-500 font-mono">${c.email}</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3 text-xs">
      <div class="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF6]">
        <span class="text-slate-400 block text-[10px]">Téléphone</span>
        <span class="font-mono font-bold text-[#111827]">${c.phone}</span>
      </div>
      <div class="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF6]">
        <span class="text-slate-400 block text-[10px]">Pays</span>
        <span class="font-bold text-[#111827]">${c.country_code} — ${c.country_name}</span>
      </div>
      <div class="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF6]">
        <span class="text-slate-400 block text-[10px]">Achats effectués</span>
        <span class="font-bold text-[#111827]">${c.purchases || 0}</span>
      </div>
      <div class="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF6]">
        <span class="text-slate-400 block text-[10px]">Volume Total Dépensé</span>
        <span class="font-mono font-bold text-emerald-600">${parseFloat(c.total || 0).toLocaleString('fr-FR')} XOF</span>
      </div>
    </div>
  `;
  openModal('modalCustomerDetails');
}

async function deleteCustomer(id) {
  if (!confirm('Supprimer ce client de votre répertoire ?')) return;
  try {
    const res = await fetch(`/api/v1/merchant/customers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    if (data.success) {
      VPState.customers = (VPState.customers || []).filter(c => c.id !== id);
      renderCustomersList();
      showToast('Supprimé', 'Client supprimé avec succès.');
    } else {
      showToast('Erreur', data.error || 'Impossible de supprimer.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

function initCustomersSection() {
  const searchInput = document.getElementById('customersSearchInput');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        VPState.customersSearchQuery = e.target.value;
        VPState.customersPage = 1;
        renderCustomersList();
      }, 300);
    });
  }

  const pageSize = document.getElementById('customersPageSize');
  if (pageSize) {
    pageSize.addEventListener('change', (e) => {
      VPState.customersPageSize = parseInt(e.target.value);
      VPState.customersPage = 1;
      renderCustomersList();
    });
  }

  const btnPrev = document.getElementById('btnPrevCustomers');
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (VPState.customersPage > 1) {
        VPState.customersPage -= 1;
        renderCustomersList();
      }
    });
  }

  const btnNext = document.getElementById('btnNextCustomers');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      VPState.customersPage += 1;
      renderCustomersList();
    });
  }

  const form = document.getElementById('createCustomerForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newCustomerName').value;
      const email = document.getElementById('newCustomerEmail').value;
      const phone = document.getElementById('newCustomerPhone').value;
      const country = document.getElementById('newCustomerCountry')?.value || 'CI';

      if (!name || !email) {
        showToast("Erreur", "Le nom et l'email sont obligatoires.");
        return;
      }

      try {
        const res = await fetch('/api/v1/merchant/customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ name, email, phone, country })
        });
        const data = await res.json();
        if (data.success && data.customer) {
          if (!VPState.customers) VPState.customers = [];
          VPState.customers.unshift(data.customer);
          renderCustomersList();
          closeModal('modalCreateCustomer');
          form.reset();
          showToast("Client ajouté !", `${data.customer.name} est enregistré.`);
        } else {
          showToast("Erreur", data.error || "Impossible d'enregistrer le client.");
        }
      } catch (err) {
        showToast("Erreur", err.message);
      }
    });
  }
}

/* ========================================================
   SECTION 12 : LITIGES (100% CONFORME CAPTURE)
   ======================================================== */

async function renderDisputes() {
  try {
    const res = await fetch('/api/v1/merchant/disputes', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    VPState.disputes = (data.success && data.disputes) ? data.disputes : [];
  } catch (e) {
    VPState.disputes = [];
  }
}

function initDisputesSection() {
  const filter = document.getElementById('disputesStatusFilter');
  if (filter) {
    filter.addEventListener('change', (e) => {
      VPState.disputesStatusFilter = e.target.value;
      renderDisputes();
    });
  }
}

/* ========================================================
   5. WALLETS MULTI-DEVISES, LEDGER & TRANSFERTS (100% CONFORME SASPAY)
   ======================================================== */

const REGION_NAMES = new Intl.DisplayNames(['fr'], { type: 'region' });

const COUNTRY_FLAGS = {
  'TG': '🇹🇬',
  'XC': '🌐',
  'ZM': '🇿🇲',
  'US_INTL': '🇺🇸',
  'US': '🇺🇸',
  'UG': '🇺🇬',
  'TZ': '🇹🇿',
  'SN': '🇸🇳',
  'RW': '🇷🇼',
  'NG': '🇳🇬',
  'NE': '🇳🇪',
  'MZ': '🇲🇿',
  'MW': '🇲🇼',
  'ML': '🇲🇱',
  'KE': '🇰🇪',
  'IN': '🇮🇳',
  'GN': '🇬🇳',
  'GH': '🇬🇭',
  'GA': '🇬🇦',
  'CM': '🇨🇲',
  'CI': '🇨🇮',
  'CG': '🇨🇬',
  'CD': '🇨🇩',
  'BJ': '🇧🇯',
  'BF': '🇧🇫'
};

const COUNTRY_NAMES = {
  'TG': 'Togo',
  'XC': 'XC',
  'ZM': 'Zambie',
  'US_INTL': 'International (USD)',
  'US': 'États-Unis',
  'UG': 'Ouganda',
  'TZ': 'Tanzanie',
  'SN': 'Sénégal',
  'RW': 'Rwanda',
  'NG': 'Nigeria',
  'NE': 'Niger',
  'MZ': 'Mozambique',
  'MW': 'Malawi',
  'ML': 'Mali',
  'KE': 'Kenya',
  'IN': 'Inde',
  'GN': 'Guinée',
  'GH': 'Ghana',
  'GA': 'Gabon',
  'CM': 'Cameroun',
  'CI': 'Côte d\'Ivoire',
  'CG': 'Congo',
  'CD': 'Congo (République démocratique du)',
  'BJ': 'Bénin',
  'BF': 'Burkina Faso'
};

function getCountryFlag(code) {
  if (COUNTRY_FLAGS[code]) return COUNTRY_FLAGS[code];
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
}

function getCountryName(code) {
  if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
  try {
    return REGION_NAMES.of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

function formatWalletMoney(amount, currency = '') {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.abs(amount || 0));
  return currency ? `${formatted} ${currency}` : formatted;
}

const WALLET_EXCHANGE_RATES = {
  'XOF/XOF': 1.0,
  'XAF/XAF': 1.0,
  'XOF/XAF': 1.0,
  'XAF/XOF': 1.0,
  'USD/XOF': 605.0,
  'XOF/USD': 1 / 605.0,
  'USD/XAF': 605.0,
  'XAF/USD': 1 / 605.0,
  'ZMW/XOF': 23.5,
  'XOF/ZMW': 1 / 23.5,
  'UGX/XOF': 0.16,
  'XOF/UGX': 6.25,
  'TZS/XOF': 0.23,
  'XOF/TZS': 4.35,
  'RWF/XOF': 0.44,
  'XOF/RWF': 2.27,
  'NGN/XOF': 0.41,
  'XOF/NGN': 2.44,
  'MZN/XOF': 9.5,
  'XOF/MZN': 0.105,
  'MWK/XOF': 0.35,
  'XOF/MWK': 2.85,
  'KES/XOF': 4.65,
  'XOF/KES': 0.215,
  'INR/XOF': 7.2,
  'XOF/INR': 0.138,
  'CDF/XOF': 0.22,
  'XOF/CDF': 4.54,
  'GNF/XOF': 0.07,
  'XOF/GNF': 14.28,
  'GHS/XOF': 40.0,
  'XOF/GHS': 0.025
};

function getInterwalletRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1.0;
  const directKey = `${fromCurrency}/${toCurrency}`;
  if (WALLET_EXCHANGE_RATES[directKey]) return WALLET_EXCHANGE_RATES[directKey];
  const toXof = WALLET_EXCHANGE_RATES[`${fromCurrency}/XOF`] || (WALLET_EXCHANGE_RATES[`XOF/${fromCurrency}`] ? 1 / WALLET_EXCHANGE_RATES[`XOF/${fromCurrency}`] : 1.0);
  const fromXof = WALLET_EXCHANGE_RATES[`XOF/${toCurrency}`] || (WALLET_EXCHANGE_RATES[`${toCurrency}/XOF`] ? 1 / WALLET_EXCHANGE_RATES[`${toCurrency}/XOF`] : 1.0);
  return toXof * fromXof;
}

function renderDetailedWallets() {
  const container = document.getElementById('allWalletsDetailedGrid');
  if (!container) return;

  container.innerHTML = '';
  VPState.wallets.forEach(w => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-3xl bg-white border border-[#ECEEF6] shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-400 font-mono tracking-wider">${w.code}</span>
          <span class="text-xl">${w.flag}</span>
        </div>
        <h4 class="text-xs font-bold text-[#111827] mb-1 truncate">${w.name}</h4>
        <div class="text-2xl font-black text-[#111827] font-mono my-2">
          ${w.balance.toLocaleString('fr-FR')} ${w.symbol}
        </div>
      </div>
      <div class="pt-3 border-t border-[#F0F2F9] flex items-center justify-between text-xs">
        <button class="text-[#0052FF] font-bold hover:underline" onclick="showToast('Dépôt', 'Option de rechargement disponible.');">Dépôt</button>
        <button class="text-slate-500 font-medium hover:text-[#111827]" onclick="openWalletTransferModal()">Transférer</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function loadAndRenderWallets() {
  const grid = document.getElementById('walletCardsGrid');
  const merchantNameEl = document.getElementById('walletMerchantName');
  if (merchantNameEl && VPState.merchant) {
    merchantNameEl.textContent = VPState.merchant.business_name || 'VANDIA IA';
  }

  try {
    const res = await fetch('/api/v1/merchant/wallets', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success || !Array.isArray(data.wallets)) return;

    VPState.walletsList = data.wallets;

    // Trier : portefeuilles avec solde disponible > 0 en tête, puis ordre décroissant des pays
    const SASPAY_CANONICAL_ORDER = [
      'TG', 'XC', 'ZM', 'US_INTL', 'US', 'UG', 'TZ', 'SN', 'RW',
      'NG', 'NE', 'MZ', 'MW', 'ML', 'KE', 'IN', 'GN', 'GH', 'GA',
      'CM', 'CI', 'CG', 'CD', 'BJ', 'BF'
    ];

    const sorted = [...data.wallets].sort((a, b) => {
      const balA = parseFloat(a.available_amount || 0);
      const balB = parseFloat(b.available_amount || 0);
      if (balB > 0 && balA <= 0) return 1;
      if (balA > 0 && balB <= 0) return -1;
      if (balA > 0 && balB > 0) return balB - balA;
      const idxA = SASPAY_CANONICAL_ORDER.indexOf(a.country);
      const idxB = SASPAY_CANONICAL_ORDER.indexOf(b.country);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    if (grid) {
      grid.innerHTML = '';
      sorted.forEach(w => {
        const flag = getCountryFlag(w.country);
        const name = getCountryName(w.country);
        const isFrozen = w.is_frozen === true;
        const available = parseFloat(w.available_amount || 0);
        const pending = parseFloat(w.pending_amount || 0);
        const frozen = parseFloat(w.frozen_amount || 0);

        const card = document.createElement('div');
        card.className = 'rounded-3xl border border-[#ECEEF6] bg-white p-5 sm:p-6 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between min-h-[145px]';
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-bold text-sm text-[#111827]">
                <span class="font-extrabold text-sm mr-1">${flag}</span>
                <span>${name}</span>
              </div>
              ${isFrozen ? '<span class="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">Gelé</span>' : ''}
            </div>
            <div class="mt-3">
              <p class="text-xs text-[#6B7280] font-normal">Disponible</p>
              <p class="text-2xl font-black text-[#111827] font-mono mt-0.5 tracking-tight">${formatWalletMoney(available)} ${w.currency}</p>
            </div>
          </div>
          ${(pending > 0 || frozen > 0) ? `
          <div class="grid grid-cols-2 gap-2 pt-2.5 mt-3 border-t border-[#F0F2F9]">
            <div class="rounded-xl bg-blue-50/50 p-2">
              <span class="text-[10px] font-medium text-[#6B7280] block">En attente</span>
              <p class="text-xs font-bold text-[#111827] font-mono mt-0.5">${formatWalletMoney(pending)} ${w.currency}</p>
            </div>
            <div class="rounded-xl bg-blue-50/50 p-2">
              <span class="text-[10px] font-medium text-[#6B7280] block">Gelé (litige)</span>
              <p class="text-xs font-bold ${frozen > 0 ? 'text-rose-600' : 'text-[#111827]'} font-mono mt-0.5">${formatWalletMoney(frozen)} ${w.currency}</p>
            </div>
          </div>` : ''}
        `;
        grid.appendChild(card);
      });
    }

    // Mettre à jour les filtres pays et les cartes d'overview
    populateWalletCountryFilter(data.wallets);
    renderOverviewDashboardKPIs();
  } catch (err) {
    console.error('Erreur chargement wallets:', err);
  }
}

function populateWalletCountryFilter(wallets) {
  const select = document.getElementById('walletLedgerCountrySelect');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">Tous les pays</option>';

  const countries = Array.from(new Set(wallets.map(w => w.country))).sort();
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = `${getCountryFlag(c)} ${getCountryName(c)}`;
    if (c === currentVal) opt.selected = true;
    select.appendChild(opt);
  });
}

async function loadAndRenderWalletLedger() {
  const tbody = document.getElementById('walletLedgerTableBody');
  const countInfo = document.getElementById('walletLedgerCountInfo');
  const paginationContainer = document.getElementById('walletLedgerPaginationBtns');
  if (!tbody) return;

  try {
    const params = new URLSearchParams();
    if (VPState.ledgerCountryFilter) params.append('country', VPState.ledgerCountryFilter);
    if (VPState.ledgerSearchFilter) params.append('search', VPState.ledgerSearchFilter);
    params.append('page', VPState.ledgerPage || 1);
    params.append('limit', VPState.ledgerLimit || 10);

    const res = await fetch(`/api/v1/merchant/wallet/ledger?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    VPState.ledgerMovements = data.movements || [];
    const total = data.pagination?.total || 0;
    const totalPages = data.pagination?.total_pages || 1;
    VPState.ledgerTotalPages = totalPages;

    if (countInfo) {
      const startIndex = total === 0 ? 0 : ((VPState.ledgerPage - 1) * VPState.ledgerLimit) + 1;
      const endIndex = Math.min(VPState.ledgerPage * VPState.ledgerLimit, total);
      countInfo.textContent = `Affichage de ${startIndex} à ${endIndex} sur ${total} mouvement${total > 1 ? 's' : ''}`;
    }

    tbody.innerHTML = '';
    if (VPState.ledgerMovements.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-10 text-center text-slate-400 text-xs">
            <div class="flex flex-col items-center justify-center">
              <span class="text-xl mb-1">📜</span>
              <span class="font-semibold text-[#111827]">Aucun mouvement trouvé</span>
              <span class="text-[11px] text-slate-400 mt-0.5">Aucun flux financier ne correspond à vos filtres.</span>
            </div>
          </td>
        </tr>
      `;
    } else {
      VPState.ledgerMovements.forEach(m => {
        const isCredit = m.direction === 'CREDIT';
        const typeLabels = {
          'COLLECTION': 'Encaissement',
          'PAYOUT': 'Retrait',
          'TRANSFER_IN': 'Transfert entrant',
          'TRANSFER_OUT': 'Transfert sortant',
          'FEE': 'Frais de service',
          'ADJUSTMENT': 'Ajustement',
          'REVERSAL': 'Régularisation'
        };
        const typeLabel = typeLabels[m.type] || m.type;

        let typeIcon = isCredit
          ? `<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold text-xs">↓</span>`
          : `<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 font-bold text-xs">↑</span>`;

        if (m.type === 'ADJUSTMENT') {
          typeIcon = `<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF] font-bold text-xs">↕</span>`;
        }

        const dateStr = formatTxDate(m.created_at);
        const flag = getCountryFlag(m.country);
        const countryName = getCountryName(m.country);
        const sign = isCredit ? '+' : '-';
        const amountColor = isCredit ? 'text-emerald-600' : 'text-rose-600';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-[#F8F9FD] transition-colors';
        tr.innerHTML = `
          <td class="py-3 px-3">
            <div class="flex items-center gap-2.5">
              ${typeIcon}
              <span class="font-semibold text-[#111827] text-xs">${typeLabel}</span>
            </div>
          </td>
          <td class="py-3 px-3 font-medium text-[#111827]">
            <span class="mr-1">${flag}</span> ${countryName}
          </td>
          <td class="py-3 px-3 text-slate-600 max-w-xs truncate" title="${m.description || ''}">
            ${m.description || 'Opération'}
          </td>
          <td class="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
            ${dateStr}
          </td>
          <td class="py-3 px-3 text-right font-mono font-bold text-xs ${amountColor} whitespace-nowrap">
            ${sign}${formatWalletMoney(m.amount, m.currency)}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    if (paginationContainer) {
      paginationContainer.innerHTML = '';
      if (totalPages > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = `px-2.5 py-1 rounded-lg border border-[#ECEEF6] bg-white text-xs font-semibold ${VPState.ledgerPage > 1 ? 'hover:bg-slate-50 text-[#111827]' : 'text-slate-300 cursor-not-allowed'}`;
        prevBtn.textContent = '←';
        prevBtn.disabled = VPState.ledgerPage <= 1;
        prevBtn.onclick = () => {
          if (VPState.ledgerPage > 1) {
            VPState.ledgerPage--;
            loadAndRenderWalletLedger();
          }
        };
        paginationContainer.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
          const pageBtn = document.createElement('button');
          const isCurr = i === VPState.ledgerPage;
          pageBtn.className = `px-2.5 py-1 rounded-lg text-xs font-semibold ${isCurr ? 'bg-[#0052FF] text-white shadow-sm' : 'border border-[#ECEEF6] bg-white text-[#111827] hover:bg-slate-50'}`;
          pageBtn.textContent = i;
          pageBtn.onclick = () => {
            VPState.ledgerPage = i;
            loadAndRenderWalletLedger();
          };
          paginationContainer.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = `px-2.5 py-1 rounded-lg border border-[#ECEEF6] bg-white text-xs font-semibold ${VPState.ledgerPage < totalPages ? 'hover:bg-slate-50 text-[#111827]' : 'text-slate-300 cursor-not-allowed'}`;
        nextBtn.textContent = '→';
        nextBtn.disabled = VPState.ledgerPage >= totalPages;
        nextBtn.onclick = () => {
          if (VPState.ledgerPage < totalPages) {
            VPState.ledgerPage++;
            loadAndRenderWalletLedger();
          }
        };
        paginationContainer.appendChild(nextBtn);
      }
    }
  } catch (err) {
    console.error('Erreur chargement ledger wallet:', err);
  }
}

async function loadAndRenderWalletTransfers() {
  const tbody = document.getElementById('walletTransfersTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/v1/merchant/wallet/transfers', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    VPState.walletTransfers = data.transfers || [];
    tbody.innerHTML = '';

    if (VPState.walletTransfers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="py-8 text-center text-slate-400 text-xs">
            <div class="flex flex-col items-center justify-center">
              <span class="text-xl mb-1">🔁</span>
              <span class="font-semibold text-[#111827]">Aucun transfert entre wallets</span>
              <span class="text-[11px] text-slate-400 mt-0.5">Utilisez le bouton "Transférer entre wallets" pour déplacer vos fonds d'un pays à l'autre.</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    VPState.walletTransfers.forEach(t => {
      const fromFlag = getCountryFlag(t.from_country);
      const toFlag = getCountryFlag(t.to_country);
      const fromName = getCountryName(t.from_country);
      const toName = getCountryName(t.to_country);

      let statusBadge = `<span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Terminé</span>`;
      if (t.status === 'PENDING') {
        statusBadge = `<span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">En cours</span>`;
      } else if (t.status === 'REJECTED') {
        statusBadge = `<span class="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">Rejeté</span>`;
      }

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F8F9FD] transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-3">
          <div class="flex items-center gap-1.5 font-bold text-[#111827] text-xs">
            <span>${fromFlag} ${fromName}</span>
            <span class="text-slate-400">→</span>
            <span>${toFlag} ${toName}</span>
          </div>
        </td>
        <td class="py-3 px-3 font-mono font-bold text-xs text-[#111827]">
          ${formatWalletMoney(t.from_amount, t.from_currency)} <span class="text-slate-400 font-normal">→</span> ${formatWalletMoney(t.to_amount, t.to_currency)}
        </td>
        <td class="py-3 px-3">
          ${statusBadge}
        </td>
        <td class="py-3 px-3 text-right">
          <button type="button" onclick="openWalletTransferDetailModal('${t.id}')" class="text-xs font-semibold text-[#0052FF] hover:underline">
            Détail
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erreur chargement transferts:', err);
  }
}

function getWalletInfo(countryCode) {
  if (VPState.walletsList && VPState.walletsList.length > 0) {
    const found = VPState.walletsList.find(w => w.country === countryCode);
    if (found) return found;
  }
  const fromBase = (VPState.wallets || []).find(w => w.country === countryCode);
  const isXof = fromBase && (fromBase.code === 'XOF');
  return {
    country: countryCode,
    currency: fromBase ? fromBase.code : 'XOF',
    available_amount: isXof && VPState.merchant ? parseFloat(VPState.merchant.balance_fcfa || 0) : (fromBase ? parseFloat(fromBase.balance || 0) : 0),
    is_frozen: false
  };
}

function openWalletTransferModal() {
  const fromSelect = document.getElementById('transferFromCountry');
  const toSelect = document.getElementById('transferToCountry');
  const amountInput = document.getElementById('transferAmountInput');

  if (!fromSelect || !toSelect) return;

  fromSelect.innerHTML = '<option value="" disabled selected>Choisir un pays source</option>';
  toSelect.innerHTML = '<option value="" disabled selected>Choisir un pays de destination</option>';

  const canonicalOrder = [
    'TG', 'XC', 'ZM', 'US_INTL', 'US', 'UG', 'TZ', 'SN', 'RW',
    'NG', 'NE', 'MZ', 'MW', 'ML', 'KE', 'IN', 'GN', 'GH', 'GA',
    'CM', 'CI', 'CG', 'CD', 'BJ', 'BF'
  ];

  // Remplir TOUS les 25 pays avec leur solde réel pour chaque compte
  canonicalOrder.forEach(countryCode => {
    const w = getWalletInfo(countryCode);
    const opt = document.createElement('option');
    opt.value = w.country;
    const avail = parseFloat(w.available_amount || 0);
    opt.textContent = `${getCountryFlag(w.country)} ${getCountryName(w.country)} — Solde : ${formatWalletMoney(avail, w.currency)}`;
    opt.setAttribute('data-currency', w.currency);
    opt.setAttribute('data-balance', avail);
    fromSelect.appendChild(opt);
  });

  // Sélectionner le premier pays par défaut
  fromSelect.selectedIndex = 1;
  const initialSourceCountry = fromSelect.value;
  updateTransferSourceDisplay();
  populateTransferDestinationOptions(initialSourceCountry);

  if (amountInput) amountInput.value = '';
  updateTransferEstimate();
  openModal('modalWalletTransfer');
}

function updateTransferSourceDisplay() {
  const fromSelect = document.getElementById('transferFromCountry');
  const badge = document.getElementById('transferSourceBalanceDisplay');
  const currLabel = document.getElementById('transferSourceCurrencyLabel');
  if (!fromSelect || !fromSelect.value) return;

  const w = getWalletInfo(fromSelect.value);
  const avail = parseFloat(w.available_amount || 0);
  if (badge) {
    badge.textContent = `${formatWalletMoney(avail, w.currency)}`;
  }
  if (currLabel) {
    currLabel.textContent = `(${w.currency})`;
  }
}

function updateTransferDestDisplay() {
  const toSelect = document.getElementById('transferToCountry');
  const badge = document.getElementById('transferDestBalanceDisplay');
  if (!toSelect || !toSelect.value) return;

  const w = getWalletInfo(toSelect.value);
  const avail = parseFloat(w.available_amount || 0);
  if (badge) {
    badge.textContent = `${formatWalletMoney(avail, w.currency)}`;
  }
}

function populateTransferDestinationOptions(sourceCountry) {
  const toSelect = document.getElementById('transferToCountry');
  if (!toSelect) return;

  toSelect.innerHTML = '<option value="" disabled selected>Choisir un pays de destination</option>';
  const canonicalOrder = [
    'TG', 'XC', 'ZM', 'US_INTL', 'US', 'UG', 'TZ', 'SN', 'RW',
    'NG', 'NE', 'MZ', 'MW', 'ML', 'KE', 'IN', 'GN', 'GH', 'GA',
    'CM', 'CI', 'CG', 'CD', 'BJ', 'BF'
  ];

  canonicalOrder.filter(c => c !== sourceCountry).forEach(countryCode => {
    const w = getWalletInfo(countryCode);
    const opt = document.createElement('option');
    opt.value = w.country;
    const avail = parseFloat(w.available_amount || 0);
    opt.textContent = `${getCountryFlag(w.country)} ${getCountryName(w.country)} (${w.currency}) — Solde actuel : ${formatWalletMoney(avail, w.currency)}`;
    opt.setAttribute('data-currency', w.currency);
    opt.setAttribute('data-balance', avail);
    toSelect.appendChild(opt);
  });

  if (toSelect.options.length > 1) {
    toSelect.selectedIndex = 1;
  }
  updateTransferDestDisplay();
}

function updateTransferEstimate() {
  const fromSelect = document.getElementById('transferFromCountry');
  const toSelect = document.getElementById('transferToCountry');
  const amountInput = document.getElementById('transferAmountInput');
  const estimateEl = document.getElementById('transferConversionEstimate');

  if (!fromSelect || !toSelect || !amountInput || !estimateEl) return;

  const fromCountry = fromSelect.value;
  const toCountry = toSelect.value;
  const amount = parseFloat(amountInput.value || 0);

  const sourceW = getWalletInfo(fromCountry);
  const destW = getWalletInfo(toCountry);

  updateTransferSourceDisplay();
  updateTransferDestDisplay();

  if (!sourceW || !destW || amount <= 0) {
    estimateEl.classList.add('hidden');
    return;
  }

  const rate = getInterwalletRate(sourceW.currency, destW.currency);
  const converted = amount * rate;
  const avail = parseFloat(sourceW.available_amount || 0);

  estimateEl.classList.remove('hidden');
  if (amount > avail) {
    estimateEl.innerHTML = `
      <div class="text-rose-600 font-bold">⚠️ Solde insuffisant : Disponible ${formatWalletMoney(avail, sourceW.currency)}</div>
      <div class="text-slate-500 text-[11px] mt-0.5">≈ ${formatWalletMoney(converted, destW.currency)} recevraient (Taux : 1 ${sourceW.currency} = ${rate.toFixed(4)} ${destW.currency})</div>
    `;
  } else {
    estimateEl.innerHTML = `
      ≈ <span class="font-bold text-[#111827]">${formatWalletMoney(converted, destW.currency)}</span> crédité sur le compte destinataire
      <span class="text-slate-500 text-[11px] block mt-0.5">Taux de conversion : 1 ${sourceW.currency} = ${rate.toFixed(4)} ${destW.currency}</span>
    `;
  }
}

function openWalletTransferDetailModal(transferId) {
  const t = (VPState.walletTransfers || []).find(x => x.id === transferId);
  if (!t) return;

  const routeEl = document.getElementById('transferDetailRoute');
  const listEl = document.getElementById('transferDetailList');

  if (routeEl) {
    routeEl.innerHTML = `
      ${getCountryFlag(t.from_country)} ${getCountryName(t.from_country)}
      <span class="text-slate-400">→</span>
      ${getCountryFlag(t.to_country)} ${getCountryName(t.to_country)}
    `;
  }

  if (listEl) {
    const grossAmount = t.from_amount * (t.exchange_rate || 1.0);
    const dateFormatted = formatTxDate(t.created_at);

    listEl.innerHTML = `
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Montant envoyé</span>
        <span class="font-bold text-[#111827] font-mono">${formatWalletMoney(t.from_amount, t.from_currency)}</span>
      </div>
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Taux de change appliqué</span>
        <span class="font-semibold text-[#111827] font-mono text-xs">1 ${t.from_currency} = ${t.exchange_rate} ${t.to_currency}</span>
      </div>
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Montant converti brut</span>
        <span class="font-bold text-[#111827] font-mono">${formatWalletMoney(grossAmount, t.to_currency)}</span>
      </div>
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Frais inter-wallets</span>
        <span class="font-bold text-emerald-600 font-mono">0 ${t.to_currency} (Gratuit)</span>
      </div>
      <div class="py-3 flex items-center justify-between bg-blue-50/40 p-3 rounded-2xl">
        <span class="font-bold text-[#111827]">Montant net crédité</span>
        <span class="font-black text-emerald-600 font-mono text-base">${formatWalletMoney(t.to_amount, t.to_currency)}</span>
      </div>
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Statut</span>
        <span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Terminé</span>
      </div>
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Date & heure</span>
        <span class="text-slate-700 font-mono text-xs">${dateFormatted}</span>
      </div>
      <div class="py-3 flex items-center justify-between">
        <span class="text-slate-500">Référence</span>
        <span class="font-mono text-slate-400 text-[11px]">${t.id}</span>
      </div>
    `;
  }

  openModal('modalWalletTransferDetail');
}

function initWalletSection() {
  const searchInput = document.getElementById('walletLedgerSearchInput');
  const countrySelect = document.getElementById('walletLedgerCountrySelect');
  const fromSelect = document.getElementById('transferFromCountry');
  const toSelect = document.getElementById('transferToCountry');
  const amountInput = document.getElementById('transferAmountInput');
  const formTransfer = document.getElementById('formWalletTransfer');

  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        VPState.ledgerSearchFilter = e.target.value;
        VPState.ledgerPage = 1;
        loadAndRenderWalletLedger();
      }, 300);
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', (e) => {
      VPState.ledgerCountryFilter = e.target.value;
      VPState.ledgerPage = 1;
      loadAndRenderWalletLedger();
    });
  }

  if (fromSelect) {
    fromSelect.addEventListener('change', (e) => {
      populateTransferDestinationOptions(e.target.value);
      updateTransferEstimate();
    });
  }

  if (toSelect) {
    toSelect.addEventListener('change', () => {
      updateTransferEstimate();
    });
  }

  if (amountInput) {
    amountInput.addEventListener('input', () => {
      updateTransferEstimate();
    });
  }

  if (formTransfer) {
    formTransfer.addEventListener('submit', async (e) => {
      e.preventDefault();
      const from_country = fromSelect ? fromSelect.value : '';
      const to_country = toSelect ? toSelect.value : '';
      const amount = amountInput ? parseFloat(amountInput.value) : 0;
      const submitBtn = document.getElementById('btnSubmitWalletTransfer');

      if (!from_country || !to_country || isNaN(amount) || amount <= 0) {
        showToast('Erreur', 'Veuillez renseigner tous les champs avec un montant valide.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transfert en cours...';
      }

      try {
        const res = await fetch('/api/v1/merchant/wallet/transfers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ from_country, to_country, amount })
        });

        const data = await res.json();
        if (data.success) {
          closeModal('modalWalletTransfer');
          showToast('Transfert réussi !', data.message);

          await loadAndRenderWallets();
          await loadAndRenderWalletLedger();
          await loadAndRenderWalletTransfers();

          if (VPState.merchant && data.source_wallet && data.source_wallet.country === 'SN') {
            VPState.merchant.balance_fcfa = data.source_wallet.available_amount;
            const xofEl = document.getElementById('xofWalletBalance');
            if (xofEl) xofEl.textContent = parseFloat(data.source_wallet.available_amount).toLocaleString('fr-FR');
          }
        } else {
          showToast('Erreur de transfert', data.error || 'Impossible d\'effectuer le transfert.');
        }
      } catch (err) {
        showToast('Erreur réseau', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Transférer';
        }
      }
    });
  }
}

/* ========================================================
   5.b RETRAITS & MÉTHODES DE RETRAIT (100% CONFORME SASPAY)
   ======================================================== */

function formatSasPayDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const isUtcIso = typeof isoString === 'string' && isoString.includes('T') && isoString.endsWith('Z');
  const day = isUtcIso ? d.getUTCDate() : d.getDate();
  const month = months[isUtcIso ? d.getUTCMonth() : d.getMonth()] || '';
  const year = isUtcIso ? d.getUTCFullYear() : d.getFullYear();
  const hours = String(isUtcIso ? d.getUTCHours() : d.getHours()).padStart(2, '0');
  const minutes = String(isUtcIso ? d.getUTCMinutes() : d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

async function loadAndRenderPayouts() {
  if (!VPState.token) return;
  try {
    const query = new URLSearchParams({
      page: VPState.payoutPage || 1,
      page_size: VPState.payoutPageSize || 20,
      search: VPState.payoutSearchQuery || ''
    });

    const res = await fetch(`/api/v1/merchant/payouts?${query.toString()}`, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });

    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    VPState.payoutsList = data.results || [];
    VPState.payoutCount = data.count || 0;
    VPState.payoutTotalPages = data.total_pages || 1;

    // Mise à jour dynamique du nom d'entreprise dans le sous-titre
    const subtitleName = document.getElementById('payoutsMerchantName');
    if (subtitleName && VPState.merchant) {
      subtitleName.textContent = VPState.merchant.business_name || 'VANDIA IA';
    }

    const tbody = document.getElementById('payoutsTableBody');
    if (!tbody) return;

    if (VPState.payoutsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-12 text-center text-xs text-[#6B7280]">
            <div class="flex flex-col items-center justify-center gap-2">
              <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              <p class="font-medium text-slate-500">Aucun retrait pour l'instant.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = VPState.payoutsList.map(p => {
        const dateStr = formatSasPayDate(p.created_at);

        let badgeHtml = '';
        const st = (p.status || '').toUpperCase();
        if (st === 'SUCCESS' || st === 'COMPLETED' || st === 'RÉUSSI') {
          badgeHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">Réussi</span>`;
        } else if (st === 'PENDING' || st === 'EN ATTENTE') {
          badgeHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">En attente</span>`;
        } else if (st === 'CANCELLED' || st === 'ANNULÉ') {
          badgeHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">Annulé</span>`;
        } else {
          badgeHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">Échoué</span>`;
        }

        const netAmount = parseFloat(p.net_amount || p.amount || 0);
        const netFormatted = `${netAmount.toLocaleString('fr-FR')} ${p.currency || 'XOF'}`;

        const cancelAction = (st === 'PENDING') ? `
          <button type="button" onclick="openCancelPayoutModal('${p.id}', '${p.reference}')" class="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors">
            Annuler
          </button>
        ` : '';

        return `
          <tr class="hover:bg-slate-50/60 transition-colors">
            <td class="py-3 px-4 font-semibold text-[#111827] text-xs font-mono select-all">
              ${p.reference}
            </td>
            <td class="py-3 px-4 text-[#6B7280] text-xs">
              ${dateStr}
            </td>
            <td class="py-3 px-4">
              ${badgeHtml}
            </td>
            <td class="py-3 px-4 text-right font-bold text-[#111827] text-xs">
              ${netFormatted}
            </td>
            <td class="py-3 px-4 text-right">
              ${cancelAction}
            </td>
          </tr>
        `;
      }).join('');
    }

    // Pagination
    const counterEl = document.getElementById('payoutPaginationCounter');
    const startIdx = VPState.payoutCount === 0 ? 0 : (VPState.payoutPage - 1) * VPState.payoutPageSize + 1;
    const endIdx = Math.min(VPState.payoutPage * VPState.payoutPageSize, VPState.payoutCount);
    if (counterEl) {
      counterEl.textContent = `${startIdx}-${endIdx} sur ${VPState.payoutCount}`;
    }

    const prevBtn = document.getElementById('btnPayoutPrevPage');
    const nextBtn = document.getElementById('btnPayoutNextPage');
    if (prevBtn) prevBtn.disabled = VPState.payoutPage <= 1;
    if (nextBtn) nextBtn.disabled = VPState.payoutPage >= VPState.payoutTotalPages;
  } catch (err) {
    console.error('Erreur chargement des retraits:', err);
  }
}

async function loadAndRenderPayoutMethods() {
  if (!VPState.token) return;
  try {
    const res = await fetch('/api/v1/merchant/payout-methods', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.success) return;

    VPState.payoutMethods = data.methods || [];

    const tbody = document.getElementById('payoutMethodsTableBody');
    if (tbody) {
      if (VPState.payoutMethods.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="py-12 text-center text-xs text-[#6B7280]">
              <p class="font-medium text-slate-500">Aucune méthode de retrait pour l'instant.</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = VPState.payoutMethods.map(m => {
          const isMobile = m.type === 'MOBILE_MONEY';
          const typeBadge = isMobile
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#0052FF]">Mobile Money</span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">Virement</span>`;
          
          const details = isMobile
            ? `${m.network_name || m.network || 'Mobile Money'} • <span class="font-mono">${m.phone_number || ''}</span>`
            : `${m.bank_name || 'Banque'} • ${m.account_holder_name || ''} <span class="font-mono text-slate-400">(${m.iban || m.account_number || ''})</span>`;

          return `
            <tr class="hover:bg-slate-50/60 transition-colors">
              <td class="py-3 px-4">${typeBadge}</td>
              <td class="py-3 px-4 font-semibold text-[#111827] text-xs">${m.label}</td>
              <td class="py-3 px-4 text-[#6B7280] text-xs">${details}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">Actif</span>
              </td>
              <td class="py-3 px-4 text-right">
                <button type="button" onclick="openDeletePayoutMethodModal('${m.id}', '${m.label.replace(/'/g, "\\'")}')" class="p-1 text-slate-400 hover:text-rose-600 transition-colors" title="Supprimer">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Mise à jour du dropdown méthode dans le formulaire de retrait
    const methodSelect = document.getElementById('payoutSelectSavedMethod');
    if (methodSelect) {
      if (VPState.payoutMethods.length === 0) {
        methodSelect.innerHTML = `<option value="" disabled selected>Aucune méthode enregistrée</option>`;
      } else {
        methodSelect.innerHTML = `
          <option value="" disabled selected>Choisir une méthode</option>
          ${VPState.payoutMethods.map(m => `
            <option value="${m.id}">${m.label} (${m.type === 'MOBILE_MONEY' ? (m.phone_number || m.network_name) : (m.bank_name || 'Virement')})</option>
          `).join('')}
        `;
      }
    }
  } catch (err) {
    console.error('Erreur chargement méthodes de retrait:', err);
  }
}

function switchPayoutSubTab(tabKey) {
  VPState.activePayoutSubTab = tabKey;
  const buttons = document.querySelectorAll('.payout-subtab-btn');
  const panels = document.querySelectorAll('.payout-subtab-panel');

  buttons.forEach(btn => {
    const k = btn.getAttribute('data-payout-tab');
    if (k === tabKey) {
      btn.className = 'payout-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all bg-[#0052FF] text-white shadow-[0_8px_18px_-8px_rgba(0, 82, 255,0.6)]';
    } else {
      btn.className = 'payout-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-[#6B7280] hover:bg-blue-50 hover:text-[#111827]';
    }
  });

  panels.forEach(p => {
    if (p.id === `payout-panel-${tabKey}`) {
      p.classList.remove('hidden');
    } else {
      p.classList.add('hidden');
    }
  });

  if (tabKey === 'settlements') {
    loadAndRenderPayouts();
  } else if (tabKey === 'methods') {
    loadAndRenderPayoutMethods();
  }
}

function initPayoutsSection() {
  // 1. Navigation des 2 sous-onglets
  const buttons = document.querySelectorAll('.payout-subtab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.getAttribute('data-payout-tab');
      switchPayoutSubTab(tabKey);
    });
  });

  // 2. Bascule du formulaire Demander un retrait
  const btnToggleRequest = document.getElementById('btnToggleRequestPayoutForm');
  const formRequest = document.getElementById('formRequestPayoutInline');
  const btnCancelRequest = document.getElementById('btnCancelInlinePayout');
  const walletSelect = document.getElementById('payoutSelectWallet');

  if (btnToggleRequest && formRequest) {
    btnToggleRequest.addEventListener('click', () => {
      const isHidden = formRequest.classList.contains('hidden');
      if (isHidden) {
        // Remplir la liste des wallets
        if (walletSelect) {
          const list = (VPState.walletsList && VPState.walletsList.length > 0)
            ? VPState.walletsList
            : (VPState.wallets || []).map(w => ({
                country: w.country,
                currency: w.code,
                available_amount: (w.code === 'XOF' && VPState.merchant) ? parseFloat(VPState.merchant.balance_fcfa || 0) : 0
              }));
          walletSelect.innerHTML = `
            <option value="" disabled selected>Choisir un pays</option>
            ${list.map(w => {
              const flag = getCountryFlag(w.country);
              const name = getCountryName(w.country);
              const amt = parseFloat(w.available_amount || 0).toLocaleString('fr-FR');
              return `<option value="${w.country}">${flag} ${name} — ${amt} ${w.currency} dispo.</option>`;
            }).join('')}
          `;
        }
        formRequest.classList.remove('hidden');
      } else {
        formRequest.classList.add('hidden');
      }
    });
  }

  if (btnCancelRequest && formRequest) {
    btnCancelRequest.addEventListener('click', () => {
      formRequest.classList.add('hidden');
    });
  }

  // 3. Soumission de la demande de retrait
  if (formRequest) {
    formRequest.addEventListener('submit', async (e) => {
      e.preventDefault();
      const country = walletSelect?.value;
      const methodId = document.getElementById('payoutSelectSavedMethod')?.value;
      const amount = parseFloat(document.getElementById('payoutInputAmount')?.value || 0);
      const submitBtn = document.getElementById('btnSubmitInlinePayout');
      const errorEl = document.getElementById('payoutInlineError');

      if (!country || !methodId || !amount || isNaN(amount) || amount <= 0) {
        if (errorEl) {
          errorEl.textContent = 'Veuillez sélectionner un wallet, une méthode et renseigner un montant valide.';
          errorEl.classList.remove('hidden');
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Traitement en cours...';
      }

      try {
        const res = await fetch('/api/v1/merchant/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({
            country,
            payout_method: methodId,
            requested_amount: amount
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast('Retrait demandé !', data.message || 'Votre demande de retrait a été enregistrée.');
          formRequest.reset();
          formRequest.classList.add('hidden');
          if (errorEl) errorEl.classList.add('hidden');

          await loadAndRenderPayouts();
          await loadAndRenderWallets();
          await loadAndRenderWalletLedger();
        } else {
          if (errorEl) {
            errorEl.textContent = data.error || 'Impossible d\'effectuer ce retrait.';
            errorEl.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmer la demande';
        }
      }
    });
  }

  // 4. Recherche de retraits avec debounce
  const searchInput = document.getElementById('payoutSearchQuery');
  if (searchInput) {
    let timer = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        VPState.payoutSearchQuery = e.target.value;
        VPState.payoutPage = 1;
        loadAndRenderPayouts();
      }, 300);
    });
  }

  // 5. Pagination
  const pageSizeSelect = document.getElementById('payoutPageSizeSelect');
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', (e) => {
      VPState.payoutPageSize = parseInt(e.target.value) || 20;
      VPState.payoutPage = 1;
      loadAndRenderPayouts();
    });
  }

  const prevBtn = document.getElementById('btnPayoutPrevPage');
  const nextBtn = document.getElementById('btnPayoutNextPage');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (VPState.payoutPage > 1) {
        VPState.payoutPage--;
        loadAndRenderPayouts();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (VPState.payoutPage < VPState.payoutTotalPages) {
        VPState.payoutPage++;
        loadAndRenderPayouts();
      }
    });
  }

  // 6. Bascule du formulaire d'ajout de méthode
  const btnToggleAddMethod = document.getElementById('btnToggleAddMethodForm');
  const formAddMethod = document.getElementById('formAddPayoutMethod');
  const btnCancelAddMethod = document.getElementById('btnCancelAddMethod');

  if (btnToggleAddMethod && formAddMethod) {
    btnToggleAddMethod.addEventListener('click', () => {
      formAddMethod.classList.toggle('hidden');
    });
  }

  if (btnCancelAddMethod && formAddMethod) {
    btnCancelAddMethod.addEventListener('click', () => {
      formAddMethod.classList.add('hidden');
    });
  }

  // Bascule type Mobile Money vs Bank Transfer
  const typeRadios = document.querySelectorAll('input[name="payoutMethodType"]');
  const fieldsMobile = document.getElementById('methodFieldsMobileMoney');
  const fieldsBank = document.getElementById('methodFieldsBank');

  typeRadios.forEach(r => {
    r.addEventListener('change', (e) => {
      if (e.target.value === 'MOBILE_MONEY') {
        fieldsMobile?.classList.remove('hidden');
        fieldsBank?.classList.add('hidden');
        document.getElementById('pmLabel')?.setAttribute('required', 'true');
        document.getElementById('pmBankLabel')?.removeAttribute('required');
      } else {
        fieldsMobile?.classList.add('hidden');
        fieldsBank?.classList.remove('hidden');
        document.getElementById('pmLabel')?.removeAttribute('required');
        document.getElementById('pmBankLabel')?.setAttribute('required', 'true');
      }
    });
  });

  // Soumission d'une nouvelle méthode
  if (formAddMethod) {
    formAddMethod.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = document.querySelector('input[name="payoutMethodType"]:checked')?.value || 'MOBILE_MONEY';
      let payload = {};

      if (type === 'MOBILE_MONEY') {
        payload = {
          type,
          label: document.getElementById('pmLabel')?.value,
          network: document.getElementById('pmNetwork')?.value,
          phone_number: document.getElementById('pmPhone')?.value
        };
      } else {
        payload = {
          type,
          label: document.getElementById('pmBankLabel')?.value,
          bank_name: document.getElementById('pmBankName')?.value,
          account_holder_name: document.getElementById('pmAccountHolder')?.value,
          account_number: document.getElementById('pmIban')?.value,
          iban: document.getElementById('pmIban')?.value,
          swift_bic: document.getElementById('pmSwift')?.value
        };
      }

      const submitBtn = document.getElementById('btnSubmitAddMethod');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistrement...';
      }

      try {
        const res = await fetch('/api/v1/merchant/payout-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          showToast('Méthode enregistrée !', 'Votre méthode de retrait est prête à être utilisée.');
          formAddMethod.reset();
          formAddMethod.classList.add('hidden');
          loadAndRenderPayoutMethods();
        } else {
          showToast('Erreur', data.error || 'Impossible d\'ajouter cette méthode.');
        }
      } catch (err) {
        showToast('Erreur réseau', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enregistrer la méthode';
        }
      }
    });
  }

  // 7. Modale de suppression d'une méthode
  const btnConfirmDelete = document.getElementById('btnConfirmDeleteMethod');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', confirmDeletePayoutMethod);
  }

  // 8. Modale d'annulation d'un retrait
  const btnConfirmCancel = document.getElementById('btnConfirmCancelPayout');
  if (btnConfirmCancel) {
    btnConfirmCancel.addEventListener('click', confirmCancelPayout);
  }
}

function openDeletePayoutMethodModal(id, label) {
  VPState.methodIdToDelete = id;
  const title = document.getElementById('deleteMethodModalTitle');
  if (title) title.textContent = `Supprimer "${label}" ?`;
  openModal('modalDeletePayoutMethod');
}

async function confirmDeletePayoutMethod() {
  if (!VPState.methodIdToDelete) return;
  try {
    const res = await fetch(`/api/v1/merchant/payout-methods/${VPState.methodIdToDelete}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Méthode supprimée', 'La méthode de retrait a bien été retirée.');
      closeModal('modalDeletePayoutMethod');
      loadAndRenderPayoutMethods();
    } else {
      showToast('Erreur', data.error || 'Impossible de supprimer cette méthode.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

function openCancelPayoutModal(id, reference) {
  VPState.payoutIdToCancel = id;
  const title = document.getElementById('cancelPayoutModalTitle');
  if (title) title.textContent = `Annuler le retrait "${reference}" ?`;
  openModal('modalCancelPayout');
}

async function confirmCancelPayout() {
  if (!VPState.payoutIdToCancel) return;
  try {
    const res = await fetch(`/api/v1/merchant/payouts/${VPState.payoutIdToCancel}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Retrait annulé', 'Le montant réservé a été reversé sur votre solde disponible.');
      closeModal('modalCancelPayout');
      loadAndRenderPayouts();
      loadAndRenderWallets();
    } else {
      showToast('Erreur', data.error || 'Impossible d\'annuler ce retrait.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

/* ========================================================
   5.c. SECTION DÉVELOPPEUR & CLÉS API (100% CONFORME SASPAY)
   ======================================================== */

function formatShortDate(isoString) {
  if (!isoString) return 'Récemment';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Récemment';
  }
}

function initDeveloperSection() {
  // 1. Navigation des 2 sous-onglets Développeur (Clés API / IP Whitelist)
  const buttons = document.querySelectorAll('.dev-subtab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-dev-tab');
      switchDevSubTab(tabId);
    });
  });

  // 2. Recherche par nom ou préfixe (conforme barre de recherche SasPay)
  const searchInput = document.getElementById('devKeySearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        VPState.devKeySearchQuery = e.target.value.trim();
        loadAndRenderApiKeys(VPState.devKeySearchQuery);
      }, 250);
    });
  }

  // 3. Formulaire inline de génération de clé API
  const formCreateKey = document.getElementById('formCreateApiKey');
  if (formCreateKey) {
    formCreateKey.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newKeyNameInput')?.value || '';
      const scope = document.getElementById('newKeyScopeSelect')?.value || 'FULL';
      const submitBtn = document.getElementById('btnSubmitGenerateKey');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Génération...';
      }

      try {
        const res = await fetch('/api/v1/merchant/api-keys', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ name, scope })
        });
        const data = await res.json();

        if (data.success && data.api_key) {
          // Affichage de la clé secrète révélée une seule fois dans la modale de sécurité
          const secretInput = document.getElementById('revealedSecretKeyInput');
          if (secretInput) {
            secretInput.value = data.api_key.secret_key;
          }
          openModal('modalRevealApiKey');

          // Réinitialiser le formulaire
          formCreateKey.reset();
          const scopeSelect = document.getElementById('newKeyScopeSelect');
          if (scopeSelect) scopeSelect.value = 'FULL';

          showToast('Clé API générée !', 'Copiez la clé secrète dès maintenant.');
          loadAndRenderApiKeys(VPState.devKeySearchQuery);
        } else {
          showToast('Erreur', data.error || 'Impossible de générer la clé.');
        }
      } catch (err) {
        showToast('Erreur réseau', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Générer';
        }
      }
    });
  }

  // 4. Copier la clé secrète révélée dans le presse-papier
  const btnCopySecret = document.getElementById('btnCopyRevealedSecret');
  if (btnCopySecret) {
    btnCopySecret.addEventListener('click', () => {
      const secretInput = document.getElementById('revealedSecretKeyInput');
      if (secretInput && secretInput.value) {
        navigator.clipboard.writeText(secretInput.value);
        showToast('Copié !', 'Clé secrète copiée dans le presse-papier.');
      }
    });
  }

  // 5. Bouton confirmation révocation
  const btnConfirmRevoke = document.getElementById('btnConfirmRevokeKey');
  if (btnConfirmRevoke) {
    btnConfirmRevoke.addEventListener('click', confirmRevokeKey);
  }

  // 6. Bouton confirmation suppression clé
  const btnConfirmDelete = document.getElementById('btnConfirmDeleteKey');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', confirmDeleteKey);
  }

  // 7. Formulaire ajout IP Whitelist
  const formAddIp = document.getElementById('formAddWhitelistIp');
  if (formAddIp) {
    formAddIp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ip = document.getElementById('newWhitelistIpInput')?.value || '';
      const desc = document.getElementById('newWhitelistDescInput')?.value || '';
      const submitBtn = document.getElementById('btnSubmitAddWhitelist');

      if (!ip.trim()) {
        showToast('Erreur', 'Veuillez saisir une adresse IP ou CIDR valide.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
      }

      try {
        const res = await fetch('/api/v1/merchant/ip-whitelist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ ip_address: ip.trim(), description: desc.trim() })
        });
        const data = await res.json();

        if (data.success) {
          formAddIp.reset();
          showToast('IP autorisée', data.message || 'Adresse IP enregistrée avec succès.');
          loadAndRenderIpWhitelist();
        } else {
          showToast('Erreur', data.error || 'Impossible d\'ajouter cette adresse IP.');
        }
      } catch (err) {
        showToast('Erreur réseau', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '+ Ajouter cette IP';
        }
      }
    });
  }

  // 8. Bouton confirmation suppression IP
  const btnConfirmDeleteIp = document.getElementById('btnConfirmDeleteIp');
  if (btnConfirmDeleteIp) {
    btnConfirmDeleteIp.addEventListener('click', confirmDeleteIp);
  }

  // 9. Documentation SaaS & Sélecteur de langage
  const langBtns = document.querySelectorAll('.lang-tab-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      langBtns.forEach(b => {
        b.className = 'lang-tab-btn px-2.5 py-1 rounded-lg font-semibold text-slate-400 hover:text-white';
      });
      btn.className = 'lang-tab-btn px-2.5 py-1 rounded-lg font-semibold text-white bg-[#0052FF]';

      document.querySelectorAll('.code-snippet-block').forEach(el => el.classList.add('hidden'));
      const target = document.getElementById(`codeSnippet-${lang}`);
      if (target) target.classList.remove('hidden');
    });
  });

  // Copie de l'exemple de code actif
  const btnCopyCode = document.getElementById('btnCopyApiCode');
  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      const activeBlock = document.querySelector('.code-snippet-block:not(.hidden)');
      if (activeBlock) {
        navigator.clipboard.writeText(activeBlock.innerText).then(() => {
          showToast('Copié !', 'Exemple de code copié dans le presse-papier.');
        });
      }
    });
  }

  // 10. Console de test interactive (API Playground)
  const formPlayground = document.getElementById('formApiPlaygroundTest');
  if (formPlayground) {
    formPlayground.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('testApiAmount')?.value || 2500);
      const title = document.getElementById('testApiTitle')?.value || 'Test Abonnement SaaS';
      const btn = document.getElementById('btnRunApiPlayground');

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Création en cours...';
      }

      try {
        const res = await fetch('/api/v1/merchant/checkout-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({
            amount,
            currency: 'XOF',
            title,
            customer_name: 'Testeur SaaS',
            customer_email: 'test@saas.com',
            redirect_url: window.location.href,
            metadata: { source: 'api_playground' }
          })
        });

        const data = await res.json();
        const resContainer = document.getElementById('testApiResultContainer');
        const jsonPre = document.getElementById('testApiResponseJson');
        const linkA = document.getElementById('testApiCheckoutLink');

        if (data.success && data.checkout_url) {
          if (jsonPre) jsonPre.textContent = JSON.stringify(data, null, 2);
          if (linkA) linkA.href = safeGetCheckoutUrl(data.checkout_url, data.id);
          if (resContainer) resContainer.classList.remove('hidden');
          showToast('Session prête !', 'La session de paiement a été créée avec succès.');
        } else {
          showToast('Erreur', data.error || 'Impossible de créer la session de test.');
        }
      } catch (err) {
        showToast('Erreur', err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>⚡ Créer la session</span>';
        }
      }
    });
  }
}

function switchDevSubTab(tabId) {
  VPState.activeDevSubTab = tabId;
  const buttons = document.querySelectorAll('.dev-subtab-btn');
  const panels = document.querySelectorAll('.dev-subtab-panel');

  buttons.forEach(btn => {
    const isCurrent = btn.getAttribute('data-dev-tab') === tabId;
    if (isCurrent) {
      btn.className = 'dev-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all bg-[#0052FF] text-white shadow-[0_8px_18px_-8px_rgba(0, 82, 255,0.6)]';
    } else {
      btn.className = 'dev-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-[#6B7280] hover:bg-blue-50 hover:text-[#111827]';
    }
  });

  panels.forEach(panel => {
    if (panel.id === `dev-panel-${tabId}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });

  if (tabId === 'keys') {
    loadAndRenderApiKeys(VPState.devKeySearchQuery);
  } else if (tabId === 'whitelist') {
    loadAndRenderIpWhitelist();
  } else if (tabId === 'docs') {
    const currentBase = window.location.origin;
    document.querySelectorAll('.code-snippet-block code').forEach(el => {
      if (!el.dataset.raw) el.dataset.raw = el.innerHTML;
      el.innerHTML = el.dataset.raw.replace(/https:\/\/api\.vandiaspay\.com/g, currentBase);
    });
  }
}

async function loadAndRenderApiKeys(search = '') {
  const tbody = document.getElementById('apiKeysTableBody');
  if (!tbody) return;

  try {
    const url = search ? `/api/v1/merchant/api-keys?search=${encodeURIComponent(search)}` : '/api/v1/merchant/api-keys';
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !Array.isArray(data.api_keys)) return;

    VPState.apiKeysList = data.api_keys;

    if (VPState.apiKeysList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="py-10 text-center text-slate-400 text-xs">
            Aucune clé d'API trouvée.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    VPState.apiKeysList.forEach(k => {
      const isActive = k.status === 'ACTIVE' && k.is_active;
      const maskedKey = k.secret_key_masked || 'sk_live_...';
      const keyName = k.name || 'Clé API';
      const scopeLabel = k.scope_label || 'Encaissement et décaissement';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F9FAFC] transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0052FF]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
            <div>
              <div class="text-xs sm:text-sm font-bold text-[#111827]">${keyName}</div>
              <div class="font-mono text-[11px] text-slate-400 select-all">${maskedKey}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-600 font-medium">
          ${scopeLabel}
        </td>
        <td class="py-3.5 px-4">
          ${isActive 
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">Active</span>'
            : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">Révoquée</span>'
          }
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="inline-flex items-center justify-end gap-3">
            ${isActive 
              ? `<button type="button" class="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors" onclick="openRevokeKeyModal('${k.id}', '${keyName.replace(/'/g, "\\'")}')">Révoquer</button>`
              : `<span class="text-xs text-slate-400 italic">Révoquée</span>`
            }
            <button type="button" class="text-slate-400 hover:text-rose-600 transition-colors p-1" onclick="openDeleteKeyModal('${k.id}', '${keyName.replace(/'/g, "\\'")}')" title="Supprimer définitivement">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erreur chargement clés API:', err);
  }
}

function openRevokeKeyModal(id, name) {
  VPState.keyIdToRevoke = id;
  const title = document.getElementById('revokeKeyModalTitle');
  if (title) title.textContent = `Révoquer la clé "${name}" ?`;
  openModal('modalRevokeApiKey');
}

async function confirmRevokeKey() {
  if (!VPState.keyIdToRevoke) return;

  try {
    const res = await fetch(`/api/v1/merchant/api-keys/${VPState.keyIdToRevoke}/revoke`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast('Clé révoquée', 'Cette clé API est désormais désactivée.');
      closeModal('modalRevokeApiKey');
      loadAndRenderApiKeys(VPState.devKeySearchQuery);
    } else {
      showToast('Erreur', data.error || 'Impossible de révoquer cette clé.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

function openDeleteKeyModal(id, name) {
  VPState.keyIdToDelete = id;
  const title = document.getElementById('deleteKeyModalTitle');
  if (title) title.textContent = `Supprimer la clé "${name}" ?`;
  openModal('modalDeleteApiKey');
}

async function confirmDeleteKey() {
  if (!VPState.keyIdToDelete) return;

  try {
    const res = await fetch(`/api/v1/merchant/api-keys/${VPState.keyIdToDelete}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast('Clé supprimée', 'La clé d\'API a été définitivement effacée.');
      closeModal('modalDeleteApiKey');
      loadAndRenderApiKeys(VPState.devKeySearchQuery);
    } else {
      showToast('Erreur', data.error || 'Impossible de supprimer cette clé.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

async function loadAndRenderIpWhitelist() {
  const tbody = document.getElementById('ipWhitelistTableBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/v1/merchant/ip-whitelist', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !Array.isArray(data.ip_whitelist)) return;

    VPState.ipWhitelist = data.ip_whitelist;

    if (VPState.ipWhitelist.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-10 text-center text-slate-400 text-xs">
            Aucune adresse IP autorisée enregistrée. Vos serveurs ont accès libre avec leur clé secrète.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';
    VPState.ipWhitelist.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F9FAFC] transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4 font-mono font-bold text-xs text-[#111827]">
          ${item.ip_address}
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-600">
          ${item.description || '—'}
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-400 font-mono">
          ${formatShortDate(item.created_at)}
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">Active</span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button type="button" class="text-slate-400 hover:text-rose-600 transition-colors p-1" onclick="openDeleteIpModal('${item.id}', '${item.ip_address}')" title="Supprimer">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erreur chargement whitelist IP:', err);
  }
}

function openDeleteIpModal(id, ip) {
  VPState.ipIdToDelete = id;
  const title = document.getElementById('deleteIpModalTitle');
  if (title) title.textContent = `Supprimer l'IP "${ip}" ?`;
  openModal('modalDeleteWhitelistIp');
}

async function confirmDeleteIp() {
  if (!VPState.ipIdToDelete) return;

  try {
    const res = await fetch(`/api/v1/merchant/ip-whitelist/${VPState.ipIdToDelete}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast('IP supprimée', 'L\'adresse IP a été retirée de la liste.');
      closeModal('modalDeleteWhitelistIp');
      loadAndRenderIpWhitelist();
    } else {
      showToast('Erreur', data.error || 'Impossible de supprimer cette IP.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

/* ========================================================
   5.d. SECTIONS WEBHOOKS & JOURNAL DES WEBHOOKS (100% CONFORME SASPAY)
   ======================================================== */

function initWebhooksSection() {
  // Formulaire d'ajout de Webhook
  const formAddWebhook = document.getElementById('formAddWebhook');
  if (formAddWebhook) {
    formAddWebhook.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('newWebhookUrl')?.value || '';
      const desc = document.getElementById('newWebhookDesc')?.value || '';
      const secret = document.getElementById('newWebhookSecret')?.value || '';
      const submitBtn = document.getElementById('btnSubmitAddWebhook');

      if (!url.trim()) {
        showToast('Erreur', 'Veuillez saisir une URL de webhook valide.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Ajout...';
      }

      try {
        const res = await fetch('/api/v1/merchant/webhooks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ url: url.trim(), description: desc.trim(), secret: secret.trim() })
        });
        const data = await res.json();

        if (data.success && data.webhook) {
          // Affichage du secret révélé dans la modale de sécurité
          const secretInput = document.getElementById('revealedWebhookSecretInput');
          if (secretInput) {
            secretInput.value = data.webhook.secret;
          }
          openModal('modalRevealWebhookSecret');

          formAddWebhook.reset();
          showToast('Webhook configuré !', 'Votre URL a été enregistrée avec succès.');
          loadAndRenderWebhooks(VPState.webhookSearchQuery);
        } else {
          showToast('Erreur', data.error || 'Impossible d\'ajouter ce webhook.');
        }
      } catch (err) {
        showToast('Erreur réseau', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Ajouter';
        }
      }
    });
  }

  // Copier le secret révélé
  const btnCopySecret = document.getElementById('btnCopyRevealedWebhookSecret');
  if (btnCopySecret) {
    btnCopySecret.addEventListener('click', () => {
      const secretInput = document.getElementById('revealedWebhookSecretInput');
      if (secretInput && secretInput.value) {
        navigator.clipboard.writeText(secretInput.value);
        showToast('Copié !', 'Secret HMAC copié dans le presse-papier.');
      }
    });
  }

  // Recherche Webhooks
  const searchInput = document.getElementById('webhookSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        VPState.webhookSearchQuery = e.target.value.trim();
        loadAndRenderWebhooks(VPState.webhookSearchQuery);
      }, 250);
    });
  }

  // Confirmation suppression Webhook
  const btnConfirmDelete = document.getElementById('btnConfirmDeleteWebhook');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', confirmDeleteWebhook);
  }
}

async function loadAndRenderWebhooks(search = '') {
  const emptyState = document.getElementById('webhooksEmptyState');
  const tableWrapper = document.getElementById('webhooksTableWrapper');
  const tbody = document.getElementById('webhooksTableBody');
  if (!tbody || !emptyState || !tableWrapper) return;

  try {
    const url = search ? `/api/v1/merchant/webhooks?search=${encodeURIComponent(search)}` : '/api/v1/merchant/webhooks';
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !Array.isArray(data.webhooks)) return;

    VPState.webhooksList = data.webhooks;

    // Mettre à jour le dropdown de filtre dans le Journal des webhooks
    const filterSelect = document.getElementById('webhookLogsFilterWebhook');
    if (filterSelect) {
      const currentVal = filterSelect.value;
      filterSelect.innerHTML = `<option value="">Tous les webhooks</option>` +
        VPState.webhooksList.map(w => `<option value="${w.id}">${w.description || w.url}</option>`).join('');
      filterSelect.value = currentVal;
    }

    if (VPState.webhooksList.length === 0) {
      emptyState.classList.remove('hidden');
      tableWrapper.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tableWrapper.classList.remove('hidden');
    tbody.innerHTML = '';

    VPState.webhooksList.forEach(w => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F9FAFC] transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2.5">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0052FF]">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            </span>
            <span class="font-mono font-bold text-xs text-[#111827] select-all">${w.url}</span>
          </div>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-600 font-medium">
          ${w.description || '—'}
        </td>
        <td class="py-3.5 px-4 font-mono text-[11px] text-slate-400 select-all">
          ${w.secret_masked || 'whsec_...'}
        </td>
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">Actif</span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="inline-flex items-center justify-end gap-2.5">
            <button type="button" class="rounded-lg border border-blue-200 bg-blue-50/60 px-2.5 py-1 text-xs font-semibold text-[#0052FF] hover:bg-blue-100 transition-colors inline-flex items-center gap-1" onclick="testWebhook('${w.id}')">
              <span>⚡ Tester</span>
            </button>
            <button type="button" class="text-slate-400 hover:text-rose-600 transition-colors p-1" onclick="openDeleteWebhookModal('${w.id}', '${w.url.replace(/'/g, "\\'")}')" title="Supprimer">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erreur chargement webhooks:', err);
  }
}

function openDeleteWebhookModal(id, url) {
  VPState.webhookIdToDelete = id;
  const title = document.getElementById('deleteWebhookModalTitle');
  if (title) title.textContent = `Supprimer le webhook "${url}" ?`;
  openModal('modalDeleteWebhook');
}

async function confirmDeleteWebhook() {
  if (!VPState.webhookIdToDelete) return;

  try {
    const res = await fetch(`/api/v1/merchant/webhooks/${VPState.webhookIdToDelete}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast('Webhook supprimé', 'L\'endpoint a bien été retiré.');
      closeModal('modalDeleteWebhook');
      loadAndRenderWebhooks(VPState.webhookSearchQuery);
    } else {
      showToast('Erreur', data.error || 'Impossible de supprimer ce webhook.');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

async function testWebhook(id) {
  try {
    showToast('Envoi du test...', 'Transmission d\'un événement ping...');
    const res = await fetch(`/api/v1/merchant/webhooks/${id}/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();

    if (data.success) {
      showToast('Test réussi (200 OK)', `Latence : ${data.log?.duration_ms || 85}ms.`);
      loadAndRenderWebhookLogs();
    } else {
      showToast('Échec du test', data.error || 'Le serveur n\'a pas répondu correctement.');
    }
  } catch (err) {
    showToast('Erreur de test', err.message);
  }
}

function initWebhookLogsSection() {
  // Recherche
  const searchInput = document.getElementById('webhookLogsSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        VPState.webhookLogsSearchQuery = e.target.value.trim();
        loadAndRenderWebhookLogs();
      }, 250);
    });
  }

  // Filtre Webhook
  const filterWebhook = document.getElementById('webhookLogsFilterWebhook');
  if (filterWebhook) {
    filterWebhook.addEventListener('change', (e) => {
      VPState.webhookLogsFilterWebhook = e.target.value;
      loadAndRenderWebhookLogs();
    });
  }

  // Filtre Statut
  const filterStatus = document.getElementById('webhookLogsFilterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', (e) => {
      VPState.webhookLogsFilterStatus = e.target.value;
      loadAndRenderWebhookLogs();
    });
  }

  // Filtre Événement
  const filterEvent = document.getElementById('webhookLogsFilterEvent');
  if (filterEvent) {
    filterEvent.addEventListener('change', (e) => {
      VPState.webhookLogsFilterEvent = e.target.value;
      loadAndRenderWebhookLogs();
    });
  }

  // Bouton Copier le payload JSON
  const btnCopyPayload = document.getElementById('btnCopyLogPayload');
  if (btnCopyPayload) {
    btnCopyPayload.addEventListener('click', () => {
      const payloadEl = document.getElementById('logDetailPayload');
      if (payloadEl) {
        navigator.clipboard.writeText(payloadEl.textContent);
        showToast('Copié !', 'Payload JSON copié dans le presse-papier.');
      }
    });
  }

  // Bouton Replay de l'événement
  const btnReplay = document.getElementById('btnReplayWebhookEvent');
  if (btnReplay) {
    btnReplay.addEventListener('click', async () => {
      if (!VPState.selectedWebhookLog) return;
      try {
        btnReplay.disabled = true;
        btnReplay.textContent = 'Envoi...';

        const res = await fetch(`/api/v1/merchant/webhook-logs/${VPState.selectedWebhookLog.id}/retry`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${VPState.token}` }
        });
        const data = await res.json();

        if (data.success) {
          showToast('Événement renvoyé !', 'La requête a été rejouée avec succès.');
          closeModal('modalWebhookLogDetail');
          loadAndRenderWebhookLogs();
        } else {
          showToast('Erreur', data.error || 'Impossible de renvoyer l\'événement.');
        }
      } catch (err) {
        showToast('Erreur réseau', err.message);
      } finally {
        btnReplay.disabled = false;
        btnReplay.textContent = '🔄 Renvoyer cet événement (Replay)';
      }
    });
  }
}

async function loadAndRenderWebhookLogs() {
  const emptyState = document.getElementById('webhookLogsEmptyState');
  const tableWrapper = document.getElementById('webhookLogsTableWrapper');
  const tbody = document.getElementById('webhookLogsTableBody');
  if (!tbody || !emptyState || !tableWrapper) return;

  try {
    const params = new URLSearchParams();
    if (VPState.webhookLogsSearchQuery) params.append('search', VPState.webhookLogsSearchQuery);
    if (VPState.webhookLogsFilterWebhook) params.append('webhook_id', VPState.webhookLogsFilterWebhook);
    if (VPState.webhookLogsFilterStatus) params.append('status', VPState.webhookLogsFilterStatus);
    if (VPState.webhookLogsFilterEvent) params.append('event', VPState.webhookLogsFilterEvent);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/v1/merchant/webhook-logs${queryStr}`, {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data.success || !Array.isArray(data.logs)) return;

    VPState.webhookLogsList = data.logs;

    if (VPState.webhookLogsList.length === 0) {
      emptyState.classList.remove('hidden');
      tableWrapper.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tableWrapper.classList.remove('hidden');
    tbody.innerHTML = '';

    VPState.webhookLogsList.forEach(log => {
      const isSuccess = log.status_code >= 200 && log.status_code < 300;
      const statusClass = isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';
      const statusText = isSuccess ? `${log.status_code} OK` : `${log.status_code} Erreur`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-[#F9FAFC] transition-colors';
      tr.innerHTML = `
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${statusClass}">
            ${statusText}
          </span>
        </td>
        <td class="py-3.5 px-4 font-mono font-bold text-xs text-[#111827]">
          ${log.event_type}
        </td>
        <td class="py-3.5 px-4 font-mono text-xs text-slate-500 max-w-[220px] truncate" title="${log.url}">
          ${log.url}
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-400">
          ${formatShortDate(log.delivered_at)} • <span class="font-mono">${log.duration_ms || 80}ms</span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <button type="button" class="text-xs font-semibold text-[#0052FF] hover:underline" onclick='openWebhookLogDetailModal(${JSON.stringify(log).replace(/'/g, "&apos;")})'>
            Détails
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Erreur chargement logs webhooks:', err);
  }
}

function openWebhookLogDetailModal(log) {
  VPState.selectedWebhookLog = log;
  const isSuccess = log.status_code >= 200 && log.status_code < 300;

  const badge = document.getElementById('logDetailStatusBadge');
  if (badge) {
    badge.textContent = log.status_code;
    badge.className = `flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} font-bold text-xs font-mono`;
  }

  const eventType = document.getElementById('logDetailEventType');
  if (eventType) eventType.textContent = log.event_type;

  const meta = document.getElementById('logDetailMeta');
  if (meta) meta.textContent = `${formatShortDate(log.delivered_at)} • ${log.duration_ms || 80}ms de latence`;

  const urlEl = document.getElementById('logDetailUrl');
  if (urlEl) urlEl.textContent = log.url;

  const headersEl = document.getElementById('logDetailHeaders');
  if (headersEl) {
    const hdrs = log.request_headers || {};
    headersEl.textContent = Object.entries(hdrs).map(([k, v]) => `${k}: ${v}`).join('\n');
  }

  const payloadEl = document.getElementById('logDetailPayload');
  if (payloadEl) {
    payloadEl.textContent = JSON.stringify(log.request_payload || {}, null, 2);
  }

  const responseEl = document.getElementById('logDetailResponse');
  if (responseEl) {
    responseEl.textContent = log.response_body || '{"received": true}';
  }

  openModal('modalWebhookLogDetail');
}

function initAuthModalEvents() {
  const tabLogin = document.getElementById('authTabLogin');
  const tabRegister = document.getElementById('authTabRegister');
  const formLogin = document.getElementById('authLoginForm');
  const formRegister = document.getElementById('authRegisterForm');
  const formVerifyEmail = document.getElementById('authVerifyEmailForm');
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');

  if (tabLogin && tabRegister && formLogin && formRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
      tabLogin.classList.remove('text-slate-500');
      tabRegister.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
      tabRegister.classList.add('text-slate-500');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
      if (formVerifyEmail) formVerifyEmail.classList.add('hidden');
      if (title) title.textContent = "Connecte-toi à ton compte";
      if (subtitle) subtitle.textContent = "Ravi de te revoir sur VandiasPay.";
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
      tabRegister.classList.remove('text-slate-500');
      tabLogin.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
      tabLogin.classList.add('text-slate-500');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
      if (formVerifyEmail) formVerifyEmail.classList.add('hidden');
      if (title) title.textContent = "Crée ton compte";
      if (subtitle) subtitle.textContent = "Commence à encaisser avec VandiasPay en quelques minutes.";
    });

    // Support des ancres d'URL pour présélectionner l'onglet
    if (window.location.hash === '#login' || window.location.search.includes('tab=login')) {
      tabLogin.click();
    }
  }

  // Connexion rapide 1-Clic pour le compte marchand principal
  const btnQuickLogin = document.getElementById('btnQuickLoginUser');
  if (btnQuickLogin && formLogin) {
    btnQuickLogin.addEventListener('click', () => {
      const emailInput = document.getElementById('loginEmail');
      const pwdInput = document.getElementById('loginPassword');
      if (emailInput) emailInput.value = 'gnitessowedeou@gmail.com';
      if (pwdInput) pwdInput.value = '9342Well@';
      formLogin.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
  }

  // Soumission Formulaire Connexion
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('btnSubmitLogin');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion en cours...';
      }

      // Indicateur visuel si le serveur met plus de 2.5s à répondre (réveil du conteneur en veille)
      const wakeTimer = setTimeout(() => {
        if (submitBtn && submitBtn.disabled) {
          submitBtn.innerHTML = '<span>Réveil du serveur sécurisé...</span>';
          showToast('Connexion', 'Le serveur sécurisé démarre, veuillez patienter quelques secondes...', 'info');
        }
      }, 2500);

      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        // Cas : L'email n'est pas encore vérifié
        if (data.requires_verification) {
          VPState.pendingEmail = email;
          if (formLogin) formLogin.classList.add('hidden');
          if (formRegister) formRegister.classList.add('hidden');
          if (formVerifyEmail) formVerifyEmail.classList.remove('hidden');
          const emailDisplay = document.getElementById('verifyEmailDisplay');
          if (emailDisplay) emailDisplay.textContent = email;
          const otpDisplay = document.getElementById('testOtpCodeDisplay');
          if (otpDisplay && data.verification_code) otpDisplay.textContent = data.verification_code;
          if (title) title.textContent = "Vérifie ton adresse e-mail";
          if (subtitle) subtitle.textContent = "Saisis le code reçu par e-mail pour activer ton compte.";
          showToast('Vérification requise', data.error || "Veuillez valider votre adresse e-mail.");
          return;
        }

        if (data.success && data.token) {
          localStorage.setItem('vandias_token', data.token);
          if (data.is_admin) {
            localStorage.setItem('vandias_admin_token', data.token);
          }
          VPState.token = data.token;
          VPState.merchant = data.merchant;
          VPState.applications = data.merchant.applications || [];
          localStorage.setItem('vandias_merchant', JSON.stringify(data.merchant));
          closeModal('modalAuth');

          showMainDashboard();
          showToast('Connexion réussie !', `Bienvenue, ${data.merchant.business_name || data.merchant.full_name || 'Marchand'}.`);
          await loadMerchantDashboard();
        } else {
          showToast('Erreur', data.error || 'Identifiants incorrects.');
        }
      } catch (err) {
        showToast('Erreur de connexion', err.message || 'Impossible de joindre le serveur. Réessayez dans un instant.');
      } finally {
        clearTimeout(wakeTimer);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Se connecter</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
        }
      }
    });
  }

  // Boutons pour afficher / masquer le mot de passe (œil)
  const togglePwdBtns = document.querySelectorAll('.btn-toggle-pwd');
  togglePwdBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `<svg class="w-4 h-4 text-[#0052FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`;
        } else {
          input.type = 'password';
          btn.innerHTML = `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
        }
      }
    });
  });

  // Soumission Formulaire Inscription Nouveau Marchand
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = (document.getElementById('regFullName')?.value || document.getElementById('regBusinessName')?.value || '').trim();
      const email = document.getElementById('regEmail')?.value?.trim();
      const country = document.getElementById('regCountry')?.value || 'Burkina Faso';
      const phone = document.getElementById('regPhone')?.value?.trim();
      const password = document.getElementById('regPassword')?.value;
      const submitBtn = document.getElementById('btnSubmitRegister');

      if (!full_name || !email || !password) {
        showToast('Champs requis', 'Veuillez renseigner votre nom complet, votre adresse e-mail et votre mot de passe.');
        return;
      }

      if (password.length < 8) {
        showToast('Mot de passe trop court', 'Le mot de passe doit comporter au moins 8 caractères.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Création du compte...</span>';
      }

      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            full_name, 
            business_name: full_name, 
            email, 
            country, 
            phone, 
            password 
          })
        });
        const data = await res.json();

        if (data.success && data.requires_verification) {
          VPState.pendingEmail = email.toLowerCase().trim();
          formRegister.classList.add('hidden');
          if (formVerifyEmail) formVerifyEmail.classList.remove('hidden');
          const emailDisplay = document.getElementById('verifyEmailDisplay');
          if (emailDisplay) emailDisplay.textContent = email;
          const otpDisplay = document.getElementById('testOtpCodeDisplay');
          if (otpDisplay && data.verification_code) otpDisplay.textContent = data.verification_code;
          const codeInput = document.getElementById('verifyEmailCode');
          if (codeInput) {
            codeInput.value = '';
            codeInput.focus();
          }
          if (title) title.textContent = "Vérifie ton adresse e-mail";
          if (subtitle) subtitle.textContent = "Saisis le code reçu par e-mail pour activer ton compte VandiasPay.";
          showToast('Code envoyé !', `Un code de confirmation a été transmis à ${email}.`);
        } else if (data.success && data.token) {
          localStorage.setItem('vandias_token', data.token);
          VPState.token = data.token;
          closeModal('modalAuth');
          showOnboardingFlow(data.merchant);
        } else {
          showToast('Erreur', data.error || "Impossible de créer le compte.");
        }
      } catch (err) {
        console.error('Erreur inscription:', err);
        showToast('Erreur de connexion', 'Vérifiez que le serveur VandiasPay est démarré sur ' + (window.location.origin || 'http://localhost:3000') + ' (' + err.message + ')');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Créer mon compte</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
        }
      }
    });
  }

  // Soumission Formulaire Validation OTP Email (Conforme Audio : Redirige vers Connexion sans ouvrir le dashboard)
  if (formVerifyEmail) {
    formVerifyEmail.addEventListener('submit', async (e) => {
      e.preventDefault();
      const codeInput = document.getElementById('verifyEmailCode');
      const code = (codeInput?.value || '').trim();
      const email = VPState.pendingEmail || document.getElementById('regEmail')?.value?.trim() || document.getElementById('loginEmail')?.value?.trim();
      const submitBtn = document.getElementById('btnSubmitVerifyEmail');

      if (!code) {
        showToast('Code requis', 'Veuillez saisir votre code à 6 chiffres.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Validation du code...</span>';
      }

      try {
        const res = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();

        if (data.success) {
          showToast('E-mail validé avec succès !', 'Votre compte est actif. Connectez-vous maintenant pour continuer.');
          // Conforme consigne audio : Basculer directement sur l'onglet Connexion avec email pré-rempli
          if (tabLogin) tabLogin.click();
          const loginEmailEl = document.getElementById('loginEmail');
          if (loginEmailEl) loginEmailEl.value = email;
          const loginPwdEl = document.getElementById('loginPassword');
          if (loginPwdEl) {
            loginPwdEl.value = '';
            loginPwdEl.focus();
          }
        } else {
          showToast('Code incorrect', data.error || 'Code invalide.');
        }
      } catch (err) {
        showToast('Erreur', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Valider mon adresse e-mail</span><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
        }
      }
    });
  }

  // Bouton Renvoyer le code OTP
  const btnResend = document.getElementById('btnResendVerificationCode');
  if (btnResend) {
    btnResend.addEventListener('click', async () => {
      const email = VPState.pendingEmail || document.getElementById('regEmail')?.value?.trim();
      if (!email) return;
      try {
        const res = await fetch('/api/v1/auth/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          const otpDisplay = document.getElementById('testOtpCodeDisplay');
          if (otpDisplay && data.verification_code) otpDisplay.textContent = data.verification_code;
          showToast('Nouveau code envoyé !', `Un nouveau code a été transmis à ${email}.`);
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // Bouton Modifier l'e-mail (Retour au formulaire d'inscription)
  const btnBackToReg = document.getElementById('btnBackToRegister');
  if (btnBackToReg) {
    btnBackToReg.addEventListener('click', () => {
      if (tabRegister) tabRegister.click();
    });
  }
}

/* ========================================================
   PARCOURS ONBOARDING CONFORME AUX CAPTURES (1, 2, 3, 4)
   ======================================================== */

function initOnboardingFlow() {
  const container = document.getElementById('onboardingFlowContainer');
  if (!container) return;

  // 1. Bouton Déclencher Création Nouvelle Application
  const btnTrigger = document.getElementById('btnTriggerCreateApp');
  if (btnTrigger) {
    btnTrigger.addEventListener('click', () => {
      const form = document.getElementById('formCreateNewApp');
      if (form) form.reset();
      openModal('modalCreateApp');
    });
  }

  // 2. Soumission Modal Création Première Application (Capture 2)
  const formCreateApp = document.getElementById('formCreateNewApp');
  if (formCreateApp) {
    formCreateApp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('inputAppName')?.value?.trim();
      const website_url = document.getElementById('inputAppWebsite')?.value?.trim() || null;
      const category = document.getElementById('selectAppCategory')?.value;
      const submitBtn = document.getElementById('btnSubmitCreateApp');

      if (!name || !category) {
        showToast('Champs requis', "Veuillez saisir le nom et la catégorie de l'application.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création en cours...';
      }

      try {
        const res = await fetch('/api/v1/merchant/apps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ name, website_url, category })
        });
        const data = await res.json();

        if (data.success && data.application) {
          VPState.currentApp = data.application;
          if (!VPState.applications) VPState.applications = [];
          VPState.applications.push(data.application);
          if (VPState.merchant) {
            VPState.merchant.active_app_id = data.application.id;
            VPState.merchant.business_name = data.application.name;
          }

          closeModal('modalCreateApp');
          showToast('Application créée !', `Configurez votre profil d'encaissement pour ${data.application.name}.`);

          // Transition immédiate vers l'étape 2 (Comment veux-tu encaisser ? - Capture 3)
          transitionOnboardingStep('onboardingStepAccountType', '2 / 3');
        } else {
          showToast('Erreur', data.error || "Impossible de créer l'application.");
        }
      } catch (err) {
        showToast('Erreur', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Créer une application';
        }
      }
    });
  }

  // 3. Choix du type de compte (Capture 3 : Particulier vs Business)
  const cardPart = document.getElementById('cardChoiceParticulier');
  if (cardPart) {
    cardPart.addEventListener('click', () => {
      VPState.selectedKycType = 'PARTICULIER';
      transitionOnboardingStep('onboardingStepKycParticulier', '3 / 3');
    });
  }

  const cardBiz = document.getElementById('cardChoiceBusiness');
  if (cardBiz) {
    cardBiz.addEventListener('click', () => {
      VPState.selectedKycType = 'BUSINESS';
      transitionOnboardingStep('onboardingStepKycBusiness', '3 / 3');
    });
  }

  // 4. Boutons Retour depuis KYC
  const btnBackPart = document.getElementById('btnBackFromKycPart');
  if (btnBackPart) {
    btnBackPart.addEventListener('click', () => {
      transitionOnboardingStep('onboardingStepAccountType', '2 / 3');
    });
  }
  const btnBackBiz = document.getElementById('btnBackFromKycBiz');
  if (btnBackBiz) {
    btnBackBiz.addEventListener('click', () => {
      transitionOnboardingStep('onboardingStepAccountType', '2 / 3');
    });
  }

  // 5. Gestion des Dropzones (Mise à jour du nom de fichier)
  const fileInputs = document.querySelectorAll('.file-input');
  fileInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        const previewId = input.getAttribute('data-preview');
        const previewEl = document.getElementById(previewId);
        if (previewEl) {
          previewEl.textContent = `✓ ${input.files[0].name}`;
          previewEl.classList.remove('text-slate-500');
          previewEl.classList.add('text-[#0052FF]', 'font-bold');
        }
      }
    });
  });

  // 6. Soumission Formulaire KYC Particulier (Capture 4)
  const formKycPart = document.getElementById('formKycParticulier');
  if (formKycPart) {
    formKycPart.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('kycPartFirstName')?.value?.trim();
      const lastName = document.getElementById('kycPartLastName')?.value?.trim();
      const birthDate = document.getElementById('kycPartBirthDate')?.value;
      const idType = document.getElementById('kycPartIdType')?.value;
      const submitBtn = document.getElementById('btnSubmitKycPart');

      if (!document.getElementById('checkKycPartTerms')?.checked) {
        showToast('Conditions requises', "Veuillez accepter les conditions d'utilisation.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Validation en cours...</span>';
      }

      try {
        const res = await fetch('/api/v1/merchant/kyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({
            kyc_type: 'PARTICULIER',
            kyc_data: { firstName, lastName, birthDate, idType }
          })
        });
        const data = await res.json();

        if (data.success) {
          if (VPState.merchant) {
            VPState.merchant.onboarding_completed = true;
            VPState.merchant.kyc_status = 'VERIFIED';
            VPState.merchant.kyc_type = 'PARTICULIER';
          }
          const appName = VPState.currentApp?.name || VPState.merchant?.business_name || 'Votre application';
          const successNameEl = document.getElementById('successAppFinalName');
          if (successNameEl) successNameEl.textContent = appName;

          transitionOnboardingStep('onboardingStepSuccess', 'Terminé');
          showToast('Identité validée !', 'Votre compte est prêt pour encaisser.');
        } else {
          showToast('Erreur', data.error || 'Erreur lors de la vérification.');
        }
      } catch (err) {
        showToast('Erreur', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Soumettre pour vérification</span><span>→</span>';
        }
      }
    });
  }

  // 7. Soumission Formulaire KYC Business
  const formKycBiz = document.getElementById('formKycBusiness');
  if (formKycBiz) {
    formKycBiz.addEventListener('submit', async (e) => {
      e.preventDefault();
      const companyName = document.getElementById('kycBizCompanyName')?.value?.trim();
      const rccm = document.getElementById('kycBizRccm')?.value?.trim();
      const country = document.getElementById('kycBizCountry')?.value?.trim();
      const address = document.getElementById('kycBizAddress')?.value?.trim();
      const submitBtn = document.getElementById('btnSubmitKycBiz');

      if (!document.getElementById('checkKycBizTerms')?.checked) {
        showToast('Attestation requise', "Veuillez attester sur l'honneur et accepter les conditions.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Validation en cours...</span>';
      }

      try {
        const res = await fetch('/api/v1/merchant/kyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({
            kyc_type: 'BUSINESS',
            kyc_data: { companyName, rccm, country, address }
          })
        });
        const data = await res.json();

        if (data.success) {
          if (VPState.merchant) {
            VPState.merchant.onboarding_completed = true;
            VPState.merchant.kyc_status = 'VERIFIED';
            VPState.merchant.kyc_type = 'BUSINESS';
          }
          const appName = VPState.currentApp?.name || companyName || VPState.merchant?.business_name || 'Votre entreprise';
          const successNameEl = document.getElementById('successAppFinalName');
          if (successNameEl) successNameEl.textContent = appName;

          transitionOnboardingStep('onboardingStepSuccess', 'Terminé');
          showToast('Entreprise validée !', 'Votre compte Business (50M FCFA/mois) est actif.');
        } else {
          showToast('Erreur', data.error || 'Erreur lors de la vérification.');
        }
      } catch (err) {
        showToast('Erreur', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Soumettre pour vérification</span><span>→</span>';
        }
      }
    });
  }

  // 8. Bouton Accéder au Tableau de Bord après Succès
  const btnEnter = document.getElementById('btnEnterFullDashboard');
  if (btnEnter) {
    btnEnter.addEventListener('click', async () => {
      container.classList.add('hidden');
      showMainDashboard();
      await loadMerchantDashboard();
      showToast('Bienvenue sur VandiasPay !', 'Votre tableau de bord complet est ouvert.');
    });
  }

  // 9. Clic sur le Workspace Sidebar pour ouvrir le portail d'applications
  const workspaceTrigger = document.getElementById('sidebarWorkspaceTrigger');
  if (workspaceTrigger) {
    workspaceTrigger.addEventListener('click', () => {
      openAppsPortal();
    });
  }
}

function transitionOnboardingStep(stepId, badgeText) {
  const stepIds = [
    'onboardingStepApps',
    'onboardingStepAccountType',
    'onboardingStepKycParticulier',
    'onboardingStepKycBusiness',
    'onboardingStepSuccess'
  ];

  stepIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === stepId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  const badge = document.getElementById('onboardingStepBadge');
  if (badge && badgeText) badge.textContent = badgeText;

  const container = document.getElementById('onboardingFlowContainer');
  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
}

function showOnboardingFlow(merchant) {
  hideMainDashboard();
  const container = document.getElementById('onboardingFlowContainer');
  if (!container) return;

  container.classList.remove('hidden');

  const fullNameEl = document.getElementById('onboardingUserFullName');
  if (fullNameEl) {
    fullNameEl.textContent = merchant.business_name || merchant.full_name || 'Marchand';
  }

  const hasApps = VPState.applications && VPState.applications.length > 0;
  if (!hasApps) {
    transitionOnboardingStep('onboardingStepApps', '1 / 3');
    renderOnboardingApps();
    // Afficher directement la modal de création d'application pour l'utilisateur
    setTimeout(() => {
      const form = document.getElementById('formCreateNewApp');
      if (form) form.reset();
      openModal('modalCreateApp');
    }, 200);
  } else if (merchant.kyc_status !== 'VERIFIED') {
    transitionOnboardingStep('onboardingStepAccountType', '2 / 3');
  } else {
    transitionOnboardingStep('onboardingStepSuccess', 'Terminé');
  }
}

function openAppsPortal() {
  if (VPState.merchant) {
    showOnboardingFlow(VPState.merchant);
  }
}

async function renderOnboardingApps() {
  const listContainer = document.getElementById('onboardingAppsList');
  if (!listContainer) return;

  // Récupérer les applications depuis le serveur
  let apps = VPState.applications || [];
  if (VPState.token) {
    try {
      const res = await fetch('/api/v1/merchant/apps', {
        headers: { 'Authorization': `Bearer ${VPState.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.applications) {
          apps = data.applications;
          VPState.applications = apps;
        }
      }
    } catch (e) {
      console.warn("Erreur chargement applications:", e);
    }
  }

  // Vider le conteneur en conservant le bouton d'ajout
  const btnTrigger = document.getElementById('btnTriggerCreateApp');
  listContainer.innerHTML = '';
  if (btnTrigger) {
    listContainer.appendChild(btnTrigger);
  }

  // Rendu de chaque application existante
  apps.forEach(app => {
    const isActive = (VPState.merchant && VPState.merchant.active_app_id === app.id);
    const card = document.createElement('div');
    card.className = `p-6 rounded-2xl bg-white border-2 transition-all cursor-pointer flex flex-col justify-between group hover:shadow-md ${
      isActive ? 'border-[#0052FF] shadow-sm bg-blue-50/10' : 'border-slate-200 hover:border-blue-300'
    }`;
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-bold text-base group-hover:scale-105 transition-transform">
            ${(app.name || 'A').charAt(0).toUpperCase()}
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isActive ? 'bg-[#0052FF] text-white' : 'bg-emerald-50 text-emerald-600'
          }">
            ${isActive ? 'Active' : 'Prête'}
          </span>
        </div>
        <h3 class="text-base font-bold text-[#111827] group-hover:text-[#0052FF] transition-colors truncate">${app.name}</h3>
        <p class="text-xs text-slate-500 mt-0.5 font-medium truncate">${app.category || 'Général'}</p>
        ${app.website_url ? `<p class="text-[11px] text-slate-400 mt-1 font-mono truncate">${app.website_url}</p>` : ''}
      </div>
      <div class="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0052FF]">
        <span>Sélectionner</span>
        <span class="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    `;

    card.addEventListener('click', () => {
      selectAndOpenApp(app.id);
    });

    // Insérer avant le bouton d'ajout pour un rendu naturel
    if (btnTrigger) {
      listContainer.insertBefore(card, btnTrigger);
    } else {
      listContainer.appendChild(card);
    }
  });
}

async function selectAndOpenApp(appId) {
  if (!VPState.token) return;

  try {
    const res = await fetch('/api/v1/merchant/select-app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPState.token}`
      },
      body: JSON.stringify({ app_id: appId })
    });
    const data = await res.json();

    if (data.success && data.application) {
      VPState.currentApp = data.application;
      if (VPState.merchant) {
        VPState.merchant.active_app_id = appId;
        VPState.merchant.business_name = data.application.name;
      }

      // Si l'onboarding général n'a pas encore été validé, continuer vers le choix du mode d'encaissement
      if (VPState.merchant && VPState.merchant.onboarding_completed === false) {
        transitionOnboardingStep('onboardingStepAccountType', '2 / 3');
      } else {
        // Sinon, fermer l'onboarding et entrer sur le dashboard
        const container = document.getElementById('onboardingFlowContainer');
        if (container) container.classList.add('hidden');
        await loadMerchantDashboard();
        showToast('Application sélectionnée', `Vous travaillez désormais sur ${data.application.name}.`);
      }
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

/* ========================================================
   7. NAVIGATION & ACTIONS DU DASHBOARD
   ======================================================== */

function switchTab(tabKey) {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.dashboard-section');

  navItems.forEach(item => {
    const itemTab = item.getAttribute('data-tab');
    if (itemTab === tabKey || (tabKey === 'create-payment-link' && itemTab === 'links')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  sections.forEach(sec => {
    if (sec.id === `section-${tabKey}`) {
      sec.classList.remove('hidden');
      sec.classList.add('active');
    } else {
      sec.classList.add('hidden');
      sec.classList.remove('active');
    }
  });

  if (tabKey === 'create-payment-link') {
    resetCreatePaymentLinkForm();
  }

  if (tabKey === 'wallet') {
    loadAndRenderWallets();
    loadAndRenderWalletLedger();
    loadAndRenderWalletTransfers();
  }

  if (tabKey === 'payouts') {
    loadAndRenderPayouts();
    loadAndRenderPayoutMethods();
  }

  if (tabKey === 'developer') {
    loadAndRenderApiKeys(VPState.devKeySearchQuery);
    loadAndRenderIpWhitelist();
  }

  if (tabKey === 'transactions') {
    renderFullTransactionsList();
  }

  if (tabKey === 'links') {
    renderPaymentLinksList();
  }

  if (tabKey === 'checkout-sessions') {
    renderCheckoutSessionsList();
  }

  if (tabKey === 'customers') {
    renderCustomersList();
  }

  if (tabKey === 'disputes') {
    renderDisputes();
  }

  if (tabKey === 'webhooks') {
    loadAndRenderWebhooks(VPState.webhookSearchQuery);
  }

  if (tabKey === 'webhook-logs') {
    loadAndRenderWebhookLogs();
  }

  closeMobileDrawer();
  closeProfileDropdown();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initSidebarTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function initMobileDrawer() {
  const openBtn = document.getElementById('openSidebarBtn');
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebar = document.getElementById('dashboardSidebar');

  if (openBtn && sidebar && backdrop) {
    openBtn.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    });

    backdrop.addEventListener('click', closeMobileDrawer);
  }
}

function closeMobileDrawer() {
  const backdrop = document.getElementById('sidebarBackdrop');
  const sidebar = document.getElementById('dashboardSidebar');
  if (sidebar) sidebar.classList.add('-translate-x-full');
  if (backdrop) backdrop.classList.add('hidden');
}

function initProfileDropdown() {
  const btn = document.getElementById('profileDropdownBtn');
  const menu = document.getElementById('profileDropdownMenu');
  const chevron = document.getElementById('profileChevron');

  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      menu.classList.remove('hidden');
      if (chevron) chevron.classList.add('rotate-180');
    } else {
      menu.classList.add('hidden');
      if (chevron) chevron.classList.remove('rotate-180');
    }
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      closeProfileDropdown();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProfileDropdown();
  });
}

function closeProfileDropdown() {
  const menu = document.getElementById('profileDropdownMenu');
  const chevron = document.getElementById('profileChevron');
  if (menu) menu.classList.add('hidden');
  if (chevron) chevron.classList.remove('rotate-180');
}

function handleSignOut() {
  localStorage.removeItem('vandias_token');
  localStorage.removeItem('vandias_merchant');
  VPState.token = null;
  VPState.merchant = null;
  showToast("Déconnexion réussie", "À bientôt !");
  setTimeout(() => {
    promptAuthModal();
  }, 600);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.add('opacity-100');
    }, 10);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('opacity-100');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 200);
  }
}

window.paymentLinkAmountMode = 'fixed';

function togglePaymentLinkMode(mode) {
  window.paymentLinkAmountMode = mode;
  const btnFixed = document.getElementById('btnPillFixed');
  const btnFree = document.getElementById('btnPillFree');
  const wrapperAmount = document.getElementById('wrapperFormLinkAmount');
  const amountInput = document.getElementById('formLinkAmount');

  if (mode === 'fixed') {
    if (btnFixed) {
      btnFixed.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0052FF] text-white shadow-xs';
    }
    if (btnFree) {
      btnFree.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#6B7280] hover:text-[#111827]';
    }
    if (wrapperAmount) wrapperAmount.classList.remove('hidden');
    if (amountInput) amountInput.required = true;
  } else {
    if (btnFixed) {
      btnFixed.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all text-[#6B7280] hover:text-[#111827]';
    }
    if (btnFree) {
      btnFree.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#0052FF] text-white shadow-xs';
    }
    if (wrapperAmount) wrapperAmount.classList.add('hidden');
    if (amountInput) amountInput.required = false;
  }
}

function resetCreatePaymentLinkForm() {
  const form = document.getElementById('fullCreatePaymentLinkForm');
  if (form) form.reset();
  togglePaymentLinkMode('fixed');
  const cfContainer = document.getElementById('customFieldsListContainer');
  if (cfContainer) cfContainer.innerHTML = '';
  const showConf = document.getElementById('formLinkShowConfirmation');
  if (showConf) showConf.checked = true;
}

function addPaymentLinkCustomField(name = '', type = 'text', required = false) {
  const container = document.getElementById('customFieldsListContainer');
  if (!container) return;
  const fieldId = 'cf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
  const div = document.createElement('div');
  div.className = 'custom-field-row flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-2xl bg-[#F8F9FD] border border-[#ECEEF6] transition-all';
  div.id = fieldId;
  div.innerHTML = `
    <div class="flex-1 w-full sm:w-auto">
      <input type="text" placeholder="Intitulé du champ (ex: Taille, Numéro WhatsApp)" value="${name}" class="cf-name w-full bg-white border border-[#ECEEF6] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#0052FF]">
    </div>
    <div class="w-full sm:w-36">
      <select class="cf-type w-full bg-white border border-[#ECEEF6] rounded-xl px-3 py-2 text-xs text-[#111827] focus:outline-none focus:border-[#0052FF]">
        <option value="text" ${type === 'text' ? 'selected' : ''}>Texte</option>
        <option value="number" ${type === 'number' ? 'selected' : ''}>Nombre</option>
        <option value="email" ${type === 'email' ? 'selected' : ''}>Email</option>
        <option value="phone" ${type === 'phone' ? 'selected' : ''}>Téléphone</option>
      </select>
    </div>
    <div class="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
      <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
        <input type="checkbox" class="cf-required rounded text-[#0052FF] focus:ring-0" ${required ? 'checked' : ''}>
        <span>Obligatoire</span>
      </label>
      <button type="button" onclick="document.getElementById('${fieldId}').remove()" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors ml-auto sm:ml-0" title="Supprimer ce champ">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  `;
  container.appendChild(div);
}

function openCreateLinkModal() {
  switchTab('create-payment-link');
}

function initFullPaymentLinkCreation() {
  const fullForm = document.getElementById('fullCreatePaymentLinkForm');
  if (!fullForm) return;

  fullForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('formLinkName')?.value?.trim();
    const description = document.getElementById('formLinkDescription')?.value?.trim() || '';
    const isFixed = window.paymentLinkAmountMode !== 'free';
    const amountVal = isFixed ? parseFloat(document.getElementById('formLinkAmount')?.value || 0) : 0;
    const currency = document.getElementById('formLinkCurrency')?.value || 'XOF';
    const maxUses = document.getElementById('formLinkMaxUses')?.value ? parseInt(document.getElementById('formLinkMaxUses').value) : null;
    const defaultCountry = document.getElementById('formLinkDefaultCountry')?.value || null;
    const expiresAt = document.getElementById('formLinkExpiresAt')?.value || null;
    const requirePhone = !!document.getElementById('formLinkRequirePhone')?.checked;
    const facebookPixelId = document.getElementById('formLinkPixelId')?.value?.trim() || null;
    const googleAdsId = document.getElementById('formLinkGoogleAdsId')?.value?.trim() || null;
    const showConfirmationPage = document.getElementById('formLinkShowConfirmation') ? document.getElementById('formLinkShowConfirmation').checked : true;

    // Custom fields
    const customFields = [];
    document.querySelectorAll('.custom-field-row').forEach(row => {
      const name = row.querySelector('.cf-name')?.value?.trim();
      const type = row.querySelector('.cf-type')?.value || 'text';
      const required = !!row.querySelector('.cf-required')?.checked;
      if (name) {
        customFields.push({ name, type, required });
      }
    });

    if (!title) {
      showToast("Champ requis", "Veuillez renseigner le nom du lien de paiement.");
      return;
    }

    if (isFixed && (!amountVal || isNaN(amountVal) || amountVal <= 0)) {
      showToast("Montant invalide", "Veuillez renseigner un montant fixe supérieur à 0.");
      return;
    }

    const submitBtn = document.getElementById('btnSubmitFullCreateLink');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Création en cours...';
    }

    try {
      const res = await fetch('/api/v1/merchant/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VPState.token}`
        },
        body: JSON.stringify({
          title,
          description,
          is_fixed_amount: isFixed,
          amount_fcfa: amountVal,
          currency,
          max_uses: maxUses,
          default_country: defaultCountry,
          expires_at: expiresAt,
          require_phone: requirePhone,
          facebook_pixel_id: facebookPixelId,
          google_ads_id: googleAdsId,
          show_confirmation_page: showConfirmationPage,
          custom_fields: customFields
        })
      });

      const data = await res.json();

      if (data.success && data.payment_link) {
        if (!Array.isArray(VPState.paymentLinks)) {
          VPState.paymentLinks = [];
        }
        VPState.paymentLinks.unshift(data.payment_link);

        renderPaymentLinksList();
        renderOverviewDashboardKPIs();
        resetCreatePaymentLinkForm();

        const fullUrl = safeGetCheckoutUrl(data.payment_link.url, data.payment_link.slug);
        const prodNameEl = document.getElementById('successLinkProductName');
        const badgeEl = document.getElementById('successLinkAmountBadge');
        const urlInput = document.getElementById('successLinkUrlInput');
        const copyBtn = document.getElementById('btnCopySuccessLink');
        const copyBtnText = document.getElementById('copySuccessLinkBtnText');
        const openBtn = document.getElementById('btnOpenSuccessLink');

        if (prodNameEl) prodNameEl.textContent = `Lien : ${data.payment_link.title}`;
        if (badgeEl) {
          if (data.payment_link.is_fixed_amount === false) {
            badgeEl.textContent = `Montant libre (${data.payment_link.currency || 'XOF'})`;
          } else {
            badgeEl.textContent = `${parseFloat(data.payment_link.amount_fcfa || data.payment_link.amount || 0).toLocaleString('fr-FR')} ${data.payment_link.currency || 'XOF'}`;
          }
        }
        if (urlInput) urlInput.value = fullUrl;

        if (copyBtn) {
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(fullUrl);
            if (copyBtnText) copyBtnText.textContent = 'Copié !';
            showToast("Lien copié !", "Prêt à être envoyé à votre client.");
            setTimeout(() => { if (copyBtnText) copyBtnText.textContent = 'Copier'; }, 2500);
          };
        }

        if (openBtn) {
          openBtn.onclick = () => {
            window.open(fullUrl, '_blank');
          };
        }

        openModal('modalLinkCreatedSuccess');
        showToast("Succès", `Lien « ${data.payment_link.title} » créé avec succès !`);
      } else {
        showToast("Erreur", data.error || "Impossible de créer le lien de paiement.");
      }
    } catch (err) {
      showToast("Erreur réseau", err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer le lien';
      }
    }
  });
}

function initActionModals() {
  const btnPayout = document.getElementById('btnOpenPayoutModal');
  if (btnPayout) {
    btnPayout.addEventListener('click', () => openModal('modalPayoutQuick'));
  }

  const btnCreateLink = document.getElementById('btnOpenCreateLinkModal');
  if (btnCreateLink) {
    btnCreateLink.addEventListener('click', () => switchTab('create-payment-link'));
  }

  // Initialise le nouveau formulaire de création de lien de paiement pleine page conforme
  initFullPaymentLinkCreation();

  // Création d'un lien de paiement (support modal classique si présent)
  const createForm = document.getElementById('createLinkForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newLinkTitle').value;
      const amount = parseFloat(document.getElementById('newLinkAmount').value);
      const currency = document.getElementById('newLinkCurrency')?.value || 'XOF';

      if (!title || !amount || isNaN(amount) || amount <= 0) {
        showToast("Erreur", "Veuillez renseigner un titre et un montant valide.");
        return;
      }

      try {
        const res = await fetch('/api/v1/merchant/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ title, amount_fcfa: amount, currency })
        });
        const data = await res.json();

        if (data.success && data.payment_link) {
          VPState.paymentLinks.unshift(data.payment_link);
          renderPaymentLinksList();
          renderOverviewDashboardKPIs();
          closeModal('modalCreateLink');
          createForm.reset();

          const fullUrl = safeGetCheckoutUrl(data.payment_link.url, data.payment_link.slug);
          const prodNameEl = document.getElementById('successLinkProductName');
          const badgeEl = document.getElementById('successLinkAmountBadge');
          const urlInput = document.getElementById('successLinkUrlInput');
          const copyBtn = document.getElementById('btnCopySuccessLink');
          const copyBtnText = document.getElementById('copySuccessLinkBtnText');
          const openBtn = document.getElementById('btnOpenSuccessLink');

          if (prodNameEl) prodNameEl.textContent = `Produit : ${data.payment_link.title}`;
          if (badgeEl) badgeEl.textContent = `${parseFloat(data.payment_link.amount_fcfa).toLocaleString('fr-FR')} ${data.payment_link.currency || 'XOF'}`;
          if (urlInput) urlInput.value = fullUrl;

          if (copyBtn) {
            copyBtn.onclick = () => {
              navigator.clipboard.writeText(fullUrl);
              if (copyBtnText) copyBtnText.textContent = 'Copié !';
              showToast("Lien copié !", "Prêt à être envoyé à votre client.");
              setTimeout(() => { if (copyBtnText) copyBtnText.textContent = 'Copier'; }, 2500);
            };
          }

          if (openBtn) {
            openBtn.onclick = () => {
              window.open(fullUrl, '_blank');
            };
          }

          openModal('modalLinkCreatedSuccess');
          showToast("Lien créé avec succès !", `${data.payment_link.title} (${data.payment_link.currency || 'XOF'})`);
        } else {
          showToast("Erreur", data.error || "Impossible de créer le lien.");
        }
      } catch (err) {
        showToast("Erreur", err.message);
      }
    });
  }

  // Demande de retrait rapide
  const btnWithdraw = document.getElementById('btnSubmitWithdrawal');
  if (btnWithdraw) {
    btnWithdraw.addEventListener('click', async () => {
      const amt = parseFloat(document.getElementById('payoutAmountInput')?.value || 0);
      const phone = document.getElementById('payoutPhoneInput')?.value || '+221770000000';
      const channel = document.getElementById('payoutMethodSelect')?.value || 'WAVE';

      try {
        const res = await fetch('/api/v1/merchant/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ amount: amt, channel, recipient_phone: phone })
        });
        const data = await res.json();

        if (data.success) {
          if (VPState.merchant) VPState.merchant.balance_fcfa = data.new_balance;
          renderAllDashboardElements();
          loadAndRenderPayouts();
          loadAndRenderWallets();
          showToast("Retrait validé !", `Virement de ${amt.toLocaleString('fr-FR')} FCFA envoyé.`);
          closeModal('modalPayoutQuick');
        } else {
          showToast("Erreur de retrait", data.error || "Solde insuffisant.");
        }
      } catch (err) {
        showToast("Erreur", err.message);
      }
    });
  }
}

function initSettingsAndWebhookHandlers() {
  // Sauvegarde URL Webhook
  const btnSaveWebhook = document.getElementById('btnSaveWebhook');
  if (btnSaveWebhook) {
    btnSaveWebhook.addEventListener('click', async () => {
      const webhook_url = document.getElementById('webhookUrlInput').value;
      try {
        const res = await fetch('/api/v1/merchant/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ webhook_url })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Sauvegardé !', 'URL Webhook mise à jour avec succès.');
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // Sauvegarde Paramètres Profil
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', async () => {
      const business_name = document.getElementById('settingsBusinessName').value;
      const phone = document.getElementById('settingsPhone').value;
      try {
        const res = await fetch('/api/v1/merchant/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ business_name, phone })
        });
        const data = await res.json();
        if (data.success) {
          if (VPState.merchant) {
            VPState.merchant.business_name = business_name;
            VPState.merchant.phone = phone;
          }
          renderAllDashboardElements();
          showToast('Succès', 'Profil marchand mis à jour.');
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }
}

function initCopyButtons() {
  const btnCopyPub = document.getElementById('btnCopyPublicKey');
  if (btnCopyPub) {
    btnCopyPub.addEventListener('click', () => {
      const val = document.getElementById('devPublicKeyInput').value;
      navigator.clipboard.writeText(val);
      showToast('Copié !', 'Clé publique copiée.');
    });
  }

  const btnCopySec = document.getElementById('btnCopySecretKey');
  if (btnCopySec) {
    btnCopySec.addEventListener('click', () => {
      const val = document.getElementById('devSecretKeyInput').value;
      navigator.clipboard.writeText(val);
      showToast('Copié !', 'Clé secrète copiée.');
    });
  }
}

function toggleSecretKey() {
  const input = document.getElementById('devSecretKeyInput');
  const btn = document.getElementById('btnToggleSecretKey');
  if (input) {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btn) btn.textContent = isPass ? 'Masquer' : 'Afficher';
  }
}

/* ========================================================
   8. TOAST NOTIFICATION
   ======================================================== */

function showToast(title, desc = "") {
  const toast = document.getElementById('vpToast');
  const tTitle = document.getElementById('vpToastTitle');
  const tDesc = document.getElementById('vpToastDesc');

  if (!toast || !tTitle) return;

  tTitle.textContent = title;
  if (tDesc) tDesc.textContent = desc;

  toast.classList.remove('translate-y-16', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-16', 'opacity-0');
  }, 3200);
}

/* ========================================================
   9. TARIFICATION RÉSEAU PAR RÉSEAU (CONFORME À SASPAY)
   ======================================================== */

let pricingSearchDebounce = null;

const defaultClientPricingRates = [
  // 1. Bénin (BJ)
  {
    country_code: 'BJ',
    country_name: 'Bénin',
    flag: '🇧🇯',
    network_code: 'CELTIIS_BJ',
    network_name: 'Celtiis Cash Bénin',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.0, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'BJ',
    country_name: 'Bénin',
    flag: '🇧🇯',
    network_code: 'MTN_MOMO_BJ',
    network_name: 'MTN MoMo Benin',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'BJ',
    country_name: 'Bénin',
    flag: '🇧🇯',
    network_code: 'MOOV_MONEY_BJ',
    network_name: 'Moov Money Benin',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.7, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 2. Burkina Faso (BF)
  {
    country_code: 'BF',
    country_name: 'Burkina Faso',
    flag: '🇧🇫',
    network_code: 'MOOV_MONEY_BF',
    network_name: 'Moov Burkina Faso',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.2, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'BF',
    country_name: 'Burkina Faso',
    flag: '🇧🇫',
    network_code: 'ORANGE_MONEY_BF',
    network_name: 'Orange Burkina Faso',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 3. Cameroun (CM)
  {
    country_code: 'CM',
    country_name: 'Cameroun',
    flag: '🇨🇲',
    network_code: 'MTN_MOMO_CM',
    network_name: 'MTN MoMo Cameroon',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: 'min -0,01 XAF' }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.5, fixed: 50, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CM',
    country_name: 'Cameroun',
    flag: '🇨🇲',
    network_code: 'ORANGE_MONEY_CM',
    network_name: 'Orange Money Cameroon',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.2, fixed: 50, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 4. Congo (CG)
  {
    country_code: 'CG',
    country_name: 'Congo',
    flag: '🇨🇬',
    network_code: 'AIRTEL_CG',
    network_name: 'Airtel Congo Brazzaville',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.7, fixed: 0, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.2, fixed: 50, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CG',
    country_name: 'Congo',
    flag: '🇨🇬',
    network_code: 'MTN_CG',
    network_name: 'MTN Congo Brazzaville',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.7, fixed: 0, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 5. Côte d'Ivoire (CI)
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'DJAMO_CI',
    network_name: 'Djamo Côte d\'Ivoire',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 2.5, fixed: 100, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'MTN_MOMO_CI',
    network_name: 'MTN MoMo CI',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.9, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'MOOV_MONEY_CI',
    network_name: 'Moov Money CI',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.9, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'ORANGE_MONEY_CI',
    network_name: 'Orange Money CI',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.9, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CI',
    country_name: "Côte d'Ivoire",
    flag: '🇨🇮',
    network_code: 'WAVE_CI',
    network_name: 'Wave CI',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.9, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 6. Crypto (USD)
  {
    country_code: 'CRYPTO',
    country_name: 'Crypto (USD)',
    flag: '🪙',
    network_code: 'CRYPTO_STABLECOIN',
    network_name: 'Crypto / Stablecoin',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.0, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: false,
      is_custom: false,
      tiers: []
    }
  },

  // 7. Gabon (GA)
  {
    country_code: 'GA',
    country_name: 'Gabon',
    flag: '🇬🇦',
    network_code: 'AIRTEL_GA',
    network_name: 'Airtel Gabon',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.95, fixed: 0, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 2.0, fixed: 700, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'GA',
    country_name: 'Gabon',
    flag: '🇬🇦',
    network_code: 'MOOV_MONEY_GA',
    network_name: 'Moov Money Gabon',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 0, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 2.5, fixed: 700, currency: 'XAF', fee_charge_mode: 'ADD_ON', note: 'min -0,01 XAF' }]
    }
  },

  // 8. Ghana (GH)
  {
    country_code: 'GH',
    country_name: 'Ghana',
    flag: '🇬🇭',
    network_code: 'AIRTELTIGO_GH',
    network_name: 'Airtel/Tigo Ghana',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'GHS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.0, fixed: 0, currency: 'GHS', fee_charge_mode: 'ADD_ON', note: 'min 15 GHS' }]
    }
  },
  {
    country_code: 'GH',
    country_name: 'Ghana',
    flag: '🇬🇭',
    network_code: 'MTN_MOMO_GH',
    network_name: 'MTN MoMo Ghana',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'GHS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.0, fixed: 0, currency: 'GHS', fee_charge_mode: 'ADD_ON', note: 'min 15 GHS' }]
    }
  },
  {
    country_code: 'GH',
    country_name: 'Ghana',
    flag: '🇬🇭',
    network_code: 'VODAFONE_GH',
    network_name: 'Vodafone Ghana',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'GHS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.0, fixed: 0, currency: 'GHS', fee_charge_mode: 'ADD_ON', note: 'min 15 GHS' }]
    }
  },

  // 9. Guinée (GN)
  {
    country_code: 'GN',
    country_name: 'Guinée',
    flag: '🇬🇳',
    network_code: 'MTN_MOMO_GN',
    network_name: 'MTN MoMo Guinea',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.25, fixed: 0, currency: 'GNF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.0, fixed: 0, currency: 'GNF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 10. Kenya (KE)
  {
    country_code: 'KE',
    country_name: 'Kenya',
    flag: '🇰🇪',
    network_code: 'AIRTEL_KE',
    network_name: 'Airtel Money Kenya',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'KES', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.5, fixed: 150, currency: 'KES', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'KE',
    country_name: 'Kenya',
    flag: '🇰🇪',
    network_code: 'MPESA_KE',
    network_name: 'M-Pesa Kenya',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'KES', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.5, fixed: 150, currency: 'KES', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 11. Mali (ML)
  {
    country_code: 'ML',
    country_name: 'Mali',
    flag: '🇲🇱',
    network_code: 'MOBI_CASH_ML',
    network_name: 'Mobi Cash Mali',
    payin: {
      available: true,
      configured: false,
      is_custom: false,
      tiers: []
    },
    payout: {
      available: true,
      configured: false,
      is_custom: false,
      tiers: []
    }
  },
  {
    country_code: 'ML',
    country_name: 'Mali',
    flag: '🇲🇱',
    network_code: 'MOOV_MONEY_ML',
    network_name: 'Moov Money Mali',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.2, fixed: 700, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'ML',
    country_name: 'Mali',
    flag: '🇲🇱',
    network_code: 'ORANGE_MONEY_ML',
    network_name: 'Orange Money Mali',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'ML',
    country_name: 'Mali',
    flag: '🇲🇱',
    network_code: 'WAVE_ML',
    network_name: 'Wave Mali',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.8, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 12. Niger (NE)
  {
    country_code: 'NE',
    country_name: 'Niger',
    flag: '🇳🇪',
    network_code: 'AIRTEL_NE',
    network_name: 'Airtel Niger',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: 'min 690 XOF' }]
    }
  },

  // 13. Nigeria (NG)
  {
    country_code: 'NG',
    country_name: 'Nigeria',
    flag: '🇳🇬',
    network_code: 'SWYCHR_NG',
    network_name: 'Nigeria - Tous les réseaux bancaires (Swychr)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.7, fixed: 0, currency: 'NGN', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: false,
      is_custom: false,
      tiers: []
    }
  },

  // 14. Ouganda (UG)
  {
    country_code: 'UG',
    country_name: 'Ouganda',
    flag: '🇺🇬',
    network_code: 'AIRTEL_UG',
    network_name: 'Airtel Uganda',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.2, fixed: 0, currency: 'UGX', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 50, currency: 'UGX', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'UG',
    country_name: 'Ouganda',
    flag: '🇺🇬',
    network_code: 'MTN_MOMO_UG',
    network_name: 'MTN MoMo Uganda',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.7, fixed: 0, currency: 'UGX', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 50, currency: 'UGX', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 15. RDC (USD) (CD_USD)
  {
    country_code: 'CD_USD',
    country_name: 'RDC (USD)',
    flag: '🇨🇩',
    network_code: 'AIRTEL_CD_USD',
    network_name: 'Airtel Congo (USD)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.7, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CD_USD',
    country_name: 'RDC (USD)',
    flag: '🇨🇩',
    network_code: 'ORANGE_CD_USD',
    network_name: 'Orange Congo (USD)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.7, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.2, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CD_USD',
    country_name: 'RDC (USD)',
    flag: '🇨🇩',
    network_code: 'VODACOM_CD_USD',
    network_name: 'Vodacom Congo (USD)',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.2, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 0, currency: 'USD', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 16. République Démocratique du Congo (CD)
  {
    country_code: 'CD',
    country_name: 'République Démocratique du Congo',
    flag: '🇨🇩',
    network_code: 'AFRIMONEY_CD',
    network_name: 'Afrimoney Congo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.5, fixed: 0, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.8, fixed: 0, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CD',
    country_name: 'République Démocratique du Congo',
    flag: '🇨🇩',
    network_code: 'AIRTEL_CD',
    network_name: 'Airtel Congo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.7, fixed: 0, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CD',
    country_name: 'République Démocratique du Congo',
    flag: '🇨🇩',
    network_code: 'ORANGE_CD',
    network_name: 'Orange Congo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.45, fixed: 0, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 3.2, fixed: 50, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'CD',
    country_name: 'République Démocratique du Congo',
    flag: '🇨🇩',
    network_code: 'VODACOM_CD',
    network_name: 'Vodacom Congo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.2, fixed: 0, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'CDF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 17. Rwanda (RW)
  {
    country_code: 'RW',
    country_name: 'Rwanda',
    flag: '🇷🇼',
    network_code: 'AIRTEL_RW',
    network_name: 'Airtel Rwanda',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.75, fixed: 0, currency: 'RWF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.8, fixed: 0, currency: 'RWF', fee_charge_mode: 'ADD_ON', note: 'min 2300 RWF' }]
    }
  },
  {
    country_code: 'RW',
    country_name: 'Rwanda',
    flag: '🇷🇼',
    network_code: 'MTN_MOMO_RW',
    network_name: 'MTN MoMo Rwanda',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.75, fixed: 0, currency: 'RWF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.8, fixed: 0, currency: 'RWF', fee_charge_mode: 'ADD_ON', note: 'min 2300 RWF' }]
    }
  },

  // 18. Sénégal (SN)
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'PAYDUNYA_SN',
    network_name: 'Compte PayDunya',
    payin: {
      available: true,
      configured: false,
      is_custom: false,
      tiers: []
    },
    payout: {
      available: true,
      configured: false,
      is_custom: false,
      tiers: []
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'DJAMO_SN',
    network_name: 'Djamo Sénégal',
    payin: {
      available: true,
      configured: false,
      is_custom: false,
      tiers: []
    },
    payout: {
      available: true,
      configured: false,
      is_custom: false,
      tiers: []
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'EXPRESSO_SN',
    network_name: 'Expresso Sénégal',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.9, fixed: 100, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'FREE_MONEY_SN',
    network_name: 'Free Money Senegal',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.05, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.7, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'ORANGE_MONEY_SN',
    network_name: 'Orange Money Senegal',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.15, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.7, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'WAVE_SN',
    network_name: 'Wave Senegal',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.15, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.7, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'SN',
    country_name: 'Sénégal',
    flag: '🇸🇳',
    network_code: 'WIZALL_SN',
    network_name: 'Wizall Senegal',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.0, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 19. Sierra Leone (SL)
  {
    country_code: 'SL',
    country_name: 'Sierra Leone',
    flag: '🇸🇱',
    network_code: 'ORANGE_SL',
    network_name: 'Orange Sierra Leone',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 0, currency: 'SLE', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.5, fixed: 50, currency: 'SLE', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 20. Tanzanie (TZ)
  {
    country_code: 'TZ',
    country_name: 'Tanzanie',
    flag: '🇹🇿',
    network_code: 'AIRTEL_TZ',
    network_name: 'Airtel Tanzania',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 7.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'TZ',
    country_name: 'Tanzanie',
    flag: '🇹🇿',
    network_code: 'EZYPESA_TZ',
    network_name: 'EzyPesa Tanzania',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 7.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'TZ',
    country_name: 'Tanzanie',
    flag: '🇹🇿',
    network_code: 'HALOPESA_TZ',
    network_name: 'Halopesa',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 7.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'TZ',
    country_name: 'Tanzanie',
    flag: '🇹🇿',
    network_code: 'TTCL_TZ',
    network_name: 'TTCL Tanzania',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.5, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 7.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'TZ',
    country_name: 'Tanzanie',
    flag: '🇹🇿',
    network_code: 'TIGO_TZ',
    network_name: 'Tigo Tanzania',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 7.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'TZ',
    country_name: 'Tanzanie',
    flag: '🇹🇿',
    network_code: 'VODACOM_TZ',
    network_name: 'Vodacom Tanzania',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 6.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 7.0, fixed: 0, currency: 'TZS', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },

  // 21. Togo (TG)
  {
    country_code: 'TG',
    country_name: 'Togo',
    flag: '🇹🇬',
    network_code: 'MOOV_MONEY_TG',
    network_name: 'Moov Money Togo',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.1, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  },
  {
    country_code: 'TG',
    country_name: 'Togo',
    flag: '🇹🇬',
    network_code: 'TOGOCEL_TG',
    network_name: 'Togocel Money',
    payin: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 5.1, fixed: 0, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    },
    payout: {
      available: true,
      is_custom: false,
      tiers: [{ percent: 4.2, fixed: 50, currency: 'XOF', fee_charge_mode: 'ADD_ON', note: null }]
    }
  }
];

function initPricingSection() {
  const searchInput = document.getElementById('pricingSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(pricingSearchDebounce);
      pricingSearchDebounce = setTimeout(() => {
        renderPricingRates(e.target.value);
      }, 80);
    });
  }

  // Initialiser immédiatement avec les tarifs locaux par défaut si non chargés
  if (!VPState.pricingRates || VPState.pricingRates.length === 0) {
    VPState.pricingRates = defaultClientPricingRates;
    renderPricingRates();
  }

  // Charger depuis l'API backend
  fetchPricingRates();
}

async function fetchPricingRates() {
  try {
    const res = await fetch('/api/v1/pricing/my-rates');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        VPState.pricingRates = data.data;
        renderPricingRates(document.getElementById('pricingSearchInput')?.value || '');
        return;
      }
    }
  } catch (err) {
    console.warn('Impossible de charger les tarifs depuis l\'API:', err);
  }

  // Fallback si l'API est indisponible
  if (!VPState.pricingRates || VPState.pricingRates.length === 0) {
    VPState.pricingRates = defaultClientPricingRates;
    renderPricingRates(document.getElementById('pricingSearchInput')?.value || '');
  }
}

function renderPricingRates(search = '') {
  const container = document.getElementById('pricingCountriesContainer');
  if (!container) return;

  const q = (search || '').trim().toLowerCase();
  const rates = (VPState.pricingRates && VPState.pricingRates.length > 0)
    ? VPState.pricingRates
    : defaultClientPricingRates;

  const filtered = rates.filter(r => {
    if (!q) return true;
    const countryName = (r.country_name || '').toLowerCase();
    const networkName = (r.network_name || '').toLowerCase();
    const countryCode = (r.country_code || '').toLowerCase();
    return countryName.includes(q) || networkName.includes(q) || countryCode.includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="rounded-2xl border border-dashed border-[#ECEEF6] bg-white p-12 text-center shadow-xs">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-[#0052FF]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p class="mt-3 text-sm font-semibold text-[#111827]">Aucun réseau ne correspond à cette recherche.</p>
        <p class="mt-1 text-xs text-[#6B7280]">Essayez avec un autre terme (ex: Bénin, Côte d'Ivoire, MTN, Wave, Moov...).</p>
      </div>
    `;
    return;
  }

  // Grouper par pays en préservant l'ordre naturel
  const countryMap = new Map();
  filtered.forEach(item => {
    if (!countryMap.has(item.country_code)) {
      countryMap.set(item.country_code, {
        code: item.country_code,
        name: item.country_name,
        flag: item.flag,
        rows: []
      });
    }
    countryMap.get(item.country_code).rows.push(item);
  });

  // Trier alphabétiquement (Crypto USD s'insère à 'Crypto (USD)')
  const sortedCountries = Array.from(countryMap.values()).sort((a, b) => {
    return a.name.localeCompare(b.name, 'fr');
  });

  container.innerHTML = sortedCountries.map(c => `
    <div class="rounded-2xl border border-[#ECEEF6] bg-white p-6 sm:p-7 shadow-xs">
      <h3 class="mb-5 text-base font-bold text-[#111827]">${c.name}</h3>

      <div class="overflow-x-auto">
        <table class="w-full border-separate border-spacing-y-2 text-left text-xs">
          <thead>
            <tr class="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              <th class="pb-2 pl-4 w-[40%]">RÉSEAU</th>
              <th class="pb-2 w-[30%]">ENCAISSEMENT</th>
              <th class="pb-2 pr-4 w-[30%]">DÉCAISSEMENT</th>
            </tr>
          </thead>
          <tbody>
            ${c.rows.map(r => renderPricingRow(r)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');
}

function renderPricingRow(row) {
  return `
    <tr class="rounded-xl bg-[#F8FAFC] text-[#111827] transition-colors hover:bg-slate-100/70">
      <td class="rounded-l-xl py-3 pl-4 font-semibold text-[#111827] align-middle whitespace-nowrap">
        <span class="font-semibold text-[#111827] text-xs sm:text-sm">${row.network_name}</span>
      </td>
      <td class="py-3 pr-3 align-middle">
        ${renderPricingDirection(row.payin, row.network_name, 'payin')}
      </td>
      <td class="rounded-r-xl py-3 pr-4 align-middle">
        ${renderPricingDirection(row.payout, row.network_name, 'payout')}
      </td>
    </tr>
  `;
}

function renderPricingDirection(dir, networkName, type) {
  if (!dir) {
    return `<span class="text-xs font-normal text-[#9CA3AF]">Non configuré</span>`;
  }

  if (dir.configured === false) {
    return `<span class="text-xs font-normal text-[#9CA3AF]">Non configuré</span>`;
  }

  if (dir.available === false) {
    return `<span class="text-xs font-normal text-[#9CA3AF]">Indisponible actuellement</span>`;
  }

  if (!dir.tiers || dir.tiers.length === 0) {
    return `<span class="text-xs font-normal text-[#9CA3AF]">Non configuré</span>`;
  }

  const customPill = dir.is_custom ? `
    <span class="mb-1 inline-block rounded-full bg-[#0052FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0052FF]">
      Tarif personnalisé
    </span>
  ` : '';

  const tiersHtml = dir.tiers.map(t => {
    const feeStr = formatPricingFee(t);
    const modeStr = (t.fee_charge_mode === 'DEDUCTED') ? '(déduits)' : '(ajoutés)';

    let noteHtml = '';
    if (t.note) {
      noteHtml = `<div class="text-[11px] text-[#9CA3AF] font-normal mt-0.5">${t.note}</div>`;
    } else if (t.floor_amount || t.cap_amount) {
      const parts = [];
      if (t.floor_amount) parts.push(`min ${formatCurrencyAmount(t.floor_amount, t.currency)}`);
      if (t.cap_amount) parts.push(`max ${formatCurrencyAmount(t.cap_amount, t.currency)}`);
      noteHtml = `<div class="text-[11px] text-[#9CA3AF] font-normal mt-0.5">${parts.join(' · ')}</div>`;
    }

    return `
      <div>
        <div class="inline-flex items-baseline gap-1 flex-wrap">
          <span class="font-bold text-[#111827] text-xs sm:text-sm">${feeStr}</span>
          <span class="text-xs font-normal text-[#9CA3AF]">${modeStr}</span>
        </div>
        ${noteHtml}
      </div>
    `;
  }).join('');

  return `<div>${customPill}${tiersHtml}</div>`;
}

function formatPricingFee(tier) {
  const p = typeof tier.percent === 'number' && tier.percent > 0;
  const f = typeof tier.fixed === 'number' && tier.fixed > 0;

  if (p && f) {
    return `${tier.percent}% + ${formatCurrencyAmount(tier.fixed, tier.currency)}`;
  }
  if (p) {
    return `${tier.percent}%`;
  }
  if (f) {
    return formatCurrencyAmount(tier.fixed, tier.currency);
  }
  return '0%';
}

function formatCurrencyAmount(val, cur = 'XOF') {
  if (val === null || val === undefined) return '';
  return `${Number(val).toLocaleString('fr-FR')} ${cur}`;
}

function getNetworkBadge(name, code) {
  const n = (name || '').toLowerCase();
  let bg = 'bg-slate-100 text-slate-700';
  let label = name.slice(0, 3).toUpperCase();

  if (n.includes('wave')) {
    bg = 'bg-[#1DC3EC]/15 text-[#0094C6]';
    label = '🌊';
  } else if (n.includes('orange')) {
    bg = 'bg-[#FF6600]/15 text-[#E65100]';
    label = 'OM';
  } else if (n.includes('mtn')) {
    bg = 'bg-[#FFCC00]/25 text-[#B45309]';
    label = 'MTN';
  } else if (n.includes('moov')) {
    bg = 'bg-[#004F9F]/15 text-[#004F9F]';
    label = 'Moov';
  } else if (n.includes('celtiis')) {
    bg = 'bg-teal-50 text-teal-700';
    label = 'CLT';
  } else if (n.includes('t-money')) {
    bg = 'bg-amber-50 text-amber-700';
    label = 'TM';
  } else if (n.includes('free')) {
    bg = 'bg-rose-50 text-rose-600';
    label = 'Free';
  } else if (n.includes('airtel')) {
    bg = 'bg-red-50 text-red-600';
    label = 'Artl';
  } else if (n.includes('carte') || n.includes('visa')) {
    bg = 'bg-indigo-50 text-indigo-700';
    label = '💳';
  } else if (n.includes('apple') || n.includes('google')) {
    bg = 'bg-slate-900 text-white';
    label = '';
  } else if (n.includes('virement') || n.includes('bank')) {
    bg = 'bg-blue-50 text-blue-700';
    label = '🏛️';
  }

  return `<span class="inline-flex h-7 w-7 items-center justify-center rounded-lg ${bg} text-[11px] font-bold shadow-xs flex-shrink-0">${label}</span>`;
}

/* ========================================================
   10. PARAMÈTRES AVANCÉS DU MARCHAND (100% CONFORME SASPAY)
   ======================================================== */

function initSettingsSubTabs() {
  const buttons = document.querySelectorAll('.settings-subtab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-settings-tab');
      switchSettingsSubTab(tabId);
    });
  });

  // Listener upload logo
  const logoInput = document.getElementById('settingsLogoFileInput');
  if (logoInput) {
    logoInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('Format invalide', 'Utilisez un fichier JPEG, PNG ou WebP.');
        return;
      }
      if (file.size > 2097152) {
        showToast('Fichier trop lourd', 'La taille maximale autorisée est de 2 Mo.');
        return;
      }

      // Convertir en data URL pour prévisualisation immédiate et sauvegarde
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Logo = reader.result;
        const preview = document.getElementById('settingsLogoPreview');
        if (preview) {
          preview.innerHTML = `<img src="${base64Logo}" class="w-full h-full object-cover rounded-2xl">`;
        }

        try {
          await fetch('/api/v1/merchant/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${VPState.token}`
            },
            body: JSON.stringify({ logo_url: base64Logo })
          });
          showToast('Logo mis à jour !', 'Le nouveau logo a été enregistré.');
        } catch (err) {
          console.warn('Erreur logo upload:', err);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

function switchSettingsSubTab(tabId) {
  VPState.activeSettingsSubTab = tabId;
  const buttons = document.querySelectorAll('.settings-subtab-btn');
  const panels = document.querySelectorAll('.settings-subtab-panel');

  buttons.forEach(btn => {
    const isCurrent = btn.getAttribute('data-settings-tab') === tabId;
    if (isCurrent) {
      btn.className = 'settings-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all bg-[#0052FF] text-white shadow-[0_8px_18px_-8px_rgba(0, 82, 255,0.6)]';
    } else {
      btn.className = 'settings-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-[#6B7280] hover:bg-blue-50 hover:text-[#111827]';
    }
  });

  panels.forEach(panel => {
    if (panel.id === `subtab-panel-${tabId}`) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  });
}

async function loadAndRenderSettings() {
  try {
    const res = await fetch('/api/v1/merchant/settings', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    if (!res.ok) return;

    const resData = await res.json();
    if (!resData.success || !resData.data) return;

    const s = resData.data;
    VPState.settings = s;

    // 1. KYC
    if (s.kyc) {
      const badgeText = document.getElementById('kycStatusBadgeText');
      const badgeIcon = document.getElementById('kycStatusIcon');
      const docType = document.getElementById('kycDocType');
      const docNumber = document.getElementById('kycDocNumber');
      const mgrName = document.getElementById('kycManagerName');
      const vDate = document.getElementById('kycVerifiedDate');

      const isVerified = s.kyc.status === 'VERIFIED';
      if (badgeText) {
        badgeText.textContent = isVerified ? 'Vérifié' : (s.kyc.status === 'PENDING' ? 'En cours' : 'Non vérifié');
        badgeText.className = isVerified ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600';
      }
      if (badgeIcon) {
        badgeIcon.textContent = isVerified ? '✓' : '⏳';
        badgeIcon.className = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'} text-lg`;
      }
      if (docType) docType.textContent = s.kyc.document_type || 'Carte Nationale d\'Identité (CNI)';
      if (docNumber) docNumber.textContent = s.kyc.document_number || '—';
      if (mgrName) mgrName.textContent = s.kyc.manager_name || VPState.merchant?.full_name || VPState.merchant?.business_name || '—';
      if (vDate) vDate.textContent = s.kyc.verified_date || '—';
    }

    // 2. Entreprise
    if (s.entreprise) {
      const appName = document.getElementById('settingsAppName');
      const category = document.getElementById('settingsCategory');
      const suppEmail = document.getElementById('settingsSupportEmail');
      const suppPhone = document.getElementById('settingsSupportPhone');
      const website = document.getElementById('settingsWebsite');
      const dangerName = document.getElementById('dangerBusinessName');
      const logoPreview = document.getElementById('settingsLogoPreview');

      if (appName) appName.value = s.entreprise.name || '';
      if (category && s.entreprise.category) category.value = s.entreprise.category;
      if (suppEmail) suppEmail.value = s.entreprise.support_email || '';
      if (suppPhone) suppPhone.value = s.entreprise.support_phone || '';
      if (website) website.value = s.entreprise.website_url || '';
      if (dangerName) dangerName.textContent = s.entreprise.name || 'VandiasPay';
      if (logoPreview) {
        if (s.entreprise.logo_url) {
          logoPreview.innerHTML = `<img src="${s.entreprise.logo_url}" class="w-full h-full object-cover rounded-2xl">`;
        } else if (s.entreprise.name) {
          logoPreview.textContent = s.entreprise.name.charAt(0).toUpperCase();
        }
      }
    }

    // 3. Frais
    if (s.frais) {
      const payin = document.getElementById('selectFeePayin');
      const payout = document.getElementById('selectFeePayout');
      const override = document.getElementById('checkFeeOverride');

      if (payin) payin.value = s.frais.fee_payin_mode || 'ADD_ON';
      if (payout) payout.value = s.frais.fee_payout_mode || 'DEDUCTED';
      if (override) override.checked = s.frais.allow_client_override === true;
    }

    // 4. Équipe
    if (s.equipe) {
      renderTeamMembers(s.equipe);
    }
    const teamBizName = document.getElementById('teamBusinessNameText');
    if (teamBizName && s.entreprise) teamBizName.textContent = s.entreprise.name;

    // 5. Profil
    if (s.profil) {
      const pName = document.getElementById('profileFullName');
      const pEmail = document.getElementById('profileEmailDisabled');
      const pCountry = document.getElementById('profileCountry');

      if (pName) pName.value = s.profil.full_name || '';
      if (pEmail) pEmail.value = s.profil.email || '';
      if (pCountry && s.profil.country) pCountry.value = s.profil.country;
    }

    // 6. Sécurité
    if (s.securite) {
      const secSubtitle = document.getElementById('security2faSubtitle');
      if (secSubtitle) {
        secSubtitle.textContent = s.securite.two_factor_enabled
          ? `Actif — protégé par vérification ${s.securite.two_factor_method || 'email'}.`
          : "Désactivé — renforce la sécurité de tes fonds et de tes transactions.";
      }
    }
  } catch (err) {
    console.warn('Erreur lors du chargement des paramètres:', err);
  }
}

function renderTeamMembers(members = []) {
  const tbody = document.getElementById('teamMembersBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (members.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="py-6 text-center text-xs text-slate-400">Aucun membre invité pour le moment.</td>
      </tr>
    `;
    return;
  }

  members.forEach(m => {
    const isOwner = m.role === 'OWNER';
    const roleColors = {
      OWNER: 'bg-blue-100 text-[#0052FF]',
      ADMIN: 'bg-blue-100 text-blue-700',
      FINANCE: 'bg-emerald-100 text-emerald-700',
      DEVELOPER: 'bg-amber-100 text-amber-700',
      SUPPORT: 'bg-slate-100 text-slate-700'
    };
    const roleLabels = {
      OWNER: 'Propriétaire',
      ADMIN: 'Administrateur',
      FINANCE: 'Finance',
      DEVELOPER: 'Développeur',
      SUPPORT: 'Support'
    };

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F8F9FD] transition-colors';
    tr.innerHTML = `
      <td class="py-3 px-3">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-blue-100 text-[#0052FF] font-bold text-xs flex items-center justify-center">
            ${(m.name || m.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="font-bold text-[#111827] text-xs">${m.name || 'Membre'}</p>
            <p class="text-[11px] text-slate-400 font-mono">${m.email}</p>
          </div>
        </div>
      </td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${roleColors[m.role] || 'bg-slate-100 text-slate-700'}">
          ${roleLabels[m.role] || m.role}
        </span>
      </td>
      <td class="py-3 px-3">
        <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold ${m.status === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}">
          <span class="w-1.5 h-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          ${m.status === 'ACTIVE' ? 'Actif' : 'Invité'}
        </span>
      </td>
      <td class="py-3 px-3 text-right">
        ${isOwner ? '<span class="text-[11px] text-slate-400 font-semibold italic">Principal</span>' : `
          <button type="button" onclick="removeTeamMember('${m.id}')" class="text-rose-500 hover:text-rose-700 font-semibold text-xs hover:underline">
            Retirer
          </button>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function removeTeamMember(id) {
  if (!confirm("Voulez-vous vraiment retirer ce membre de l'équipe ?")) return;
  try {
    const res = await fetch(`/api/v1/merchant/settings/team/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Membre retiré', 'L\'équipe a été mise à jour.');
      loadAndRenderSettings();
    } else {
      showToast('Erreur', data.error);
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}

function initAllSettingsForms() {
  // 1. Formulaire Entreprise
  const formCompany = document.getElementById('formSettingsCompany');
  if (formCompany) {
    formCompany.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('settingsAppName').value;
      const category = document.getElementById('settingsCategory').value;
      const support_email = document.getElementById('settingsSupportEmail').value;
      const support_phone = document.getElementById('settingsSupportPhone').value;
      const website_url = document.getElementById('settingsWebsite').value;

      try {
        const res = await fetch('/api/v1/merchant/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ business_name: name, category, support_email, support_phone, website_url, phone: support_phone })
        });
        const data = await res.json();
        if (data.success) {
          if (VPState.merchant) {
            VPState.merchant.business_name = name;
            VPState.merchant.phone = support_phone;
          }
          showToast('Modifications enregistrées !', 'Informations de l\'entreprise mises à jour.');
          renderAllDashboardElements();
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // 2. Bouton Sauvegarder Frais
  const btnSaveFees = document.getElementById('btnSaveFeeSettings');
  if (btnSaveFees) {
    btnSaveFees.addEventListener('click', async () => {
      const fee_payin_mode = document.getElementById('selectFeePayin').value;
      const fee_payout_mode = document.getElementById('selectFeePayout').value;
      const allow_client_override = document.getElementById('checkFeeOverride').checked;

      try {
        const res = await fetch('/api/v1/merchant/settings/fees', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ fee_payin_mode, fee_payout_mode, allow_client_override })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Réglages enregistrés !', 'Modes de frais par défaut mis à jour.');
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // 3. Inviter un membre dans l'équipe
  const formInvite = document.getElementById('formInviteMember');
  if (formInvite) {
    formInvite.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('inviteMemberEmail').value;
      const role = document.getElementById('inviteMemberRole').value;

      try {
        const res = await fetch('/api/v1/merchant/settings/team/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ email, role })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Invitation envoyée !', `Un email a été envoyé à ${email}.`);
          document.getElementById('inviteMemberEmail').value = '';
          loadAndRenderSettings();
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // 4. Formulaire Profil
  const formProfile = document.getElementById('formSettingsProfile');
  if (formProfile) {
    formProfile.addEventListener('submit', async (e) => {
      e.preventDefault();
      const full_name = document.getElementById('profileFullName').value;
      const country = document.getElementById('profileCountry').value;

      try {
        const res = await fetch('/api/v1/merchant/settings/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ full_name, country })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Profil mis à jour !', 'Vos informations personnelles ont été enregistrées.');
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // 5. Changement de mot de passe
  const formPassword = document.getElementById('formChangePassword');
  if (formPassword) {
    formPassword.addEventListener('submit', async (e) => {
      e.preventDefault();
      const old_password = document.getElementById('pwdOld').value;
      const new_password = document.getElementById('pwdNew').value;
      const confirm = document.getElementById('pwdConfirm').value;

      if (new_password !== confirm) {
        showToast('Erreur de mot de passe', 'La confirmation ne correspond pas au nouveau mot de passe.');
        return;
      }

      try {
        const res = await fetch('/api/v1/merchant/settings/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ old_password, new_password, confirm })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Succès', 'Mot de passe modifié avec succès.');
          formPassword.reset();
        } else {
          showToast('Erreur', data.error);
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  // 6. Boutons 2FA
  const btnEmail2fa = document.getElementById('btnEnableEmail2fa');
  if (btnEmail2fa) {
    btnEmail2fa.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/v1/merchant/settings/2fa/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VPState.token}`
          },
          body: JSON.stringify({ method: 'EMAIL', enable: true })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Sécurité 2FA', 'Authentification par email activée.');
          loadAndRenderSettings();
        }
      } catch (err) {
        showToast('Erreur', err.message);
      }
    });
  }

  const btnTotp2fa = document.getElementById('btnEnableTotp2fa');
  if (btnTotp2fa) {
    btnTotp2fa.addEventListener('click', () => {
      showToast('TOTP Authenticator', 'Scannez le QR Code dans Google Authenticator ou Authy.');
    });
  }
}

function promptDeleteAccountModal() {
  openModal('modalDeleteAccount');
}

async function confirmDeleteAccount() {
  const reason = document.getElementById('deleteAccountReason')?.value || '';
  try {
    const res = await fetch('/api/v1/merchant/settings/delete-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VPState.token}`
      },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Demande envoyée', 'Un administrateur va traiter votre demande de suppression.');
      closeModal('modalDeleteAccount');
    }
  } catch (err) {
    showToast('Erreur', err.message);
  }
}
