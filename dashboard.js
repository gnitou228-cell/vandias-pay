/**
 * VANDIAS PAY — Dashboard Interactive Engine
 * Conforme à la disposition exacte des captures d'écran
 */

document.addEventListener('DOMContentLoaded', () => {
  initSidebarTabs();
  initMobileDrawer();
  initProfileDropdown();
  initActionModals();
  renderDetailedWallets();
  renderFullTransactionsList();
  renderPaymentLinksList();
  renderCustomersList();
});

// App State
const VPState = {
  wallets: [
    { code: "USD", name: "Dollar Américain", balance: 0, flag: "🇺🇸", symbol: "$" },
    { code: "XOF", name: "Franc CFA UEMOA (Sénégal, CI, Bénin...)", balance: 80, flag: "🇸🇳", symbol: "F" },
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
  transactions: [
    { id: "983f6ce1059746b2b4...", date: "18 oct., 23:50", amount: "+5 USD", rawAmount: 5, currency: "USD", customer: "Amadou Diallo", status: "success" },
    { id: "d5d62768b3de4e...", date: "18 oct., 23:38", amount: "+9983 CDF", rawAmount: 9983, currency: "CDF", customer: "Jean-Yves Kouamé", status: "failed" },
    { id: "54260b5ebd934...", date: "10 oct., 17:58", amount: "+7900 XOF", rawAmount: 7900, currency: "XOF", customer: "Fatou Bintou Sow", status: "failed" },
    { id: "e0abd62d74ae4...", date: "30 sept., 08:22", amount: "+5000 CDF", rawAmount: 5000, currency: "CDF", customer: "Cédric Nguema", status: "success" },
    { id: "97931add9f2d44...", date: "30 sept., 08:18", amount: "+5000 CDF", rawAmount: 5000, currency: "CDF", customer: "Aminata Traoré", status: "failed" },
    { id: "a524b01b88c249...", date: "30 sept., 04:48", amount: "+2000 XOF", rawAmount: 2000, currency: "XOF", customer: "Marc Aurel Hounkpatin", status: "failed" },
    { id: "19f8a42b109c...", date: "28 sept., 14:15", amount: "+15000 XOF", rawAmount: 15000, currency: "XOF", customer: "Ibrahim Sanogo", status: "success" }
  ],
  paymentLinks: [
    { id: "lnk_canva_pro", title: "Abonnement Canva Pro (1 an)", amount: 5000, currency: "XOF", sales: 18, url: "checkout.html?merchant=VANDIAS+PAY&amount=5000&item=Abonnement+Canva+Pro+1+an" },
    { id: "lnk_pack_automation", title: "Pack Automatisation & IA", amount: 25000, currency: "XOF", sales: 7, url: "checkout.html?merchant=VANDIAS+PAY&amount=25000&item=Pack+Automatisation+et+IA" },
    { id: "lnk_consulting_1h", title: "Consulting Stratégie IA 1h", amount: 50, currency: "USD", sales: 4, url: "checkout.html?merchant=VANDIAS+PAY&amount=50&currency=USD&item=Consulting+IA+1h" }
  ]
};

/* ========================================================
   1. NAVIGATION ENTRE LES 15 ONGLETS DE LA SIDEBAR
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

/* ========================================================
   2. MOBILE DRAWER NAVIGATION
   ======================================================== */
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

/* ========================================================
   3. MENU DÉROULANT PROFIL (CAPTURE D'ÉCRAN 3)
   ======================================================== */
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

  // Close when clicking outside
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
  showToast("Déconnexion en cours...", "Redirection vers la page d'accueil.");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
}

/* ========================================================
   4. MODALS & FORM ACTIONS
   ======================================================== */
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
  // Retirer action button
  const btnPayout = document.getElementById('btnOpenPayoutModal');
  if (btnPayout) {
    btnPayout.addEventListener('click', () => openModal('modalPayoutQuick'));
  }

  // Créer un lien action button
  const btnCreateLink = document.getElementById('btnOpenCreateLinkModal');
  if (btnCreateLink) {
    btnCreateLink.addEventListener('click', () => openModal('modalCreateLink'));
  }

  // Create link form submission
  const createForm = document.getElementById('createLinkForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newLinkTitle').value;
      const amount = parseInt(document.getElementById('newLinkAmount').value, 10);
      const currency = document.getElementById('newLinkCurrency').value;

      let generatedUrl = `checkout.html?merchant=VANDIAS+PAY&amount=${amount}&currency=${currency}&item=${encodeURIComponent(title)}`;

      try {
        const res = await fetch('/api/v1/merchant/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, amount_fcfa: amount })
        });
        const data = await res.json();
        if (data.success && data.payment_link) {
          generatedUrl = data.payment_link.url;
        }
      } catch (err) {
        console.warn('Backend link generation fallback:', err);
      }

      const newLnk = {
        id: `lnk_${Date.now().toString(36)}`,
        title,
        amount,
        currency,
        sales: 0,
        url: generatedUrl
      };

      VPState.paymentLinks.unshift(newLnk);
      renderPaymentLinksList();
      closeModal('modalCreateLink');
      createForm.reset();

      showToast("Lien créé avec succès !", newLnk.title);
    });
  }

  // Payout confirmation
  const btnWithdraw = document.getElementById('btnSubmitWithdrawal');
  if (btnWithdraw) {
    btnWithdraw.addEventListener('click', async () => {
      const amt = parseFloat(document.getElementById('payoutAmountInput').value) || 0;
      const phone = document.getElementById('payoutPhoneInput')?.value || '+221778421904';
      try {
        await fetch('/api/v1/merchant/payouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amt, channel: 'WAVE', recipient_phone: phone })
        });
      } catch (err) {
        console.warn('Backend payout fallback:', err);
      }
      showToast("Retrait initié !", `Demande de ${amt.toLocaleString('fr-FR')} XOF transmise avec succès.`);
      closeModal('modalPayoutQuick');
    });
  }
}

