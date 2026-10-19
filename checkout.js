/**
 * VandiasPay Checkout — Hosted Checkout Logic & State Machine
 * Inspired by Stripe Checkout & SasPay Checkout
 */

document.addEventListener('DOMContentLoaded', () => {
  initCheckoutParams();
  initCountrySelector();
  initPaymentMethodSelector();
  initCardFormatting();
  initPaymentSubmission();
  initScreenTransitions();
});

// Checkout Runtime State
const CheckoutState = {
  currentScreen: 'form', // 'form', 'pending', 'success', 'failed'
  merchant: 'Jeff Digital Inc.',
  productTitle: 'Abonnement Canva Pro (1 an d\'accès complet)',
  amount: 5000,
  currency: 'FCFA',
  country: 'SN',
  prefix: '+221',
  flag: '🇸🇳',
  method: 'wave',
  payer: {
    name: 'Amadou Diallo',
    phone: '77 842 19 04',
    email: 'amadou.diallo@gmail.com'
  },
  returnUrl: 'dashboard.html',
  countdownInterval: null,
  countdownSeconds: 58,
  autoRedirectInterval: null,
  autoRedirectSeconds: 10
};

// Formatter for currency
function formatCurrency(amount, currency = 'FCFA') {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
}

function applyCheckoutDOM() {
  const merchantEl = document.getElementById('checkoutMerchantName');
  const amountEl = document.getElementById('checkoutAmountDisplay');
  const currencyEl = document.getElementById('checkoutCurrencyDisplay');
  const productTitleEl = document.getElementById('checkoutProductTitle');
  const summaryItemEl = document.getElementById('summaryItemName');
  const summaryUnitPriceEl = document.getElementById('summaryUnitPrice');
  const summaryOrderRefEl = document.getElementById('summaryOrderRef');

  if (merchantEl) {
    merchantEl.innerHTML = `${CheckoutState.merchant} <svg class="w-4 h-4 text-emerald-400 inline" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
  }
  if (amountEl) amountEl.textContent = new Intl.NumberFormat('fr-FR').format(CheckoutState.amount);
  if (currencyEl) currencyEl.textContent = CheckoutState.currency;
  if (productTitleEl) productTitleEl.textContent = `🛒 ${CheckoutState.productTitle}`;
  if (summaryItemEl) summaryItemEl.textContent = CheckoutState.productTitle;
  if (summaryUnitPriceEl) summaryUnitPriceEl.textContent = formatCurrency(CheckoutState.amount, CheckoutState.currency);
  if (summaryOrderRefEl) {
    summaryOrderRefEl.textContent = CheckoutState.sessionId ? `CMD-VP-${CheckoutState.sessionId.slice(-6).toUpperCase()}` : `CMD-VP-${Math.floor(Math.random() * 89999 + 10000)}`;
  }

  updatePayButtonText();
}

/* ========================================================
   1. PARSE URL QUERY PARAMETERS & ASYNC API FETCH
   ======================================================== */
async function initCheckoutParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id') || urlParams.get('session') || urlParams.get('link') || urlParams.get('id');

  if (sessionId) {
    CheckoutState.sessionId = sessionId;
    try {
      const res = await fetch(`/api/v1/pay/${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          const s = data.session;
          if (s.amount) CheckoutState.amount = parseFloat(s.amount);
          if (s.currency) CheckoutState.currency = (s.currency === 'XOF' ? 'FCFA' : s.currency);
          if (s.title) CheckoutState.productTitle = s.title;
          if (s.merchant_name) CheckoutState.merchant = s.merchant_name;
          if (s.redirect_url) CheckoutState.returnUrl = s.redirect_url;
          if (s.customer && s.customer.phone) {
            CheckoutState.payer.phone = s.customer.phone;
            const phoneInput = document.getElementById('payerPhone');
            if (phoneInput) phoneInput.value = s.customer.phone;
          }
          if (s.customer && s.customer.name) {
            CheckoutState.payer.name = s.customer.name;
            const nameInput = document.getElementById('payerName');
            if (nameInput) nameInput.value = s.customer.name;
          }
        }
      }
    } catch (err) {
      console.warn('API /pay/:id fallback to URL search params:', err);
    }
  }

  // Fallback URL overrides
  if (urlParams.get('merchant')) CheckoutState.merchant = urlParams.get('merchant');
  if (urlParams.get('amount')) {
    const parsed = parseInt(urlParams.get('amount'), 10);
    if (!isNaN(parsed) && parsed > 0) CheckoutState.amount = parsed;
  }
  if (urlParams.get('currency')) CheckoutState.currency = urlParams.get('currency');
  if (urlParams.get('item') || urlParams.get('product')) {
    CheckoutState.productTitle = urlParams.get('item') || urlParams.get('product');
  }
  if (urlParams.get('return_url')) CheckoutState.returnUrl = urlParams.get('return_url');

  applyCheckoutDOM();
}

