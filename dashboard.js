/**
 * ========================================================
 * VANDIAS PAY — DASHBOARD INTERACTIVE ENGINE & SUPABASE AUTH
 * Version: 2.6 (100% Dynamique & Connecté API)
 * ========================================================
 */

// Détection automatique de l'URL du Backend API (gestion locale, file:// et port 4173)
const API_BASE_URL = (window.location.protocol === 'file:' || (window.location.hostname === 'localhost' && window.location.port !== '4173'))
  ? 'http://localhost:4173'
  : '';

// Intercepteur global de fetch pour garantir que tout appel relatif fonctionne même en file:// ou sur un autre serveur
const _nativeFetch = window.fetch;
window.fetch = function (resource, init) {
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    resource = API_BASE_URL + resource;
  }
  return _nativeFetch.call(this, resource, init);
};

// État de l'application Dashboard
const VPState = {
  token: localStorage.getItem('vandias_token') || null,
  merchant: null,
  apiKeys: [],
  transactions: [],
  paymentLinks: [],
  wallets: [
    { code: "XOF", country: "TG", name: "Togo", balance: 80, flag: "🇹🇬", symbol: "XOF" },
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
  selectedWebhookLog: null
};

document.addEventListener('DOMContentLoaded', async () => {
  initSidebarTabs();
  initMobileDrawer();
  initProfileDropdown();
  initAuthModalEvents();
  initActionModals();
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

/* ========================================================
   1. AUTHENTIFICATION & CHARGEMENT DYNAMIQUE DU MARCHAND
   ======================================================== */

function promptAuthModal() {
  openModal('modalAuth');
}

async function loadMerchantDashboard() {
  try {
    // 1. Profil Marchand & Clés API
    const meRes = await fetch('/api/v1/merchant/me', {
      headers: { 'Authorization': `Bearer ${VPState.token}` }
    });

    if (!meRes.ok) {
      if (meRes.status === 401) {
        localStorage.removeItem('vandias_token');
        VPState.token = null;
      }
      return false;
    }

    const meData = await meRes.json();
    if (!meData.success || !meData.merchant) return false;

    VPState.merchant = meData.merchant;
    VPState.apiKeys = meData.api_keys || [];
    localStorage.setItem('vandias_merchant', JSON.stringify(meData.merchant));

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

    // 4. Tarification réseau (conforme SasPay)
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

  // 1. Topbar & Profile Trigger
  const topbarLetter = document.getElementById('topbarAvatarLetter');
  const topbarName = document.getElementById('topbarMerchantName');
  if (topbarLetter) topbarLetter.textContent = initial;
  if (topbarName) topbarName.textContent = m.business_name;

  // 2. Profile Dropdown
  const menuLetter = document.getElementById('menuAvatarLetter');
  const menuName = document.getElementById('menuMerchantName');
  const menuEmail = document.getElementById('menuMerchantEmail');
  if (menuLetter) menuLetter.textContent = initial;
  if (menuName) menuName.textContent = m.business_name;
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

  // 8. Rendu des transactions (avec état vide élégant si 0 transactions)
  renderTransactionsList();
  renderFullTransactionsList();

  // 9. Liens de paiement
  renderPaymentLinksList();

  // 10. Clients CRM
  renderCustomersList();

  // 11. Tarification réseau (conforme SasPay)
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
   2. RENDU DES TRANSACTIONS & ÉTAT VIDE ÉLÉGANT
   ======================================================== */

function renderTransactionsList() {
  const container = document.getElementById('recentTxList');
  if (!container) return;

  container.innerHTML = '';

  // Si aucune transaction (nouveau marchand), afficher l'état vide élégant
  if (!VPState.transactions || VPState.transactions.length === 0) {
    container.innerHTML = `
      <div id="emptyTxState" class="p-6 text-center bg-[#F8F9FD] rounded-2xl border border-dashed border-[#ECEEF6] my-2">
        <div class="w-12 h-12 rounded-2xl bg-purple-50 text-[#5846F6] font-bold flex items-center justify-center text-xl mx-auto mb-3 shadow-sm">
          ⚡
        </div>
        <h3 class="text-sm font-bold text-[#111827] mb-1">Aucune transaction pour le moment</h3>
        <p class="text-xs text-slate-500 mb-4 max-w-xs mx-auto leading-relaxed">
          Créez votre premier lien de paiement pour commencer à encaisser vos clients !
        </p>
        <button onclick="openCreateLinkModal()" class="px-4 py-2.5 rounded-xl bg-[#5846F6] hover:bg-[#4B3BE0] text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all inline-flex items-center gap-2">
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
}

function renderFullTransactionsList() {
  const tbody = document.getElementById('fullTransactionsBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!VPState.transactions || VPState.transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-400">
          <div class="flex flex-col items-center justify-center">
            <span class="text-2xl mb-2">🧾</span>
            <span class="text-xs font-semibold text-[#111827]">Aucune transaction enregistrée</span>
            <span class="text-[11px] text-slate-400 mt-0.5">Partagez votre lien de paiement pour recevoir vos premiers règlements.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  VPState.transactions.forEach(t => {
    const isSuccess = t.status === 'SUCCESS';
    const isPending = t.status === 'PENDING';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F8F9FD] transition-colors';
    tr.innerHTML = `
      <td class="py-3 px-3 font-mono font-bold text-[#111827]">${t.id}</td>
      <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">${formatTxDate(t.created_at)}</td>
      <td class="py-3 px-3 font-medium text-slate-700">${t.customer_name || t.customer_phone || 'Anonyme'}</td>
      <td class="py-3 px-3 font-mono font-bold text-[#111827]">${parseFloat(t.amount_gross || 0).toLocaleString('fr-FR')}</td>
      <td class="py-3 px-3 font-mono font-semibold text-slate-500">${t.currency || 'XOF'}</td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${isSuccess ? 'bg-emerald-50 text-emerald-600' : isPending ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'}">
          ${isSuccess ? 'Réussi' : isPending ? 'En attente' : 'Échoué'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const exportBtn = document.getElementById('btnExportCsv');
  if (exportBtn) {
    exportBtn.onclick = () => {
      const csv = "ID,Date,Client,Montant,Devise,Statut\n" + VPState.transactions.map(t =>
        `${t.id},"${formatTxDate(t.created_at)}","${t.customer_name || ''}",${t.amount_gross},${t.currency},${t.status}`
      ).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `vandias_transactions_${Date.now()}.csv`);
      a.click();
      showToast("Exporté !", "Fichier CSV téléchargé avec succès.");
    };
  }
}

function formatTxDate(isoString) {
  if (!isoString) return 'Récemment';
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Récemment';
  }
}

/* ========================================================
   3. RENDU DES LIENS DE PAIEMENT
   ======================================================== */

function renderPaymentLinksList() {
  const container = document.getElementById('paymentLinksListContainer');
  if (!container) return;

  container.innerHTML = '';

  if (!VPState.paymentLinks || VPState.paymentLinks.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-white rounded-3xl border border-[#ECEEF6] shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-purple-50 text-[#5846F6] font-bold flex items-center justify-center text-xl mx-auto mb-3">
          🔗
        </div>
        <h3 class="text-sm font-bold text-[#111827] mb-1">Aucun lien de paiement pour le moment</h3>
        <p class="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
          Générez un lien en 1 clic pour vendre vos produits ou services sur WhatsApp, Telegram, TikTok ou votre site web.
        </p>
        <button onclick="openCreateLinkModal()" class="px-4 py-2.5 rounded-xl bg-[#5846F6] hover:bg-[#4B3BE0] text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all">
          + Créer un nouveau lien
        </button>
      </div>
    `;
    return;
  }

  VPState.paymentLinks.forEach(lnk => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-3xl bg-white border border-[#ECEEF6] shadow-sm flex flex-col justify-between hover:border-purple-200 transition-all';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
          <span class="truncate max-w-[140px]">${lnk.slug || lnk.id}</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">Actif</span>
        </div>
        <h4 class="text-sm font-bold text-[#111827] mb-2 truncate">${lnk.title}</h4>
        <div class="text-2xl font-black text-[#111827] font-mono mb-3">
          ${parseFloat(lnk.amount_fcfa || lnk.amount || 0).toLocaleString('fr-FR')} ${lnk.currency || 'XOF'}
        </div>
        <span class="text-xs text-slate-400 block">${lnk.sales_count || 0} ventes réalisées</span>
      </div>

      <div class="pt-4 border-t border-[#F0F2F9] mt-4 flex items-center justify-between gap-2">
        <button class="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-[#111827] transition-colors" onclick="navigator.clipboard.writeText('${lnk.url}'); showToast('Copié !', 'Lien copié dans le presse-papier.');">
          Copier le lien
        </button>
        <a href="${lnk.url}" target="_blank" class="p-2 rounded-xl bg-purple-50 text-[#5846F6] hover:bg-purple-100 transition-colors" title="Ouvrir le checkout">
          ⚡
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ========================================================
   4. CLIENTS CRM LIST
   ======================================================== */

function renderCustomersList() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  // Extraction des clients uniques à partir des transactions réelles
  const customerMap = new Map();
  VPState.transactions.forEach(t => {
    if (t.customer_phone || t.customer_name) {
      const key = t.customer_phone || t.customer_email || t.customer_name;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: t.customer_name || 'Client VandiasPay',
          phone: t.customer_phone || 'N/A',
          email: t.customer_email || 'N/A',
          purchases: 0,
          total: 0
        });
      }
      const entry = customerMap.get(key);
      entry.purchases += 1;
      if (t.status === 'SUCCESS') {
        entry.total += parseFloat(t.amount_gross || 0);
      }
    }
  });

  const list = Array.from(customerMap.values());

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-10 text-center text-slate-400 text-xs">
          Aucun client répertorié. Vos acheteurs s'afficheront automatiquement ici dès leur premier paiement.
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F8F9FD] transition-colors';
    tr.innerHTML = `
      <td class="py-3 px-3 font-bold text-[#111827]">${c.name}</td>
      <td class="py-3 px-3 font-mono text-slate-600">${c.phone}</td>
      <td class="py-3 px-3 font-mono text-slate-400 text-[11px]">${c.email}</td>
      <td class="py-3 px-3 font-bold text-[#111827]">${c.purchases}</td>
      <td class="py-3 px-3 font-bold text-emerald-600 font-mono">${c.total.toLocaleString('fr-FR')} XOF</td>
    `;
    tbody.appendChild(tr);
  });
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
    card.className = 'p-5 rounded-3xl bg-white border border-[#ECEEF6] shadow-sm hover:border-purple-200 transition-all flex flex-col justify-between';
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
        <button class="text-[#5846F6] font-bold hover:underline" onclick="showToast('Dépôt', 'Option de rechargement disponible.');">Dépôt</button>
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
        card.className = 'rounded-3xl border border-[#ECEEF6] bg-white p-5 sm:p-6 shadow-sm hover:border-violet-200 transition-all flex flex-col justify-between min-h-[145px]';
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
            <div class="rounded-xl bg-violet-50/50 p-2">
              <span class="text-[10px] font-medium text-[#6B7280] block">En attente</span>
              <p class="text-xs font-bold text-[#111827] font-mono mt-0.5">${formatWalletMoney(pending)} ${w.currency}</p>
            </div>
            <div class="rounded-xl bg-violet-50/50 p-2">
              <span class="text-[10px] font-medium text-[#6B7280] block">Gelé (litige)</span>
              <p class="text-xs font-bold ${frozen > 0 ? 'text-rose-600' : 'text-[#111827]'} font-mono mt-0.5">${formatWalletMoney(frozen)} ${w.currency}</p>
            </div>
          </div>` : ''}
        `;
        grid.appendChild(card);
      });
    }

    // Mettre à jour les filtres pays
    populateWalletCountryFilter(data.wallets);
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
          typeIcon = `<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold text-xs">↕</span>`;
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
          pageBtn.className = `px-2.5 py-1 rounded-lg text-xs font-semibold ${isCurr ? 'bg-[#5846F6] text-white shadow-sm' : 'border border-[#ECEEF6] bg-white text-[#111827] hover:bg-slate-50'}`;
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
          <button type="button" onclick="openWalletTransferDetailModal('${t.id}')" class="text-xs font-semibold text-[#5846F6] hover:underline">
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

function openWalletTransferModal() {
  const fromSelect = document.getElementById('transferFromCountry');
  const toSelect = document.getElementById('transferToCountry');
  const amountInput = document.getElementById('transferAmountInput');

  if (!fromSelect || !toSelect) return;

  fromSelect.innerHTML = '<option value="" disabled selected>Choisir un pays source</option>';
  toSelect.innerHTML = '<option value="" disabled selected>Choisir un pays de destination</option>';

  const wallets = VPState.walletsList || [];
  const sourceWallets = wallets.filter(w => parseFloat(w.available_amount || 0) > 0 && !w.is_frozen);
  if (sourceWallets.length === 0) {
    showToast('Information', 'Aucun portefeuille avec des fonds disponibles pour initier un transfert.');
    return;
  }

  sourceWallets.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.country;
    opt.textContent = `${getCountryFlag(w.country)} ${getCountryName(w.country)} (${formatWalletMoney(w.available_amount, w.currency)})`;
    fromSelect.appendChild(opt);
  });

  fromSelect.selectedIndex = 1;
  const initialSourceCountry = fromSelect.value;
  populateTransferDestinationOptions(initialSourceCountry);

  if (amountInput) amountInput.value = '';
  updateTransferEstimate();
  openModal('modalWalletTransfer');
}

function populateTransferDestinationOptions(sourceCountry) {
  const toSelect = document.getElementById('transferToCountry');
  if (!toSelect) return;

  toSelect.innerHTML = '<option value="" disabled selected>Choisir un pays de destination</option>';
  const wallets = VPState.walletsList || [];

  wallets.filter(w => w.country !== sourceCountry && !w.is_frozen).forEach(w => {
    const opt = document.createElement('option');
    opt.value = w.country;
    opt.textContent = `${getCountryFlag(w.country)} ${getCountryName(w.country)} (${w.currency})`;
    toSelect.appendChild(opt);
  });

  if (toSelect.options.length > 1) {
    toSelect.selectedIndex = 1;
  }
}

function updateTransferEstimate() {
  const fromSelect = document.getElementById('transferFromCountry');
  const toSelect = document.getElementById('transferToCountry');
  const amountInput = document.getElementById('transferAmountInput');
  const currLabel = document.getElementById('transferSourceCurrencyLabel');
  const estimateEl = document.getElementById('transferConversionEstimate');

  if (!fromSelect || !toSelect || !amountInput || !estimateEl) return;

  const fromCountry = fromSelect.value;
  const toCountry = toSelect.value;
  const amount = parseFloat(amountInput.value || 0);

  const sourceW = (VPState.walletsList || []).find(w => w.country === fromCountry);
  const destW = (VPState.walletsList || []).find(w => w.country === toCountry);

  if (currLabel) {
    currLabel.textContent = sourceW ? `(${sourceW.currency})` : '';
  }

  if (!sourceW || !destW || amount <= 0) {
    estimateEl.classList.add('hidden');
    return;
  }

  const rate = getInterwalletRate(sourceW.currency, destW.currency);
  const converted = amount * rate;

  estimateEl.classList.remove('hidden');
  estimateEl.innerHTML = `
    ≈ <span class="font-bold text-[#111827]">${formatWalletMoney(converted, destW.currency)}</span> reçu
    <span class="text-slate-400 text-[11px] block mt-0.5">Taux de conversion : 1 ${sourceW.currency} = ${rate.toFixed(4)} ${destW.currency}</span>
  `;
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
      <div class="py-3 flex items-center justify-between bg-violet-50/40 p-3 rounded-2xl">
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
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-[#5846F6]">Mobile Money</span>`
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
      btn.className = 'payout-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all bg-[#5846F6] text-white shadow-[0_8px_18px_-8px_rgba(88,70,246,0.6)]';
    } else {
      btn.className = 'payout-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-[#6B7280] hover:bg-violet-50 hover:text-[#111827]';
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
            : [
                { country: 'SN', currency: 'XOF', available_amount: 150000 },
                { country: 'TG', currency: 'XOF', available_amount: 80 },
                { country: 'CI', currency: 'XOF', available_amount: 0 },
                { country: 'BJ', currency: 'XOF', available_amount: 0 }
              ];
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
}

function switchDevSubTab(tabId) {
  VPState.activeDevSubTab = tabId;
  const buttons = document.querySelectorAll('.dev-subtab-btn');
  const panels = document.querySelectorAll('.dev-subtab-panel');

  buttons.forEach(btn => {
    const isCurrent = btn.getAttribute('data-dev-tab') === tabId;
    if (isCurrent) {
      btn.className = 'dev-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all bg-[#5846F6] text-white shadow-[0_8px_18px_-8px_rgba(88,70,246,0.6)]';
    } else {
      btn.className = 'dev-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-[#6B7280] hover:bg-violet-50 hover:text-[#111827]';
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
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[#5846F6]">
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
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[#5846F6]">
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
            <button type="button" class="rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1 text-xs font-semibold text-[#5846F6] hover:bg-violet-100 transition-colors inline-flex items-center gap-1" onclick="testWebhook('${w.id}')">
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
          <button type="button" class="text-xs font-semibold text-[#5846F6] hover:underline" onclick='openWebhookLogDetailModal(${JSON.stringify(log).replace(/'/g, "&apos;")})'>
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
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  const btnQuickDemo = document.getElementById('btnQuickDemoLogin');

  if (tabLogin && tabRegister && formLogin && formRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('bg-white', 'text-[#111827]', 'shadow-sm');
      tabLogin.classList.remove('text-[#6B7280]');
      tabRegister.classList.remove('bg-white', 'text-[#111827]', 'shadow-sm');
      tabRegister.classList.add('text-[#6B7280]');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
      if (title) title.textContent = "Connexion au Dashboard";
      if (subtitle) subtitle.textContent = "Accédez à vos wallets, liens de paiement et clés API.";
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('bg-white', 'text-[#111827]', 'shadow-sm');
      tabRegister.classList.remove('text-[#6B7280]');
      tabLogin.classList.remove('bg-white', 'text-[#111827]', 'shadow-sm');
      tabLogin.classList.add('text-[#6B7280]');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
      if (title) title.textContent = "Nouveau Compte Marchand";
      if (subtitle) subtitle.textContent = "Démarrez avec 0 FCFA de solde et générez vos clés d'API instantanément.";
    });
  }

  // Soumission Formulaire Connexion
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('btnSubmitLogin');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Vérification...';
      }

      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success && data.token) {
          localStorage.setItem('vandias_token', data.token);
          VPState.token = data.token;
          closeModal('modalAuth');
          showToast('Connexion réussie !', `Bienvenue, ${data.merchant.business_name}.`);
          await loadMerchantDashboard();
        } else {
          showToast('Erreur', data.error || 'Identifiants incorrects.');
        }
      } catch (err) {
        showToast('Erreur de connexion', err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Se connecter';
        }
      }
    });
  }

  // Bouton Connexion Démo Rapide
  if (btnQuickDemo) {
    btnQuickDemo.addEventListener('click', async () => {
      document.getElementById('loginEmail').value = 'demo@vandiaspay.com';
      document.getElementById('loginPassword').value = 'vandias2026';
      formLogin.dispatchEvent(new Event('submit'));
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
          btn.innerHTML = `<svg class="w-4 h-4 text-[#5846F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`;
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
      const business_name = document.getElementById('regBusinessName')?.value?.trim();
      const email = document.getElementById('regEmail')?.value?.trim();
      const phone = document.getElementById('regPhone')?.value?.trim();
      const password = document.getElementById('regPassword')?.value;
      const passwordConfirm = document.getElementById('regPasswordConfirm')?.value;
      const mismatchEl = document.getElementById('regPasswordMismatchError');
      const submitBtn = document.getElementById('btnSubmitRegister');

      if (!business_name || !email || !password) {
        showToast('Champs requis', 'Veuillez renseigner le nom de l\'entreprise, l\'email et le mot de passe.');
        return;
      }

      if (password.length < 6) {
        showToast('Mot de passe trop court', 'Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }

      if (passwordConfirm !== undefined && passwordConfirm !== null && password !== passwordConfirm) {
        if (mismatchEl) mismatchEl.classList.remove('hidden');
        showToast('Mots de passe non identiques', 'Veuillez retaper le même mot de passe dans la confirmation.');
        return;
      } else if (mismatchEl) {
        mismatchEl.classList.add('hidden');
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Création du compte...';
      }

      try {
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_name, email, phone, password })
        });
        const data = await res.json();

        if (data.success && data.token) {
          localStorage.setItem('vandias_token', data.token);
          VPState.token = data.token;
          closeModal('modalAuth');
          showToast('Bienvenue sur VandiasPay !', `Compte ${data.merchant?.business_name || business_name} actif (Solde: 0 FCFA).`);
          await loadMerchantDashboard();
        } else {
          showToast('Erreur', data.error || "Impossible de créer le compte.");
        }
      } catch (err) {
        console.error('Erreur inscription:', err);
        showToast('Erreur de connexion', 'Vérifiez que le serveur VandiasPay est démarré sur http://localhost:4173 (' + err.message + ')');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Créer mon compte marchand (Solde 0 FCFA)';
        }
      }
    });
  }
}

