/**
 * ========================================================
 * VANDIAS PAY — CONSOLE D'ADMINISTRATION SUPRÊME
 * Moteur JavaScript de Contrôle Global & Intégrations Directes
 * Version: 1.0 (Contrôle 100% Temps Réel & Synchronisation Marchands)
 * ========================================================
 */

// Base API configuration (auto-detects port and host)
const ADMIN_API_BASE = (window.location.protocol === 'file:')
  ? (window.__VANDIAS_API_URL || 'http://localhost:3000')
  : '';

// Global Admin State
const AdminState = {
  token: localStorage.getItem('vandias_admin_token') || null,
  user: null,
  activeTab: 'overview',
  merchants: [],
  transactions: [],
  links: [],
  payouts: [],
  auditLogs: [],
  settings: null,
  refreshTimer: null
};

/**
 * Custom Fetch Helper with Admin Bearer Token
 */
async function adminFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${ADMIN_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (AdminState.token) {
    headers['Authorization'] = `Bearer ${AdminState.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      console.warn('[Admin] Accès non autorisé ou session expirée');
      // If unauthorized, return to login only if we were logged in
      if (AdminState.token && !endpoint.includes('/login')) {
        adminLogout();
      }
    }
    return res;
  } catch (err) {
    console.error(`[Admin Fetch Error] ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Toast Notification System for Admin
 */
function showAdminToast(title, message, type = 'info') {
  const container = document.getElementById('adminToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 border-emerald-700 text-white',
    danger: 'bg-rose-600 border-rose-700 text-white',
    warning: 'bg-amber-500 border-amber-600 text-white',
    info: 'bg-[#0A2540] border-slate-700 text-white'
  };
  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.className = `flex items-start gap-3 p-4 rounded-2xl shadow-2xl border text-xs sm:text-sm max-w-sm pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span class="text-base font-extrabold shrink-0 mt-0.5">${icons[type] || 'ℹ️'}</span>
    <div class="flex-1">
      <div class="font-extrabold tracking-tight">${title}</div>
      <div class="text-[11px] opacity-90 mt-0.5">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" class="opacity-70 hover:opacity-100 text-xs font-bold shrink-0 ml-1">✕</button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/**
 * Modal Management Utilities
 */
function openAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
  });
}

function closeAdminModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 200);
}

/**
 * Format Helpers
 */
function formatFCFA(amount) {
  const val = Number(amount || 0);
  return `${val.toLocaleString('fr-FR')} FCFA`;
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ========================================================
// 1. INITIALISATION DE L'APPLICATION ADMINISTRATEUR
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
  initAdminNavigation();
  initAdminForms();

  // Check stored session
  if (AdminState.token) {
    try {
      const res = await adminFetch('/api/v1/admin/me');
      if (res.ok) {
        const data = await res.json();
        AdminState.user = data.admin;
        enterAdminDashboard();
        return;
      }
    } catch (err) {
      console.warn('[Admin] Validation token échouée:', err);
    }
  }

  // Not authenticated: show login
  showAdminLogin();
});

function showAdminLogin() {
  document.getElementById('adminLoginSection')?.classList.remove('hidden');
  document.getElementById('adminAppSection')?.classList.add('hidden');
}

function enterAdminDashboard() {
  document.getElementById('adminLoginSection')?.classList.add('hidden');
  document.getElementById('adminAppSection')?.classList.remove('hidden');

  // Update top profile display
  if (AdminState.user) {
    const nameEl = document.getElementById('topAdminName');
    const emailEl = document.getElementById('topAdminEmail');
    if (nameEl) nameEl.textContent = AdminState.user.full_name || 'Directeur Général';
    if (emailEl) emailEl.textContent = AdminState.user.email || 'admin@vandiaspay.com';
  }

  // Load default tab
  switchAdminTab(AdminState.activeTab || 'overview');

  // Background auto-refresh overview stats every 30 seconds
  if (AdminState.refreshTimer) clearInterval(AdminState.refreshTimer);
  AdminState.refreshTimer = setInterval(() => {
    if (AdminState.activeTab === 'overview') {
      loadAdminOverview(false);
    }
  }, 30000);
}

/**
 * Helper to autofill default credentials
 */
window.fillAdminDefaultCredentials = function () {
  const emailInput = document.getElementById('adminLoginEmail');
  const passInput = document.getElementById('adminLoginPassword');
  if (emailInput) emailInput.value = 'admin@vandiaspay.com';
  if (passInput) passInput.value = 'admin2026!';
  showAdminToast('Identifiants pré-remplis', 'Email: admin@vandiaspay.com / MdP: admin2026!', 'info');
};

/**
 * Admin Logout
 */
window.adminLogout = function () {
  localStorage.removeItem('vandias_admin_token');
  localStorage.removeItem('vandias_admin_user');
  AdminState.token = null;
  AdminState.user = null;
  if (AdminState.refreshTimer) clearInterval(AdminState.refreshTimer);
  showAdminToast('Déconnexion', 'Vous avez été déconnecté de la console administrateur.', 'info');
  showAdminLogin();
};

// ========================================================
// 2. NAVIGATION ET ONGLETS DU DASHBOARD ADMIN
// ========================================================

function initAdminNavigation() {
  const navButtons = document.querySelectorAll('#adminSidebarNav .nav-admin-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchAdminTab(tab);
    });
  });
}

window.switchAdminTab = function (tabKey) {
  AdminState.activeTab = tabKey;

  // Update sidebar active classes
  const navButtons = document.querySelectorAll('#adminSidebarNav .nav-admin-item');
  navButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle sections
  const sections = document.querySelectorAll('.admin-tab-section');
  sections.forEach(sec => sec.classList.add('hidden'));

  const activeSec = document.getElementById(`admin-sec-${tabKey}`);
  if (activeSec) {
    activeSec.classList.remove('hidden');
  }

  // Fetch section data
  switch (tabKey) {
    case 'overview':
      loadAdminOverview();
      break;
    case 'merchants':
      loadAdminMerchants();
      break;
    case 'transactions':
      loadAdminTransactions();
      break;
    case 'links':
      loadAdminLinks();
      break;
    case 'payouts':
      loadAdminPayouts();
      break;
    case 'settings':
      loadAdminSettings();
      break;
    case 'audit':
      loadAdminAuditLogs();
      break;
  }
};

window.refreshCurrentAdminTab = function () {
  switchAdminTab(AdminState.activeTab || 'overview');
  showAdminToast('Données actualisées', 'Synchronisation en temps réel avec le serveur.', 'info');
};

// ========================================================
// 3. VUE D'ENSEMBLE (OVERVIEW) & KPIS
// ========================================================

async function loadAdminOverview(showToastFeedback = false) {
  try {
    const res = await adminFetch('/api/v1/admin/overview');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();

    // 1. KPIs
    const elTotalVolume = document.getElementById('kpiTotalVolume');
    const elTodayVolume = document.getElementById('kpiTodayVolume');
    const elTotalFees = document.getElementById('kpiTotalFees');
    const elTotalMerchants = document.getElementById('kpiTotalMerchants');
    const elActiveMerchants = document.getElementById('kpiActiveMerchants');
    const elSuspendedMerchants = document.getElementById('kpiSuspendedMerchants');
    const elPendingPayoutsAmount = document.getElementById('kpiPendingPayoutsAmount');
    const elPendingPayoutsCount = document.getElementById('kpiPendingPayoutsCount');

    if (elTotalVolume) elTotalVolume.textContent = formatFCFA(data.total_volume_fcfa);
    if (elTodayVolume) elTodayVolume.textContent = formatFCFA(data.today_volume_fcfa || 0);
    if (elTotalFees) elTotalFees.textContent = formatFCFA(data.total_fees_collected_fcfa);
    if (elTotalMerchants) elTotalMerchants.textContent = data.merchants_count || 0;
    if (elActiveMerchants) elActiveMerchants.textContent = `${data.active_merchants_count || 0} actifs`;
    if (elSuspendedMerchants) elSuspendedMerchants.textContent = `${data.suspended_merchants_count || 0} suspendus`;
    if (elPendingPayoutsAmount) elPendingPayoutsAmount.textContent = formatFCFA(data.pending_payouts_amount_fcfa);
    if (elPendingPayoutsCount) elPendingPayoutsCount.textContent = data.pending_payouts_count || 0;

    // Badges Sidebar
    const bMerchants = document.getElementById('badgeMerchantsCount');
    const bTx = document.getElementById('badgeTransactionsCount');
    const bPayouts = document.getElementById('badgePayoutsPending');
    if (bMerchants) bMerchants.textContent = data.merchants_count || 0;
    if (bTx) bTx.textContent = data.transactions_count || 0;
    if (bPayouts) bPayouts.textContent = data.pending_payouts_count || 0;

    // Maintenance Badge in Header
    const maintBadge = document.getElementById('adminMaintenanceStatusBadge');
    if (maintBadge) {
      if (data.system_status && data.system_status.maintenance_mode) {
        maintBadge.classList.remove('hidden');
      } else {
        maintBadge.classList.add('hidden');
      }
    }

    // 2. Recent Transactions Table
    renderOverviewRecentTransactions(data.recent_transactions || []);

    // 3. Methods Breakdown List
    renderOverviewMethods(data.payment_methods_stats || {});

    if (showToastFeedback) {
      showAdminToast('Succès', 'Tableau de bord actualisé.', 'success');
    }
  } catch (err) {
    console.error('[loadAdminOverview]', err);
    showAdminToast('Erreur', 'Impossible de charger la vue d\'ensemble.', 'danger');
  }
}

function renderOverviewRecentTransactions(transactions) {
  const tbody = document.getElementById('overviewRecentTxTableBody');
  if (!tbody) return;

  if (!transactions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-6 text-center text-slate-400">
          Aucune transaction récente enregistrée.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(tx => {
    const isSuccess = tx.status === 'SUCCESS' || tx.status === 'COMPLETED';
    const isPending = tx.status === 'PENDING';
    const statusBadge = isSuccess
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Succès</span>`
      : isPending
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">En attente</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">Échoué</span>`;

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900">${tx.merchant_business || tx.merchant_name || 'Marchand'}</div>
          <div class="text-[10px] text-slate-400 font-mono">${tx.id ? tx.id.slice(0, 10) : '-'}...</div>
        </td>
        <td class="py-3 px-3 font-bold font-mono text-slate-900">
          ${formatFCFA(tx.amount || tx.gross_amount)}
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            ${tx.payment_method || tx.provider || 'SasPay'}
          </span>
        </td>
        <td class="py-3 px-3">
          ${statusBadge}
        </td>
        <td class="py-3 px-3 text-slate-400 text-[11px]">
          ${formatDate(tx.created_at)}
        </td>
      </tr>
    `;
  }).join('');
}