/* ========================================================
   2. COUNTRY SELECTOR & AUTO-PREFIX SYNC
   ======================================================== */
function initCountrySelector() {
  const select = document.getElementById('countrySelect');
  const prefixSpan = document.getElementById('phoneCountryPrefix');
  const flagSpan = document.getElementById('phoneCountryFlag');

  if (!select) return;

  const sampleNumbers = {
    SN: '77 842 19 04',
    CI: '07 58 92 14 30',
    CM: '670 42 18 99',
    BJ: '97 10 22 45',
    TG: '90 12 34 56',
    BF: '70 12 34 56',
    ML: '66 12 88 40',
    CG: '06 123 45 67',
    CD: '81 234 56 78',
    FR: '06 12 34 56 78'
  };

  select.addEventListener('change', () => {
    const selectedOpt = select.options[select.selectedIndex];
    const prefix = selectedOpt.getAttribute('data-prefix');
    const flag = selectedOpt.getAttribute('data-flag');
    const countryCode = select.value;

    CheckoutState.country = countryCode;
    CheckoutState.prefix = prefix;
    CheckoutState.flag = flag;

    if (prefixSpan && flagSpan) {
      prefixSpan.innerHTML = `<span id="phoneCountryFlag">${flag}</span> ${prefix}`;
    }

    const phoneInput = document.getElementById('payerPhone');
    if (phoneInput && sampleNumbers[countryCode]) {
      phoneInput.value = sampleNumbers[countryCode];
    }

    // Auto-select best method for country
    if (countryCode === 'SN') selectMethod('wave');
    else if (countryCode === 'CI') selectMethod('orange');
    else if (countryCode === 'CM') selectMethod('mtn');
    else if (countryCode === 'BJ') selectMethod('moov');
    else if (countryCode === 'FR') selectMethod('card');
  });
}

/* ========================================================
   3. PAYMENT METHOD SELECTION & DYNAMIC FORM FIELDS
   ======================================================== */
const methodDetails = {
  wave: {
    name: 'Wave',
    icon: '🌊',
    btnLabel: 'Wave',
    hint: '⚡ Une notification push sera envoyée sur votre compte Wave.',
    isCard: false
  },
  orange: {
    name: 'Orange Money',
    icon: '🟠',
    btnLabel: 'Orange Money',
    hint: '🟠 Validez la notification push ou composez le code secret sur votre téléphone.',
    isCard: false
  },
  mtn: {
    name: 'MTN Mobile Money',
    icon: '🟡',
    btnLabel: 'MTN MoMo',
    hint: '🟡 Composez votre code secret sur le prompt USSD qui s\'affiche à l\'écran.',
    isCard: false
  },
  moov: {
    name: 'Moov Money',
    icon: '🔵',
    btnLabel: 'Moov Money',
    hint: '🔵 Confirmez l\'ordre de débit sur votre portefeuille Flooz / Moov Money.',
    isCard: false
  },
  card: {
    name: 'Carte Bancaire',
    icon: '💳',
    btnLabel: 'Carte Bancaire',
    hint: '💳 Chiffrement 3D Secure 2.0 avec vérification sécurisée par votre banque.',
    isCard: true
  }
};

