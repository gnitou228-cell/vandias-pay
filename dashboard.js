/**
 * ========================================================
 * VANDIAS PAY — DASHBOARD INTERACTIVE ENGINE & SUPABASE AUTH
 * Version: 2.5 (100% Dynamique & Connecté API)
 * ========================================================
 */

// État de l'application Dashboard
const VPState = {
  token: localStorage.getItem('vandias_token') || null,
  merchant: null,
  apiKeys: [],
  transactions: [],
  paymentLinks: [],
  wallets: [
    { code: "USD", name: "Dollar Américain", balance: 0, flag: "🇺🇸", symbol: "$" },
    { code: "XOF", name: "Franc CFA UEMOA (Sénégal, CI, Bénin...)", balance: 0, flag: "🇸🇳", symbol: "F" },
    { code: "CDF", name: "Franc Congolais (RDC)", balance: 0, flag: "🇨🇩", symbol: "FC" },
    { code: "ZMW", name: "Kwacha Zambien (Zambie)", balance: 0, flag: "🇿🇲", symbol: "ZK" },
    { code: "UGX", name: "Shilling Ougandais (Ouganda)", balance: 0, flag: "🇺🇬", symbol: "USh" },
    { code: "TZS", name: "Shilling Tanzanien (Tanzanie)", balance: 0, flag: "🇹🇿", symbol: "TSh" },
    { code: "RWF", name: "Franc Rwandais (Rwanda)", balance: 0, flag: "🇷🇼", symbol: "RF" },
    { code: "NGN", name: "Naira Nigérian (Nigéria)", balance: 0, flag: "🇳🇬", symbol: "₦" },
    { code: "MZN", name: "Metical Mozambicain (Mozambique)", balance: 0, flag: "🇲🇿", symbol: "MT" },
    { code: "XAF", name: "Franc CFA CEMAC (Cameroun, Gabon, Congo...)", balance: 0, flag: "🇨🇲", symbol: "F" },
    { code: "KES", name: "Shilling Kenyan (Kenya)", balance: 0, flag: "🇰🇪", symbol: "KSh" },
    { code: "GHS", name: "Cedi Ghanéen (Ghana)", balance: 0, flag: "🇬🇭", symbol: "GH₵" },
    { code: "GNF", name: "Franc Guinéen (Guinée Conakry)", balance: 0, flag: "🇬🇳", symbol: "FG" },
    { code: "ZAR", name: "Rand Sud-Africain (Afrique du Sud)", balance: 0, flag: "🇿🇦", symbol: "R" },
    { code: "EUR", name: "Euro (Europe & Diaspora)", balance: 0, flag: "🇪🇺", symbol: "€" },
    { code: "GBP", name: "Livre Sterling (Royaume-Uni)", balance: 0, flag: "🇬🇧", symbol: "£" },
    { code: "BWP", name: "Pula Botswanais (Botswana)", balance: 0, flag: "🇧🇼", symbol: "P" },
    { code: "ETB", name: "Birr Éthiopien (Éthiopie)", balance: 0, flag: "🇪🇹", symbol: "Br" },
    { code: "MAD", name: "Dirham Marocain (Maroc)", balance: 0, flag: "🇲🇦", symbol: "DH" },
    { code: "EGP", name: "Livre Égyptienne (Égypte)", balance: 0, flag: "🇪🇬", symbol: "E£" },
    { code: "CAD", name: "Dollar Canadien (Canada)", balance: 0, flag: "🇨🇦", symbol: "C$" },
    { code: "AOA", name: "Kwanza Angolais (Angola)", balance: 0, flag: "🇦🇴", symbol: "Kz" },
    { code: "BIF", name: "Franc Burundais (Burundi)", balance: 0, flag: "🇧🇮", symbol: "FBu" },
    { code: "SLL", name: "Leone Sierra-Léonais", balance: 0, flag: "🇸🇱", symbol: "Le" },
    { code: "LRD", name: "Dollar Libérien", balance: 0, flag: "🇱🇷", symbol: "L$" }
  ],
  pricingRates: []
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

  // 5. Clés API dans l'onglet Développeur
  const liveKey = VPState.apiKeys.find(k => k.key_type === 'live') || VPState.apiKeys[0];
  const testKey = VPState.apiKeys.find(k => k.key_type === 'test') || VPState.apiKeys[1];

  const pubKeyInput = document.getElementById('devPublicKeyInput');
  const secKeyInput = document.getElementById('devSecretKeyInput');

  if (pubKeyInput && liveKey) pubKeyInput.value = liveKey.public_key;
  if (secKeyInput && liveKey) secKeyInput.value = liveKey.secret_key;

  // 6. Webhooks
  const webhookUrlInput = document.getElementById('webhookUrlInput');
  const webhookSecretInput = document.getElementById('webhookSecretInput');
  if (webhookUrlInput) webhookUrlInput.value = m.webhook_url || '';
  if (webhookSecretInput) webhookSecretInput.value = m.webhook_secret || 'whsec_sample';

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
   5. WALLETS MULTI-DEVISES
   ======================================================== */

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
        <button class="text-slate-500 font-medium hover:text-[#111827]" onclick="openModal('modalPayoutQuick')">Transférer</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ========================================================
   6. GESTION DES MODALS D'AUTHENTIFICATION & INSCRIPTION
   ======================================================== */

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

  // Soumission Formulaire Inscription Nouveau Marchand
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const business_name = document.getElementById('regBusinessName').value;
      const email = document.getElementById('regEmail').value;
      const phone = document.getElementById('regPhone').value;
      const password = document.getElementById('regPassword').value;
      const submitBtn = document.getElementById('btnSubmitRegister');

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
          showToast('Bienvenue sur VandiasPay !', `Compte ${data.merchant.business_name} créé avec succès (Solde: 0 FCFA).`);
          await loadMerchantDashboard();
        } else {
          showToast('Erreur', data.error || "Impossible de créer le compte.");
        }
      } catch (err) {
        showToast('Erreur', err.message);
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

  // Demande de retrait
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
          body: JSON.stringify({ amount: amt, channel: 'WAVE', recipient_phone: phone })
        });
        const data = await res.json();

        if (data.success) {
          if (VPState.merchant) VPState.merchant.balance_fcfa = data.new_balance;
          renderAllDashboardElements();
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