function renderOverviewMethods(stats) {
  const container = document.getElementById('overviewMethodsList');
  if (!container) return;

  const defaultMethods = [
    { key: 'WAVE', name: 'Wave Mobile Money', icon: '🌊', color: 'bg-cyan-500' },
    { key: 'ORANGE', name: 'Orange Money', icon: '🍊', color: 'bg-orange-500' },
    { key: 'MTN', name: 'MTN Mobile Money', icon: '🟡', color: 'bg-yellow-500' },
    { key: 'MOOV', name: 'Moov Money', icon: '🔵', color: 'bg-blue-500' },
    { key: 'CARD', name: 'Cartes Visa / MasterCard', icon: '💳', color: 'bg-indigo-500' },
    { key: 'CRYPTO', name: 'Crypto USDT (TRC-20)', icon: '💎', color: 'bg-emerald-500' }
  ];

  container.innerHTML = defaultMethods.map(m => {
    const data = stats[m.key] || { count: 0, volume: 0, active: true };
    return `
      <div class="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8F9FD] border border-[#ECEEF6]">
        <div class="flex items-center gap-2.5">
          <span class="text-base">${m.icon}</span>
          <div>
            <div class="text-xs font-bold text-slate-900">${m.name}</div>
            <div class="text-[10px] text-slate-400 font-mono">${data.count || 0} txn • ${formatFCFA(data.volume || 0)}</div>
          </div>
        </div>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${data.active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
          ${data.active !== false ? 'En service' : 'Coupé'}
        </span>
      </div>
    `;
  }).join('');
}