/* ========================================================
   5. DETAILED WALLETS FOR 25+ COUNTRIES (SECTION WALLET)
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
        <button class="text-[#5846F6] font-bold hover:underline" onclick="showToast('Dépôt', 'Option de rechargement bientôt disponible.');">Dépôt</button>
        <button class="text-slate-500 font-medium hover:text-[#111827]" onclick="openModal('modalPayoutQuick')">Transférer</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ========================================================
   6. FULL TRANSACTIONS LIST
   ======================================================== */
function renderFullTransactionsList() {
  const tbody = document.getElementById('fullTransactionsBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  VPState.transactions.forEach(t => {
    const isSuccess = t.status === 'success';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F8F9FD] transition-colors';
    tr.innerHTML = `
      <td class="py-3 px-3 font-mono font-bold text-[#111827]">${t.id}</td>
      <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">${t.date}</td>
      <td class="py-3 px-3 font-medium text-slate-700">${t.customer}</td>
      <td class="py-3 px-3 font-mono font-bold text-[#111827]">${t.rawAmount.toLocaleString('fr-FR')}</td>
      <td class="py-3 px-3 font-mono font-semibold text-slate-500">${t.currency}</td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}">
          ${isSuccess ? 'Réussi' : 'Échoué'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const exportBtn = document.getElementById('btnExportCsv');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const csv = "ID,Date,Client,Montant,Devise,Statut\n" + VPState.transactions.map(t => `${t.id},${t.date},"${t.customer}",${t.rawAmount},${t.currency},${t.status}`).join("\n");
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'vandias_transactions.csv');
      a.click();
      showToast("Exporté !", "Fichier CSV téléchargé.");
    });
  }
}

/* ========================================================
   7. PAYMENT LINKS LIST
   ======================================================== */
function renderPaymentLinksList() {
  const container = document.getElementById('paymentLinksListContainer');
  if (!container) return;

  container.innerHTML = '';
  VPState.paymentLinks.forEach(lnk => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-3xl bg-white border border-[#ECEEF6] shadow-sm flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
          <span>${lnk.id}</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">Actif</span>
        </div>
        <h4 class="text-sm font-bold text-[#111827] mb-2">${lnk.title}</h4>
        <div class="text-2xl font-black text-[#111827] font-mono mb-3">
          ${lnk.amount.toLocaleString('fr-FR')} ${lnk.currency}
        </div>
        <span class="text-xs text-slate-400 block">${lnk.sales} ventes réalisées</span>
      </div>

      <div class="pt-4 border-t border-[#F0F2F9] mt-4 flex items-center justify-between gap-2">
        <button class="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-[#111827] transition-colors" onclick="navigator.clipboard.writeText('${window.location.origin}/${lnk.url}'); showToast('Copié !', 'Lien copié dans le presse-papier.');">
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
   8. CLIENTS CRM LIST
   ======================================================== */
function renderCustomersList() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;

  const customers = [
    { name: "Amadou Diallo", phone: "+221 77 842 19 04", email: "amadou.diallo@gmail.com", purchases: 4, total: "35 000 XOF" },
    { name: "Cédric Nguema", phone: "+237 670 42 18 99", email: "cedric.nguema@gmail.com", purchases: 2, total: "10 000 CDF" },
    { name: "Fatou Bintou Sow", phone: "+221 78 120 44 91", email: "fatou.sow@yahoo.fr", purchases: 1, total: "25 000 XOF" },
    { name: "Ibrahim Sanogo", phone: "+225 05 44 19 82 10", email: "ibrahim.s@gmail.com", purchases: 3, total: "45 000 XOF" }
  ];

  tbody.innerHTML = '';
  customers.forEach(c => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#F8F9FD] transition-colors';
    tr.innerHTML = `
      <td class="py-3 px-3 font-bold text-[#111827]">${c.name}</td>
      <td class="py-3 px-3 font-mono text-slate-600">${c.phone}</td>
      <td class="py-3 px-3 font-mono text-slate-400 text-[11px]">${c.email}</td>
      <td class="py-3 px-3 font-bold text-[#111827]">${c.purchases}</td>
      <td class="py-3 px-3 font-bold text-emerald-600 font-mono">${c.total}</td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleSecretKey() {
  const input = document.getElementById('devSecretKeyInput');
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

/* ========================================================
   9. TOAST NOTIFICATION
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