function selectMethod(methodKey) {
  const cards = document.querySelectorAll('.payment-method-card');
  const fieldsMobile = document.getElementById('fieldsMobileMoney');
  const fieldsCard = document.getElementById('fieldsCard');
  const hintEl = document.getElementById('operatorHintText');

  cards.forEach(card => {
    const isThis = card.getAttribute('data-method') === methodKey;
    const dot = card.querySelector('.radio-dot');
    if (isThis) {
      card.classList.add('active');
      if (dot) dot.classList.remove('hidden');
    } else {
      card.classList.remove('active');
      if (dot) dot.classList.add('hidden');
    }
  });

  CheckoutState.method = methodKey;
  const config = methodDetails[methodKey];

  if (config.isCard) {
    if (fieldsMobile) fieldsMobile.classList.add('hidden');
    if (fieldsCard) fieldsCard.classList.remove('hidden');
  } else {
    if (fieldsMobile) fieldsMobile.classList.remove('hidden');
    if (fieldsCard) fieldsCard.classList.add('hidden');
    if (hintEl) hintEl.textContent = config.hint;
  }

  updatePayButtonText();
}

function initPaymentMethodSelector() {
  const cards = document.querySelectorAll('.payment-method-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const method = card.getAttribute('data-method');
      selectMethod(method);
    });
  });
}

function updatePayButtonText() {
  const btnText = document.getElementById('btnPayText');
  if (!btnText) return;
  const methodLabel = methodDetails[CheckoutState.method]?.btnLabel || 'Wave';
  btnText.textContent = `Payer ${new Intl.NumberFormat('fr-FR').format(CheckoutState.amount)} ${CheckoutState.currency} avec ${methodLabel}`;
}

/* ========================================================
   4. CARD INPUT FORMATTING & BRAND DETECTION
   ======================================================== */
function initCardFormatting() {
  const cardInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('cardExpiry');
  const cvcInput = document.getElementById('cardCvc');
  const brandBadge = document.getElementById('detectedCardBrand');

  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = cardInput.value.replace(/\D/g, '');
      if (val.length > 16) val = val.substring(0, 16);
      
      // Add spaces every 4 digits
      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      cardInput.value = formatted;

      // Brand auto-detection
      if (brandBadge) {
        if (val.startsWith('4')) {
          brandBadge.textContent = 'VISA';
          brandBadge.className = 'text-[10px] font-mono uppercase text-sky-400 font-bold';
        } else if (val.startsWith('5') || val.startsWith('2')) {
          brandBadge.textContent = 'Mastercard';
          brandBadge.className = 'text-[10px] font-mono uppercase text-amber-400 font-bold';
        } else {
          brandBadge.textContent = 'CARTE';
          brandBadge.className = 'text-[10px] font-mono uppercase text-slate-400 font-bold';
        }
      }
    });
  }

  if (expiryInput) {
    expiryInput.addEventListener('input', () => {
      let val = expiryInput.value.replace(/\D/g, '');
      if (val.length > 4) val = val.substring(0, 4);
      if (val.length >= 3) {
        expiryInput.value = val.substring(0, 2) + '/' + val.substring(2);
      } else {
        expiryInput.value = val;
      }
    });
  }

  if (cvcInput) {
    cvcInput.addEventListener('input', () => {
      cvcInput.value = cvcInput.value.replace(/\D/g, '').substring(0, 4);
    });
  }
}

/* ========================================================
   5. SCREEN STATE TRANSITIONS & PAYMENT FLOW
   ======================================================== */