// ========================================================
// 4. GESTION DES MARCHANDS (UTILISATEURS) & CONTRÔLE DIRECT
// ========================================================

async function loadAdminMerchants() {
  try {
    const res = await adminFetch('/api/v1/admin/merchants');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    AdminState.merchants = data.merchants || [];

    const badge = document.getElementById('merchantsListCountBadge');
    if (badge) badge.textContent = `${AdminState.merchants.length} Marchand(s)`;

    filterMerchantsList();
  } catch (err) {
    console.error('[loadAdminMerchants]', err);
    showAdminToast('Erreur', 'Impossible de charger la liste des marchands.', 'danger');
  }
}

window.filterMerchantsList = function () {
  const query = (document.getElementById('filterMerchantQuery')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('filterMerchantStatus')?.value || '';
  const kycFilter = document.getElementById('filterMerchantKyc')?.value || '';

  const filtered = AdminState.merchants.filter(m => {
    const nameMatch = !query ||
      (m.business_name && m.business_name.toLowerCase().includes(query)) ||
      (m.full_name && m.full_name.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query)) ||
      (m.phone && m.phone.toLowerCase().includes(query)) ||
      (m.id && m.id.toLowerCase().includes(query));

    const statusMatch = !statusFilter || (m.status || 'ACTIVE') === statusFilter;
    const kycMatch = !kycFilter || (m.kyc_status || 'PENDING') === kycFilter;

    return nameMatch && statusMatch && kycMatch;
  });

  renderMerchantsTable(filtered);
};