/* ========================================================
   7. NAVIGATION & ACTIONS DU DASHBOARD
   ======================================================== */

function switchTab(tabKey) {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.dashboard-section');

  navItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabKey) {
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

function openCreateLinkModal() {
  openModal('modalCreateLink');
}

function initActionModals() {
  const btnPayout = document.getElementById('btnOpenPayoutModal');
  if (btnPayout) {
    btnPayout.addEventListener('click', () => openModal('modalPayoutQuick'));
  }

  const btnCreateLink = document.getElementById('btnOpenCreateLinkModal');
  if (btnCreateLink) {
    btnCreateLink.addEventListener('click', () => openModal('modalCreateLink'));
  }

  // Création d'un lien de paiement
  const createForm = document.getElementById('createLinkForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newLinkTitle').value;
      const amount = parseFloat(document.getElementById('newLinkAmount').value);

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
          body: JSON.stringify({ title, amount_fcfa: amount })
        });
        const data = await res.json();

        if (data.success && data.payment_link) {
          VPState.paymentLinks.unshift(data.payment_link);
          renderPaymentLinksList();
          closeModal('modalCreateLink');
          createForm.reset();
          showToast("Lien créé avec succès !", data.payment_link.title);
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

  // Charger immédiatement les tarifs dès l'initialisation
  fetchPricingRates();
}