function showScreen(screenId) {
  const screens = [
    document.getElementById('screenCheckoutForm'),
    document.getElementById('screenPendingValidation'),
    document.getElementById('screenSuccess'),
    document.getElementById('screenFailed')
  ];

  screens.forEach(s => {
    if (!s) return;
    if (s.id === screenId) {
      s.classList.remove('hidden');
      s.classList.add('active');
    } else {
      s.classList.add('hidden');
      s.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPaymentSubmission() {
  const form = document.getElementById('checkoutPaymentForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Collect Payer Details
    const nameInput = document.getElementById('payerName');
    const emailInput = document.getElementById('payerEmail');
    const phoneInput = document.getElementById('payerPhone');

    if (nameInput) CheckoutState.payer.name = nameInput.value;
    if (emailInput) CheckoutState.payer.email = emailInput.value;
    if (phoneInput) CheckoutState.payer.phone = phoneInput.value;

    startPendingValidation();
  });
}

function startPendingValidation() {
  showScreen('screenPendingValidation');
  CheckoutState.currentScreen = 'pending';

  const opConfig = methodDetails[CheckoutState.method];
  const iconEl = document.getElementById('pendingOperatorIcon');
  const targetPhoneEl = document.getElementById('pendingTargetPhone');
  const opNameEl = document.getElementById('pendingOperatorName');

  if (iconEl) iconEl.textContent = opConfig.icon;
  if (targetPhoneEl) targetPhoneEl.textContent = `${CheckoutState.prefix} ${CheckoutState.payer.phone}`;
  if (opNameEl) opNameEl.textContent = opConfig.name;

  // Start 58-second Countdown
  CheckoutState.countdownSeconds = 58;
  const timerDisplay = document.getElementById('countdownTimerDisplay');
  const progressBar = document.getElementById('countdownProgressBar');

  if (CheckoutState.countdownInterval) clearInterval(CheckoutState.countdownInterval);

  CheckoutState.countdownInterval = setInterval(() => {
    CheckoutState.countdownSeconds--;
    const mins = Math.floor(CheckoutState.countdownSeconds / 60);
    const secs = CheckoutState.countdownSeconds % 60;
    if (timerDisplay) {
      timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const pct = (CheckoutState.countdownSeconds / 58) * 100;
    if (progressBar) progressBar.style.width = `${pct}%`;

    if (CheckoutState.countdownSeconds <= 0) {
      clearInterval(CheckoutState.countdownInterval);
      triggerPaymentFailed("Délai de validation expiré. Veuillez relancer la transaction.");
    }
  }, 1000);

  // Synchronize with Backend API and Auto-simulate successful verification
  setTimeout(async () => {
    if (CheckoutState.currentScreen === 'pending') {
      let receiptData = null;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = CheckoutState.sessionId || urlParams.get('session_id') || urlParams.get('session') || urlParams.get('link') || urlParams.get('id') || 'demo';
        
        const res = await fetch(`/api/v1/pay/${encodeURIComponent(targetId)}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: (CheckoutState.method || 'WAVE').toUpperCase(),
            customer_phone: `${CheckoutState.prefix} ${CheckoutState.payer.phone}`,
            customer_name: CheckoutState.payer.name,
            customer_email: CheckoutState.payer.email
          })
        });
        const data = await res.json();
        if (data && data.receipt) {
          receiptData = data.receipt;
          CheckoutState.lastReceipt = data.receipt;
        }
      } catch (err) {
        console.warn('API sync fallback active:', err);
      }
      triggerPaymentSuccess(receiptData);
    }
  }, 3500);
}

function triggerPaymentSuccess(receipt = null) {
  if (CheckoutState.countdownInterval) clearInterval(CheckoutState.countdownInterval);
  CheckoutState.currentScreen = 'success';
  showScreen('screenSuccess');

  const finalTxId = receipt?.id || `tx_live_${Math.random().toString(36).substring(2, 10)}`;
  const finalRef = receipt?.operator_reference || `${CheckoutState.method.toUpperCase().substring(0, 3)}-SN-${Math.floor(Math.random() * 899999 + 100000)}`;
  const finalMerchant = receipt?.merchant_name || CheckoutState.merchant;

  const amountEl = document.getElementById('successPaidAmount');
  const txIdEl = document.getElementById('successTxId');
  const refEl = document.getElementById('successOperatorRef');
  const methodEl = document.getElementById('successMethodLabel');
  const dateEl = document.getElementById('successDateLabel');
  const emailEl = document.getElementById('successEmailLabel');
  const merchantEl = document.getElementById('successMerchantLabel');
  const returnBtn = document.getElementById('btnReturnToMerchant');

  if (amountEl) amountEl.textContent = formatCurrency(CheckoutState.amount, CheckoutState.currency);
  if (txIdEl) txIdEl.textContent = finalTxId;
  if (refEl) refEl.textContent = finalRef;
  if (methodEl) methodEl.textContent = methodDetails[CheckoutState.method]?.name || 'Wave';
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = `${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (emailEl) emailEl.textContent = CheckoutState.payer.email;
  if (merchantEl) merchantEl.textContent = finalMerchant;
  if (returnBtn) returnBtn.href = CheckoutState.returnUrl || 'dashboard.html';

  // Auto redirect countdown
  CheckoutState.autoRedirectSeconds = 10;
  const redirectDisplay = document.getElementById('autoRedirectCountdown');
  if (CheckoutState.autoRedirectInterval) clearInterval(CheckoutState.autoRedirectInterval);

  CheckoutState.autoRedirectInterval = setInterval(() => {
    CheckoutState.autoRedirectSeconds--;
    if (redirectDisplay) redirectDisplay.textContent = CheckoutState.autoRedirectSeconds;
    if (CheckoutState.autoRedirectSeconds <= 0) {
      clearInterval(CheckoutState.autoRedirectInterval);
      window.location.href = CheckoutState.returnUrl || 'dashboard.html';
    }
  }, 1000);
}

function triggerPaymentFailed(reason = "") {
  if (CheckoutState.countdownInterval) clearInterval(CheckoutState.countdownInterval);
  CheckoutState.currentScreen = 'failed';
  showScreen('screenFailed');

  const errorMsg = document.getElementById('failedErrorMessage');
  const timestampEl = document.getElementById('failedTimestamp');

  if (errorMsg && reason) errorMsg.textContent = reason;
  if (timestampEl) {
    const now = new Date();
    timestampEl.textContent = `${now.toLocaleDateString('fr-FR')}, ${now.toLocaleTimeString('fr-FR')}`;
  }
}

function initScreenTransitions() {
  // Fast forward button on pending screen
  const btnFastForward = document.getElementById('btnFastForwardSuccess');
  if (btnFastForward) {
    btnFastForward.addEventListener('click', async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session') || urlParams.get('link') || 'demo';
        await fetch(`/api/v1/pay/${encodeURIComponent(sessionId)}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: CheckoutState.method,
            customer_phone: CheckoutState.payer.phone,
            customer_name: CheckoutState.payer.name,
            customer_email: CheckoutState.payer.email
          })
        });
      } catch (err) {
        console.warn('API sync fallback active:', err);
      }
      triggerPaymentSuccess();
    });
  }

  // Cancel button on pending screen
  const btnCancel = document.getElementById('btnCancelPendingPayment');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (CheckoutState.countdownInterval) clearInterval(CheckoutState.countdownInterval);
      showScreen('screenCheckoutForm');
      CheckoutState.currentScreen = 'form';
    });
  }

  // Retry button on failed screen
  const btnRetry = document.getElementById('btnRetryPayment');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      showScreen('screenCheckoutForm');
      CheckoutState.currentScreen = 'form';
    });
  }

  const btnAnotherMethod = document.getElementById('btnChooseAnotherMethod');
  if (btnAnotherMethod) {
    btnAnotherMethod.addEventListener('click', () => {
      showScreen('screenCheckoutForm');
      CheckoutState.currentScreen = 'form';
    });
  }

  // Print receipt button
  const btnPrint = document.getElementById('btnPrintCheckoutReceipt');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }
}