function renderMerchantsTable(merchants) {
  const tbody = document.getElementById('merchantsTableBody');
  if (!tbody) return;

  if (!merchants.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-10 text-center text-slate-400">
          Aucun compte marchand trouvé avec les critères actuels.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = merchants.map(m => {
    const isSuspended = m.status === 'SUSPENDED';
    const statusBadge = isSuspended
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200" title="${m.suspend_reason || 'Compte bloqué'}">⛔ Suspendu</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200">✓ Actif</span>`;

    const kycStatus = m.kyc_status || 'PENDING';
    const kycBadge = kycStatus === 'VERIFIED'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Vérifié ✓</span>`
      : kycStatus === 'REJECTED'
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">Rejeté ✕</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">En attente ⏳</span>`;

    const customFeeText = m.custom_fee_percent != null
      ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">${m.custom_fee_percent}% (Sur-mesure)</span>`
      : `<span class="text-[11px] text-slate-400 font-mono">2.5% (Défaut)</span>`;

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <!-- Entreprise / Nom -->
        <td class="py-3.5 px-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-[#0A2540] text-white flex items-center justify-center text-xs font-bold shrink-0">
              ${(m.business_name || m.full_name || 'M').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-extrabold text-slate-900">${m.business_name || m.full_name || 'Sans Nom'}</div>
              <div class="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>ID: ${m.id ? m.id.slice(0, 8) : '-'}</span>
                <span>•</span>
                <span>${m.country_code || 'Afrique'}</span>
              </div>
            </div>
          </div>
        </td>

        <!-- Contact -->
        <td class="py-3.5 px-3">
          <div class="text-xs font-semibold text-slate-800">${m.email || '-'}</div>
          <div class="text-[11px] text-slate-400 font-mono">${m.phone || 'Non renseigné'}</div>
        </td>

        <!-- Solde Disponible -->
        <td class="py-3.5 px-3">
          <div class="font-extrabold font-mono text-sm ${Number(m.balance_fcfa || 0) < 0 ? 'text-rose-600' : 'text-slate-900'}">
            ${formatFCFA(m.balance_fcfa)}
          </div>
          <div class="text-[10px] text-slate-400">Total encaissé : ${formatFCFA(m.total_received_fcfa || 0)}</div>
        </td>

        <!-- Statut de Compte -->
        <td class="py-3.5 px-3">
          ${statusBadge}
        </td>

        <!-- Statut KYC -->
        <td class="py-3.5 px-3">
          ${kycBadge}
        </td>

        <!-- Commission -->
        <td class="py-3.5 px-3">
          ${customFeeText}
        </td>

        <!-- Actions de Contrôle Administrateur -->
        <td class="py-3.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5 flex-wrap">
            <!-- 1. Ajuster Solde -->
            <button onclick="openEditBalanceModal('${m.id}')" class="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-[#0052FF] transition-all" title="Ajuster le solde (Crédit / Débit)">
              <span class="text-xs font-bold">💰 Solde</span>
            </button>

            <!-- 2. Statut KYC -->
            <button onclick="openKycModal('${m.id}')" class="p-1.5 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-all" title="Examiner / Valider le KYC">
              <span class="text-xs font-bold">🛡️ KYC</span>
            </button>

            <!-- 3. Commission Custom -->
            <button onclick="openCustomFeeModal('${m.id}')" class="p-1.5 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-all" title="Définir un taux de commission sur-mesure">
              <span class="text-xs font-bold">🏷️ Frais</span>
            </button>

            <!-- 4. Suspendre / Réactiver -->
            <button onclick="openSuspendModal('${m.id}', '${m.status || 'ACTIVE'}')" class="p-1.5 rounded-lg border ${isSuspended ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-700'} transition-all" title="${isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}">
              <span class="text-xs font-bold">${isSuspended ? '✓ Activer' : '⛔ Suspendre'}</span>
            </button>

            <!-- 5. Impersonate (Connexion directe au compte marchand) -->
            <button onclick="impersonateMerchant('${m.id}')" class="p-1.5 rounded-lg bg-[#0A2540] hover:bg-slate-800 text-white transition-all shadow-xs" title="Se connecter en tant que ce marchand">
              <span class="text-xs font-bold">⚡ Accès</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --------------------------------------------------------
// MODAL 1 : AJUSTEMENT DE SOLDE MARCHAND (CRÉDIT / DÉBIT)
// --------------------------------------------------------
window.openEditBalanceModal = function (merchantId) {
  const merchant = AdminState.merchants.find(m => m.id === merchantId);
  if (!merchant) return;

  const idInput = document.getElementById('balanceMerchantId');
  const nameLabel = document.getElementById('modalBalanceMerchantName');
  const amountInput = document.getElementById('balanceAmountInput');
  const reasonInput = document.getElementById('balanceReasonInput');

  if (idInput) idInput.value = merchant.id;
  if (nameLabel) nameLabel.textContent = `${merchant.business_name || merchant.full_name} (Solde actuel : ${formatFCFA(merchant.balance_fcfa)})`;
  if (amountInput) amountInput.value = '';
  if (reasonInput) reasonInput.value = '';

  openAdminModal('modalEditBalance');
};

async function handleBalanceSubmit(e) {
  e.preventDefault();
  const merchantId = document.getElementById('balanceMerchantId')?.value;
  const amount = Number(document.getElementById('balanceAmountInput')?.value || 0);
  const reason = document.getElementById('balanceReasonInput')?.value?.trim();
  const type = document.querySelector('input[name="balanceType"]:checked')?.value || 'CREDIT';

  if (!merchantId || !amount || amount <= 0 || !reason) {
    showAdminToast('Erreur', 'Veuillez renseigner un montant valide et un motif obligatoire.', 'warning');
    return;
  }

  const btn = document.getElementById('btnSubmitBalance');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Enregistrement...';
  }

  try {
    const res = await adminFetch(`/api/v1/admin/merchants/${merchantId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ type, amount, reason })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('Solde Modifié avec Succès', `Le solde a été mis à jour : ${formatFCFA(data.new_balance)}. Impact immédiat sur l'espace marchand.`, 'success');
      closeAdminModal('modalEditBalance');
      loadAdminMerchants();
      loadAdminOverview(false);
    } else {
      showAdminToast('Échec de l\'opération', data.error || 'Erreur lors de l\'ajustement du solde.', 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur Réseau', err.message, 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Appliquer l\'ajustement';
    }
  }
}

// --------------------------------------------------------
// MODAL 2 : SUSPENDRE / RÉACTIVER UN MARCHAND
// --------------------------------------------------------
window.openSuspendModal = function (merchantId, currentStatus) {
  const merchant = AdminState.merchants.find(m => m.id === merchantId);
  if (!merchant) return;

  const idInput = document.getElementById('suspendMerchantId');
  const targetInput = document.getElementById('suspendTargetStatus');
  const title = document.getElementById('modalSuspendTitle');
  const nameLabel = document.getElementById('modalSuspendMerchantName');
  const reasonWrapper = document.getElementById('suspendReasonWrapper');
  const reasonInput = document.getElementById('suspendReasonInput');
  const btn = document.getElementById('btnSubmitSuspend');

  const willSuspend = currentStatus !== 'SUSPENDED';

  if (idInput) idInput.value = merchant.id;
  if (targetInput) targetInput.value = willSuspend ? 'SUSPENDED' : 'ACTIVE';
  if (nameLabel) nameLabel.textContent = `${merchant.business_name || merchant.full_name} (${merchant.email})`;

  if (willSuspend) {
    if (title) title.textContent = 'Suspendre ce Compte Marchand';
    if (btn) {
      btn.textContent = 'Confirmer la Suspension';
      btn.className = 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/25';
    }
    if (reasonWrapper) reasonWrapper.classList.remove('hidden');
    if (reasonInput) reasonInput.value = 'Activité inhabituelle ou non-conformité constatée par l\'administration.';
  } else {
    if (title) title.textContent = 'Réactiver ce Compte Marchand';
    if (btn) {
      btn.textContent = 'Réactiver Immédiatement';
      btn.className = 'px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/25';
    }
    if (reasonWrapper) reasonWrapper.classList.add('hidden');
    if (reasonInput) reasonInput.value = 'Compte réactivé par l\'administration';
  }

  openAdminModal('modalSuspendMerchant');
};

async function handleSuspendSubmit(e) {
  e.preventDefault();
  const merchantId = document.getElementById('suspendMerchantId')?.value;
  const status = document.getElementById('suspendTargetStatus')?.value;
  const reason = document.getElementById('suspendReasonInput')?.value?.trim();

  try {
    const res = await adminFetch(`/api/v1/admin/merchants/${merchantId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('Statut Mis à Jour', `Le marchand est désormais ${status === 'SUSPENDED' ? 'SUSPENDU ⛔' : 'ACTIF ✓'}.`, 'success');
      closeAdminModal('modalSuspendMerchant');
      loadAdminMerchants();
      loadAdminOverview(false);
    } else {
      showAdminToast('Erreur', data.error || 'Impossible de modifier le statut.', 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
}

// --------------------------------------------------------
// MODAL 3 : DÉCISION KYC
// --------------------------------------------------------
window.openKycModal = function (merchantId) {
  const merchant = AdminState.merchants.find(m => m.id === merchantId);
  if (!merchant) return;

  const idInput = document.getElementById('kycMerchantId');
  const nameLabel = document.getElementById('modalKycMerchantName');
  const fullName = document.getElementById('kycFullName');
  const bName = document.getElementById('kycBusinessName');
  const country = document.getElementById('kycCountry');
  const currentSt = document.getElementById('kycCurrentStatus');
  const noteInput = document.getElementById('kycNoteInput');

  if (idInput) idInput.value = merchant.id;
  if (nameLabel) nameLabel.textContent = `${merchant.business_name || merchant.full_name} (${merchant.email})`;
  if (fullName) fullName.textContent = merchant.full_name || 'Non renseigné';
  if (bName) bName.textContent = merchant.business_name || 'Non renseigné';
  if (country) country.textContent = merchant.country_code || 'Afrique';
  if (currentSt) currentSt.textContent = merchant.kyc_status || 'PENDING';
  if (noteInput) noteInput.value = merchant.kyc_notes || '';

  openAdminModal('modalKycReview');
};

window.submitKycDecision = async function (status) {
  const merchantId = document.getElementById('kycMerchantId')?.value;
  const notes = document.getElementById('kycNoteInput')?.value?.trim();

  try {
    const res = await adminFetch(`/api/v1/admin/merchants/${merchantId}/kyc`, {
      method: 'POST',
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('KYC Mis à Jour', `Le dossier KYC est passé au statut : ${status}.`, 'success');
      closeAdminModal('modalKycReview');
      loadAdminMerchants();
    } else {
      showAdminToast('Erreur', data.error || 'Erreur KYC', 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
};

// --------------------------------------------------------
// MODAL 4 : COMMISSION SUR-MESURE
// --------------------------------------------------------
window.openCustomFeeModal = function (merchantId) {
  const merchant = AdminState.merchants.find(m => m.id === merchantId);
  if (!merchant) return;

  const idInput = document.getElementById('customFeeMerchantId');
  const nameLabel = document.getElementById('modalFeeMerchantName');
  const feeInput = document.getElementById('customFeeInput');

  if (idInput) idInput.value = merchant.id;
  if (nameLabel) nameLabel.textContent = `${merchant.business_name || merchant.full_name}`;
  if (feeInput) feeInput.value = merchant.custom_fee_percent != null ? merchant.custom_fee_percent : '';

  openAdminModal('modalCustomFee');
};

async function handleCustomFeeSubmit(e) {
  e.preventDefault();
  const merchantId = document.getElementById('customFeeMerchantId')?.value;
  const rawFee = document.getElementById('customFeeInput')?.value;
  const fee_percent = rawFee === '' ? null : Number(rawFee);

  try {
    const res = await adminFetch(`/api/v1/admin/merchants/${merchantId}/custom-fee`, {
      method: 'POST',
      body: JSON.stringify({ fee_percent })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('Commission Mise à Jour', `Nouvelle commission : ${data.fee_percent != null ? data.fee_percent + '%' : 'Taux standard'}.`, 'success');
      closeAdminModal('modalCustomFee');
      loadAdminMerchants();
    } else {
      showAdminToast('Erreur', data.error, 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
}

// --------------------------------------------------------
// 5. IMPERSONATION DIRECTE (1-CLIC CONNEXION AU DASHBOARD MARCHAND)
// --------------------------------------------------------
window.impersonateMerchant = async function (merchantId) {
  try {
    const res = await adminFetch(`/api/v1/admin/merchants/${merchantId}/impersonate`, {
      method: 'POST'
    });
    const data = await res.json();

    if (data.success && data.token) {
      showAdminToast('Session Marchand Générée', `Ouverture de l'espace pour ${data.merchant.business_name || data.merchant.email}...`, 'info');
      // Ouvrir le dashboard marchand avec le jeton d'impersonation dans un nouvel onglet
      window.open(`/dashboard.html?impersonate_token=${encodeURIComponent(data.token)}`, '_blank');
    } else {
      showAdminToast('Erreur', data.error || 'Impossible d\'usurper l\'identité du marchand.', 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
};

// ========================================================
// 6. GESTION DES TRANSACTIONS GLOBALES
// ========================================================

async function loadAdminTransactions() {
  try {
    const res = await adminFetch('/api/v1/admin/transactions');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    AdminState.transactions = data.transactions || [];

    filterTransactionsList();
  } catch (err) {
    console.error('[loadAdminTransactions]', err);
    showAdminToast('Erreur', 'Impossible de charger les transactions.', 'danger');
  }
}

window.filterTransactionsList = function () {
  const query = (document.getElementById('filterTxQuery')?.value || '').toLowerCase().trim();
  const statusFilter = document.getElementById('filterTxStatus')?.value || '';
  const methodFilter = document.getElementById('filterTxMethod')?.value || '';

  const filtered = AdminState.transactions.filter(tx => {
    const qMatch = !query ||
      (tx.id && tx.id.toLowerCase().includes(query)) ||
      (tx.operator_reference && tx.operator_reference.toLowerCase().includes(query)) ||
      (tx.customer_name && tx.customer_name.toLowerCase().includes(query)) ||
      (tx.customer_email && tx.customer_email.toLowerCase().includes(query)) ||
      (tx.customer_phone && tx.customer_phone.toLowerCase().includes(query)) ||
      (tx.merchant_business && tx.merchant_business.toLowerCase().includes(query));

    const sMatch = !statusFilter || tx.status === statusFilter;
    const mMatch = !methodFilter || (tx.payment_method || tx.provider) === methodFilter;

    return qMatch && sMatch && mMatch;
  });

  renderTransactionsTable(filtered);
};

function renderTransactionsTable(transactions) {
  const tbody = document.getElementById('adminTransactionsTableBody');
  if (!tbody) return;

  if (!transactions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="py-10 text-center text-slate-400">
          Aucune transaction ne correspond aux critères.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(tx => {
    const isSuccess = tx.status === 'SUCCESS' || tx.status === 'COMPLETED';
    const isPending = tx.status === 'PENDING';
    const statusBadge = isSuccess
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Succès ✓</span>`
      : isPending
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">En attente ⏳</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">Échoué ✕</span>`;

    const gross = Number(tx.gross_amount || tx.amount || 0);
    const fee = Number(tx.fee_amount || Math.round(gross * 0.025));
    const net = Number(tx.net_amount || (gross - fee));

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900 font-mono text-xs">${tx.id ? tx.id.slice(0, 10) : '-'}...</div>
          <div class="text-[10px] text-slate-400 font-mono">${tx.operator_reference || 'SasPay-Pending'}</div>
          <div class="text-[9px] text-slate-400">${formatDate(tx.created_at)}</div>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-slate-800">${tx.merchant_business || tx.merchant_name || 'Marchand'}</div>
          <div class="text-[10px] text-slate-400 font-mono">${tx.merchant_id ? tx.merchant_id.slice(0, 8) : ''}</div>
        </td>
        <td class="py-3 px-3">
          <div class="font-semibold text-slate-800">${tx.customer_name || 'Client'}</div>
          <div class="text-[10px] text-slate-400 font-mono">${tx.customer_phone || tx.customer_email || '-'}</div>
        </td>
        <td class="py-3 px-3 font-bold font-mono text-slate-900">
          ${formatFCFA(gross)}
        </td>
        <td class="py-3 px-3 font-semibold font-mono text-emerald-600 text-xs">
          +${formatFCFA(fee)}
        </td>
        <td class="py-3 px-3 font-bold font-mono text-slate-900 text-xs">
          ${formatFCFA(net)}
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            ${tx.payment_method || tx.provider || 'SasPay'}
          </span>
        </td>
        <td class="py-3 px-3">
          ${statusBadge}
        </td>
        <td class="py-3 px-3 text-right">
          ${isPending ? `
            <button onclick="openForceValidateModal('${tx.id}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-all">
              ⚡ Valider & Créditer
            </button>
          ` : `
            <span class="text-[10px] text-slate-400 font-mono">Traité</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// --------------------------------------------------------
// MODAL 5 : FORCER LA VALIDATION D'UNE TRANSACTION
// --------------------------------------------------------
window.openForceValidateModal = function (txId) {
  const idInput = document.getElementById('forceValidateTxId');
  const titleLabel = document.getElementById('modalForceTxId');
  const opRef = document.getElementById('forceOpRefInput');
  const note = document.getElementById('forceNoteInput');

  if (idInput) idInput.value = txId;
  if (titleLabel) titleLabel.textContent = `ID Transaction: ${txId}`;
  if (opRef) opRef.value = `ADMIN-FORCE-${Date.now().toString().slice(-6)}`;
  if (note) note.value = 'Validation manuelle effectuée depuis la console suprême';

  openAdminModal('modalForceValidate');
};

async function handleForceValidateSubmit(e) {
  e.preventDefault();
  const txId = document.getElementById('forceValidateTxId')?.value;
  const operator_reference = document.getElementById('forceOpRefInput')?.value?.trim();
  const note = document.getElementById('forceNoteInput')?.value?.trim();

  try {
    const res = await adminFetch(`/api/v1/admin/transactions/${txId}/validate`, {
      method: 'POST',
      body: JSON.stringify({ operator_reference, note })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('Transaction Validée !', 'Le statut est passé à SUCCÈS et le marchand a été crédité.', 'success');
      closeAdminModal('modalForceValidate');
      loadAdminTransactions();
      loadAdminOverview(false);
    } else {
      showAdminToast('Erreur', data.error || 'Impossible de forcer la transaction.', 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
}

// ========================================================
// 7. GESTION DES LIENS DE PAIEMENT
// ========================================================

async function loadAdminLinks() {
  try {
    const res = await adminFetch('/api/v1/admin/links');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    AdminState.links = data.links || [];

    renderLinksTable(AdminState.links);
  } catch (err) {
    console.error('[loadAdminLinks]', err);
    showAdminToast('Erreur', 'Impossible de charger les liens de paiement.', 'danger');
  }
}

function renderLinksTable(links) {
  const tbody = document.getElementById('adminLinksTableBody');
  if (!tbody) return;

  if (!links.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-10 text-center text-slate-400">
          Aucun lien de paiement créé sur la plateforme pour l'instant.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = links.map(l => {
    const isOverridden = l.admin_override != null;
    const isLive = isOverridden ? l.admin_override.active : (l.is_active !== false);

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-3">
          <div class="font-extrabold text-slate-900">${l.title || 'Lien de paiement'}</div>
          <div class="text-[10px] text-slate-400 font-mono">
            <a href="/pay.html?id=${l.id}" target="_blank" class="hover:underline text-[#0052FF]">
              /pay.html?id=${l.id.slice(0, 10)}... ↗
            </a>
          </div>
        </td>
        <td class="py-3 px-3">
          <div class="font-semibold text-slate-800">${l.merchant_business || l.merchant_name || 'Marchand'}</div>
          <div class="text-[10px] text-slate-400 font-mono">${l.merchant_email || ''}</div>
        </td>
        <td class="py-3 px-3 font-bold font-mono text-slate-900">
          ${formatFCFA(l.amount)}
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            ${l.successful_payments_count || 0} vente(s)
          </span>
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
            ${isLive ? 'Actif ✓' : 'Bloqué / Suspendu ⛔'}
          </span>
          ${isOverridden ? `<span class="block text-[9px] text-purple-600 font-bold mt-0.5">Override Admin</span>` : ''}
        </td>
        <td class="py-3 px-3 text-right">
          <button onclick="toggleAdminLink('${l.id}', ${!isLive})" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isLive ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'}">
            ${isLive ? '⛔ Bloquer le lien' : '✓ Autoriser le lien'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleAdminLink = async function (linkId, targetActive) {
  try {
    const res = await adminFetch(`/api/v1/admin/links/${linkId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ active: targetActive })
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('Lien Mis à Jour', `Le lien est désormais ${targetActive ? 'ACTIVÉ ✓' : 'BLOQUÉ ⛔'}.`, 'success');
      loadAdminLinks();
    } else {
      showAdminToast('Erreur', data.error, 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
};

// ========================================================
// 8. GESTION DES RETRAITS & DÉCAISSEMENTS (PAYOUTS)
// ========================================================

async function loadAdminPayouts() {
  try {
    const res = await adminFetch('/api/v1/admin/payouts');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    AdminState.payouts = data.payouts || [];

    renderPayoutsTable(AdminState.payouts);
  } catch (err) {
    console.error('[loadAdminPayouts]', err);
    showAdminToast('Erreur', 'Impossible de charger les demandes de retrait.', 'danger');
  }
}

function renderPayoutsTable(payouts) {
  const tbody = document.getElementById('adminPayoutsTableBody');
  if (!tbody) return;

  if (!payouts.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-10 text-center text-slate-400">
          Aucune demande de retrait pour le moment.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = payouts.map(p => {
    const isPending = p.status === 'PENDING';
    const isApproved = p.status === 'APPROVED' || p.status === 'COMPLETED';
    const statusBadge = isApproved
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Approuvé ✓</span>`
      : isPending
      ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">En attente ⏳</span>`
      : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">Rejeté ✕</span>`;

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-3">
          <div class="font-bold text-slate-900 font-mono text-xs">${p.id ? p.id.slice(0, 10) : '-'}...</div>
          <div class="text-[10px] text-slate-400">${formatDate(p.created_at)}</div>
        </td>
        <td class="py-3 px-3">
          <div class="font-semibold text-slate-800">${p.merchant_business || p.merchant_name || 'Marchand'}</div>
          <div class="text-[10px] text-slate-400 font-mono">${p.merchant_email || ''}</div>
        </td>
        <td class="py-3 px-3 font-extrabold font-mono text-slate-900">
          ${formatFCFA(p.amount)}
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            ${p.channel || p.operator || 'Mobile Money'}
          </span>
        </td>
        <td class="py-3 px-3 font-mono text-xs text-slate-700">
          ${p.recipient_phone || p.recipient_account || '-'}
        </td>
        <td class="py-3 px-3">
          ${statusBadge}
        </td>
        <td class="py-3 px-3 text-right">
          ${isPending ? `
            <button onclick="openProcessPayoutModal('${p.id}')" class="px-3 py-1.5 rounded-xl bg-[#0052FF] hover:bg-[#0040D0] text-white text-xs font-bold transition-all shadow-xs">
              Décision →
            </button>
          ` : `
            <span class="text-[11px] text-slate-400 font-mono">${p.operator_reference || 'Clôturé'}</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// --------------------------------------------------------
// MODAL 6 : DÉCISION RETRAIT (APPROUVER / REJETER)
// --------------------------------------------------------
window.openProcessPayoutModal = function (payoutId) {
  const payout = AdminState.payouts.find(p => p.id === payoutId);
  if (!payout) return;

  const idInput = document.getElementById('processPayoutId');
  const details = document.getElementById('modalPayoutMerchantDetails');
  const amount = document.getElementById('modalPayoutAmount');
  const channel = document.getElementById('modalPayoutChannel');
  const recipient = document.getElementById('modalPayoutRecipient');
  const opRef = document.getElementById('payoutOpRefInput');
  const reason = document.getElementById('payoutRejectReasonInput');

  if (idInput) idInput.value = payout.id;
  if (details) details.textContent = `${payout.merchant_business || payout.merchant_name} (${payout.merchant_email})`;
  if (amount) amount.textContent = formatFCFA(payout.amount);
  if (channel) channel.textContent = payout.channel || 'Mobile Money';
  if (recipient) recipient.textContent = payout.recipient_phone || payout.recipient_account || '-';
  if (opRef) opRef.value = `RETRAIT-OP-${Date.now().toString().slice(-6)}`;
  if (reason) reason.value = '';

  openAdminModal('modalProcessPayout');
};

window.submitPayoutDecision = async function (type) {
  const payoutId = document.getElementById('processPayoutId')?.value;
  const operator_reference = document.getElementById('payoutOpRefInput')?.value?.trim();
  const reason = document.getElementById('payoutRejectReasonInput')?.value?.trim();

  if (type === 'REJECT' && !reason) {
    showAdminToast('Motif requis', 'Veuillez saisir un motif de rejet pour justifier le recrédit au marchand.', 'warning');
    return;
  }

  const endpoint = type === 'APPROVE'
    ? `/api/v1/admin/payouts/${payoutId}/approve`
    : `/api/v1/admin/payouts/${payoutId}/reject`;

  const body = type === 'APPROVE'
    ? { operator_reference }
    : { reason };

  try {
    const res = await adminFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.success) {
      if (type === 'APPROVE') {
        showAdminToast('Retrait Approuvé', 'Le virement a été marqué comme validé.', 'success');
      } else {
        showAdminToast('Retrait Rejeté & Recrédité', 'Le solde du marchand a été automatiquement recrédité.', 'warning');
      }
      closeAdminModal('modalProcessPayout');
      loadAdminPayouts();
      loadAdminOverview(false);
    } else {
      showAdminToast('Erreur', data.error, 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur', err.message, 'danger');
  }
};

// ========================================================
// 9. CONTRÔLE GLOBAL DU SYSTÈME & PARAMÈTRES
// ========================================================

async function loadAdminSettings() {
  try {
    const res = await adminFetch('/api/v1/admin/settings');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    AdminState.settings = data.settings || {};

    // Fill form
    const cfg = AdminState.settings;

    const elMaint = document.getElementById('cfgMaintenanceMode');
    const elMaintMsg = document.getElementById('cfgMaintenanceMessage');
    const elAnnActive = document.getElementById('cfgAnnouncementActive');
    const elAnnMsg = document.getElementById('cfgAnnouncementMessage');
    const elAnnType = document.getElementById('cfgAnnouncementType');
    const elFee = document.getElementById('cfgPlatformFeePercent');
    const elMinPayout = document.getElementById('cfgMinPayoutAmount');
    const elMaxTx = document.getElementById('cfgMaxTransactionAmount');

    if (elMaint) elMaint.checked = !!cfg.maintenance_mode;
    if (elMaintMsg) elMaintMsg.value = cfg.maintenance_message || '';
    if (elAnnActive) elAnnActive.checked = !!(cfg.announcement && cfg.announcement.active);
    if (elAnnMsg) elAnnMsg.value = (cfg.announcement && cfg.announcement.message) || '';
    if (elAnnType) elAnnType.value = (cfg.announcement && cfg.announcement.type) || 'info';
    if (elFee) elFee.value = cfg.default_fee_percent != null ? cfg.default_fee_percent : 2.5;
    if (elMinPayout) elMinPayout.value = cfg.min_payout_amount != null ? cfg.min_payout_amount : 1000;
    if (elMaxTx) elMaxTx.value = cfg.max_transaction_amount != null ? cfg.max_transaction_amount : 5000000;

    // Payment methods toggles
    const methodToggles = document.querySelectorAll('.method-toggle');
    methodToggles.forEach(toggle => {
      const code = toggle.getAttribute('data-method');
      if (code && cfg.payment_methods) {
        toggle.checked = cfg.payment_methods[code] !== false;
      }
    });
  } catch (err) {
    console.error('[loadAdminSettings]', err);
    showAdminToast('Erreur', 'Impossible de charger les paramètres de la plateforme.', 'danger');
  }
}

window.saveAdminSettingsForm = async function () {
  const maintenance_mode = !!document.getElementById('cfgMaintenanceMode')?.checked;
  const maintenance_message = document.getElementById('cfgMaintenanceMessage')?.value?.trim();
  const announcement_active = !!document.getElementById('cfgAnnouncementActive')?.checked;
  const announcement_message = document.getElementById('cfgAnnouncementMessage')?.value?.trim();
  const announcement_type = document.getElementById('cfgAnnouncementType')?.value || 'info';

  const default_fee_percent = Number(document.getElementById('cfgPlatformFeePercent')?.value || 2.5);
  const min_payout_amount = Number(document.getElementById('cfgMinPayoutAmount')?.value || 1000);
  const max_transaction_amount = Number(document.getElementById('cfgMaxTransactionAmount')?.value || 5000000);

  const payment_methods = {};
  document.querySelectorAll('.method-toggle').forEach(t => {
    const code = t.getAttribute('data-method');
    if (code) payment_methods[code] = t.checked;
  });

  const payload = {
    maintenance_mode,
    maintenance_message,
    announcement: {
      active: announcement_active,
      message: announcement_message,
      type: announcement_type
    },
    default_fee_percent,
    min_payout_amount,
    max_transaction_amount,
    payment_methods
  };

  try {
    const res = await adminFetch('/api/v1/admin/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAdminToast('Paramètres Enregistrés', 'Toutes les configurations sont immédiatement actives pour les marchands.', 'success');
      // Update badge in top bar
      const maintBadge = document.getElementById('adminMaintenanceStatusBadge');
      if (maintBadge) {
        if (maintenance_mode) maintBadge.classList.remove('hidden');
        else maintBadge.classList.add('hidden');
      }
    } else {
      showAdminToast('Erreur', data.error || 'Erreur lors de l\'enregistrement', 'danger');
    }
  } catch (err) {
    showAdminToast('Erreur Réseau', err.message, 'danger');
  }
};

window.openBroadcastModal = function () {
  switchAdminTab('settings');
  setTimeout(() => {
    const bannerBox = document.getElementById('cfgAnnouncementMessage');
    if (bannerBox) {
      bannerBox.focus();
      bannerBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
};

// ========================================================
// 10. JOURNAL D'AUDIT IMMUABLE
// ========================================================

async function loadAdminAuditLogs() {
  try {
    const res = await adminFetch('/api/v1/admin/audit');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    AdminState.auditLogs = data.logs || [];

    renderAuditTable(AdminState.auditLogs);
  } catch (err) {
    console.error('[loadAdminAuditLogs]', err);
    showAdminToast('Erreur', 'Impossible de charger le journal d\'audit.', 'danger');
  }
}

function renderAuditTable(logs) {
  const tbody = document.getElementById('adminAuditTableBody');
  if (!tbody) return;

  if (!logs.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-10 text-center text-slate-400">
          Aucun événement d'administration répertorié.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-3 text-slate-500 whitespace-nowrap">
          ${formatDate(l.created_at)}
        </td>
        <td class="py-3 px-3 font-semibold text-slate-800">
          ${l.admin_email || 'Système'}
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0052FF]">
            ${l.action}
          </span>
        </td>
        <td class="py-3 px-3 text-slate-700">
          ${l.target_id || '-'}
        </td>
        <td class="py-3 px-3 text-slate-600 max-w-xs truncate" title="${JSON.stringify(l.details || {})}">
          ${JSON.stringify(l.details || {})}
        </td>
      </tr>
    `;
  }).join('');
}

// ========================================================
// 11. ATTACHEMENT DES ÉVÉNEMENTS AUX FORMULAIRES
// ========================================================

function initAdminForms() {
  // Login Form
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminLoginEmail')?.value?.trim();
      const password = document.getElementById('adminLoginPassword')?.value;
      const btn = document.getElementById('btnAdminLoginSubmit');

      if (!email || !password) return;

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Authentification...';
      }

      try {
        const res = await fetch(`${ADMIN_API_BASE}/api/v1/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success && data.token) {
          AdminState.token = data.token;
          AdminState.user = data.admin;
          localStorage.setItem('vandias_admin_token', data.token);
          localStorage.setItem('vandias_admin_user', JSON.stringify(data.admin));

          showAdminToast('Connexion Réussie', `Bienvenue ${data.admin.full_name || 'Directeur Général'}.`, 'success');
          enterAdminDashboard();
        } else {
          showAdminToast('Échec de Connexion', data.error || 'Identifiants invalides.', 'danger');
        }
      } catch (err) {
        showAdminToast('Erreur Réseau', err.message, 'danger');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Connexion à la Console';
        }
      }
    });
  }

  // Modals Forms
  const fBalance = document.getElementById('formEditBalance');
  if (fBalance) fBalance.addEventListener('submit', handleBalanceSubmit);

  const fSuspend = document.getElementById('formSuspendMerchant');
  if (fSuspend) fSuspend.addEventListener('submit', handleSuspendSubmit);

  const fCustomFee = document.getElementById('formCustomFee');
  if (fCustomFee) fCustomFee.addEventListener('submit', handleCustomFeeSubmit);

  const fForceTx = document.getElementById('formForceValidateTx');
  if (fForceTx) fForceTx.addEventListener('submit', handleForceValidateSubmit);
}