async function fetchPricingRates() {
  try {
    const res = await fetch('/api/v1/pricing/my-rates');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        VPState.pricingRates = data.data;
        renderPricingRates(document.getElementById('pricingSearchInput')?.value || '');
      }
    }
  } catch (err) {
    console.warn('Impossible de charger les tarifs depuis l\'API:', err);
  }
}

function renderPricingRates(search = '') {
  const container = document.getElementById('pricingCountriesContainer');
  if (!container) return;

  const q = (search || '').trim().toLowerCase();
  const rates = VPState.pricingRates || [];

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
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-xl text-[#5846F6]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p class="mt-3 text-sm font-semibold text-[#111827]">Aucun réseau ne correspond à cette recherche.</p>
        <p class="mt-1 text-xs text-[#6B7280]">Essayez avec un autre terme (ex: Bénin, Sénégal, Wave, Orange, MTN, Carte...).</p>
      </div>
    `;
    return;
  }

  // Grouper par pays
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

  // Trier alphabétiquement (International en fin de liste)
  const sortedCountries = Array.from(countryMap.values()).sort((a, b) => {
    if (a.code === 'INTL') return 1;
    if (b.code === 'INTL') return -1;
    return a.name.localeCompare(b.name, 'fr');
  });

  container.innerHTML = sortedCountries.map(c => `
    <div class="rounded-2xl border border-[#ECEEF6] bg-white p-5 sm:p-6 shadow-sm">
      <p class="mb-4 text-sm font-bold text-[#111827] flex items-center gap-2">
        <span class="text-xl">${c.flag}</span>
        <span>${c.name}</span>
        <span class="text-[11px] font-medium text-[#6B7280]">(${c.rows.length} réseau${c.rows.length > 1 ? 'x' : ''})</span>
      </p>

      <div class="overflow-x-auto">
        <table class="w-full border-separate border-spacing-y-2 text-left text-xs">
          <thead>
            <tr class="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              <th class="pb-1 pl-4">Réseau</th>
              <th class="pb-1">Encaissement</th>
              <th class="pb-1 pr-4">Décaissement</th>
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
    <tr class="rounded-xl bg-violet-50/40 text-[#111827] transition-colors hover:bg-violet-50/70">
      <td class="rounded-l-xl py-3.5 pl-4 font-semibold text-[#111827] align-top whitespace-nowrap">
        <div class="flex items-center gap-2.5">
          ${getNetworkBadge(row.network_name, row.network_code)}
          <span class="font-bold text-[#111827] text-xs sm:text-sm">${row.network_name}</span>
        </div>
      </td>
      <td class="py-3.5 pr-3 align-top">
        ${renderPricingDirection(row.payin, row.network_name, 'payin')}
      </td>
      <td class="rounded-r-xl py-3.5 pr-4 align-top">
        ${renderPricingDirection(row.payout, row.network_name, 'payout')}
      </td>
    </tr>
  `;
}

function renderPricingDirection(dir, networkName, type) {
  if (!dir || dir.available === false) {
    return `<span class="text-xs font-medium text-[#9CA3AF] italic">Indisponible actuellement</span>`;
  }

  if (!dir.tiers || dir.tiers.length === 0) {
    return `<span class="text-xs font-medium text-[#9CA3AF] italic">Non configuré</span>`;
  }

  const customPill = dir.is_custom ? `
    <span class="mb-1 inline-block rounded-full bg-violet-600/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
      Tarif personnalisé
    </span>
  ` : '';

  const tiersHtml = dir.tiers.map(t => {
    const feeStr = formatPricingFee(t);
    const modeStr = t.fee_charge_mode === 'DEDUCTED' ? 'déduits' : (t.fee_charge_mode === 'ADD_ON' ? 'ajoutés' : '');

    let limitsStr = '';
    if (t.floor_amount || t.cap_amount) {
      const parts = [];
      if (t.floor_amount) parts.push(`min ${formatCurrencyAmount(t.floor_amount, t.currency)}`);
      if (t.cap_amount) parts.push(`max ${formatCurrencyAmount(t.cap_amount, t.currency)}`);
      limitsStr = `<div class="text-[10px] text-[#9CA3AF] mt-0.5 font-medium">${parts.join(' · ')}</div>`;
    }

    return `
      <div class="space-y-0.5">
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <span class="font-bold text-[#111827] text-xs sm:text-sm font-mono">${feeStr}</span>
          ${modeStr ? `<span class="text-[11px] text-[#6B7280]">(${modeStr})</span>` : ''}
        </div>
        ${limitsStr}
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
  return 'Gratuit';
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
      btn.className = 'settings-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all bg-[#5846F6] text-white shadow-[0_8px_18px_-8px_rgba(88,70,246,0.6)]';
    } else {
      btn.className = 'settings-subtab-btn flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-[#6B7280] hover:bg-violet-50 hover:text-[#111827]';
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
      if (docNumber) docNumber.textContent = s.kyc.document_number || 'SN-DK-2024-B-98421';
      if (mgrName) mgrName.textContent = s.kyc.manager_name || 'Jeff Diallo';
      if (vDate) vDate.textContent = s.kyc.verified_date || '15 janv. 2026';
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
      OWNER: 'bg-purple-100 text-[#5846F6]',
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
          <div class="w-7 h-7 rounded-full bg-violet-100 text-[#5846F6] font-bold text-xs flex items-center justify-center">
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
