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
  merchant: 'Commerçant VandiasPay',
  productTitle: 'Commande sécurisée',
  amount: 5000,
  currency: 'FCFA',
  country: 'TG',
  prefix: '+228',
  flag: '🇹🇬',
  method: 'tmoney',
  selectedOp: null,
  payer: {
    name: 'Amadou Diallo',
    phone: '90 12 34 56',
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

function getFlagUrl(countryCode) {
  if (!countryCode) return 'https://flagcdn.com/w40/tg.png';
  const c = countryCode.toLowerCase();
  return 'https://flagcdn.com/w40/' + c + '.png';
}

function applyCheckoutDOM() {
  const merchantEl = document.getElementById('checkoutMerchantName');
  const avatarEl = document.getElementById('merchantAvatarCircle');
  const amountEl = document.getElementById('checkoutAmountDisplay');
  const currencyEl = document.getElementById('checkoutCurrencyDisplay');
  const productTitleEl = document.getElementById('checkoutProductTitle');
  const summaryItemEl = document.getElementById('summaryItemName');
  const summaryUnitPriceEl = document.getElementById('summaryUnitPrice');
  const summaryOrderRefEl = document.getElementById('summaryOrderRef');

  if (avatarEl && CheckoutState.merchant) {
    const initials = CheckoutState.merchant
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    avatarEl.textContent = initials || 'VP';
  }

  if (merchantEl) {
    merchantEl.innerHTML = CheckoutState.merchant + ' <svg class="w-4 h-4 text-emerald-500 inline shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
  }
  if (amountEl) amountEl.textContent = new Intl.NumberFormat('fr-FR').format(CheckoutState.amount);
  if (currencyEl) currencyEl.textContent = CheckoutState.currency;
  if (productTitleEl) productTitleEl.textContent = CheckoutState.productTitle;
  if (summaryItemEl) summaryItemEl.textContent = CheckoutState.productTitle;
  if (summaryUnitPriceEl) summaryUnitPriceEl.textContent = formatCurrency(CheckoutState.amount, CheckoutState.currency);
  if (summaryOrderRefEl) {
    summaryOrderRefEl.textContent = CheckoutState.sessionId ? ('CMD-VP-' + CheckoutState.sessionId.slice(-6).toUpperCase()) : ('CMD-VP-' + Math.floor(Math.random() * 89999 + 10000));
  }

  const summaryFlagImg = document.getElementById('summaryCountryFlagImg');
  const summaryNameEl = document.getElementById('summaryCountryName');
  const countryData = countryOperators[CheckoutState.country] || countryOperators.TG;
  if (summaryFlagImg) summaryFlagImg.src = getFlagUrl(CheckoutState.country);
  if (summaryNameEl) summaryNameEl.textContent = countryData.countryName + ' (' + countryData.prefix + ')';

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
          if (s.default_country && typeof selectCountry === 'function') {
            selectCountry(s.default_country);
          }
          if (s.status === 'SUCCESS' || urlParams.get('status') === 'success') {
            applyCheckoutDOM();
            triggerPaymentSuccess({
              id: s.id,
              amount: CheckoutState.amount,
              currency: CheckoutState.currency,
              merchant_name: CheckoutState.merchant,
              operator_reference: 'SASP-VALIDE'
            });
            return;
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
   2. CATALOGUE DYNAMIQUE DES OPÉRATEURS PAR PAYS
   ======================================================== */
const countryOperators = {
  TG: {
    countryName: 'Togo',
    prefix: '+228',
    flag: '🇹🇬',
    sample: '90 12 34 56',
    operators: [
      {
        id: 'moov_tg',
        method: 'moov',
        name: 'Moov Money (Flooz)',
        badge: 'Flooz direct',
        desc: 'Validation Flooz directe ou tapez *155#',
        logo: 'assets/operators/moov.png',
        hint: () => '🔵 Un ordre de débit Flooz vous a été transmis. Composez votre code PIN sur votre mobile pour valider.'
      },
      {
        id: 'tmoney_tg',
        method: 'tmoney',
        name: 'Mixx by Yas (T-Money)',
        badge: 'USSD direct',
        desc: 'Prompt USSD direct ou tapez *145#',
        logo: 'assets/operators/mixx.png',
        hint: () => '🟡 Un prompt USSD Mixx by Yas a été envoyé. Saisissez votre code PIN sur votre mobile (ou composez le *145#).'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement international sécurisé 3D-Secure',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  BJ: {
    countryName: 'Bénin',
    prefix: '+229',
    flag: '🇧🇯',
    sample: '97 10 22 45',
    operators: [
      {
        id: 'mtn_bj',
        method: 'mtn',
        name: 'MTN Mobile Money',
        badge: 'MoMo direct',
        desc: 'Prompt USSD direct sur votre écran',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Un prompt USSD a été envoyé sur votre téléphone. Saisissez votre code secret MoMo.'
      },
      {
        id: 'moov_bj',
        method: 'moov',
        name: 'Moov Money Bénin',
        badge: 'Flooz direct',
        desc: 'Validation Flooz sécurisée',
        logo: 'assets/operators/moov.png',
        hint: () => '🔵 Validez la demande de débit Moov Money sur votre téléphone avec votre code PIN.'
      },
      {
        id: 'celtiis_bj',
        method: 'celtiis',
        name: 'Celtiis Cash',
        badge: 'Celtiis Cash',
        desc: 'Paiement direct compte Celtiis',
        logo: 'assets/operators/celtiis.svg',
        hint: () => '🟣 Confirmez le paiement sur votre compte ou application Celtiis Cash.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  CI: {
    countryName: "Côte d'Ivoire",
    prefix: '+225',
    flag: '🇨🇮',
    sample: '07 58 92 14 30',
    operators: [
      {
        id: 'wave_ci',
        method: 'wave',
        name: 'Wave Côte d\'Ivoire',
        badge: '1% ou 0F',
        desc: 'Push ou ouverture appli Wave',
        logo: 'assets/operators/wave.svg',
        hint: () => '🌊 Ouvrez votre application Wave sur votre téléphone et confirmez le paiement.'
      },
      {
        id: 'orange_ci',
        method: 'orange',
        name: 'Orange Money',
        badge: 'Code OTP',
        desc: 'Code OTP via #144*77#',
        logo: 'assets/operators/orange.svg',
        requiresOtp: true,
        ussdTemplate: () => '#144*77#',
        hint: () => '🟠 Composez le #144*77# sur votre mobile Orange pour obtenir votre code d\'autorisation OTP.'
      },
      {
        id: 'mtn_ci',
        method: 'mtn',
        name: 'MTN Mobile Money',
        badge: 'MoMo direct',
        desc: 'Validation prompt USSD',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Un prompt USSD a été envoyé sur votre téléphone MTN. Entrez votre code secret.'
      },
      {
        id: 'moov_ci',
        method: 'moov',
        name: 'Moov Money CI',
        badge: 'Flooz direct',
        desc: 'Validation Flooz sécurisée',
        logo: 'assets/operators/moov.png',
        hint: () => '🔵 Validez le paiement sur votre compte Moov Money.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  SN: {
    countryName: 'Sénégal',
    prefix: '+221',
    flag: '🇸🇳',
    sample: '77 842 19 04',
    operators: [
      {
        id: 'wave_sn',
        method: 'wave',
        name: 'Wave Sénégal',
        badge: '1% ou 0F',
        desc: 'Push ou scan QR instantané (1%)',
        logo: 'assets/operators/wave.svg',
        hint: () => '🌊 Ouvrez votre application Wave pour confirmer le paiement de la commande.'
      },
      {
        id: 'orange_sn',
        method: 'orange',
        name: 'Orange Money Sénégal',
        badge: 'Instantané',
        desc: 'Validation push ou code secret',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Confirmez la transaction sur votre compte Orange Money Sénégal.'
      },
      {
        id: 'free_sn',
        method: 'freemoney',
        name: 'Free Money',
        badge: 'Free Money',
        desc: 'Validation compte Free',
        logo: 'assets/operators/freemoney.svg',
        hint: () => '🔴 Confirmez l\'opération Free Money sur votre mobile.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  BF: {
    countryName: 'Burkina Faso',
    prefix: '+226',
    flag: '🇧🇫',
    sample: '05 15 84 94',
    operators: [
      {
        id: 'orange_bf',
        method: 'orange',
        name: 'Orange Money Burkina',
        badge: 'Code OTP',
        desc: 'Code OTP via *144*4*6*MONTANT#',
        logo: 'assets/operators/orange.svg',
        requiresOtp: true,
        ussdTemplate: (amt) => "*144*4*6*" + amt + "#",
        hint: (amt) => "🟠 Composez le *144*4*6*" + amt + "# sur votre mobile Orange pour recevoir votre code OTP d\'autorisation."
      },
      {
        id: 'moov_bf',
        method: 'moov',
        name: 'Moov Money Burkina',
        badge: 'Flooz direct',
        desc: 'Validation Flooz Moov',
        logo: 'assets/operators/moov.png',
        hint: () => '🔵 Validez la demande sur votre compte Moov Money Burkina.'
      },
      {
        id: 'wave_bf',
        method: 'wave',
        name: 'Wave Burkina Faso',
        badge: '1% ou 0F',
        desc: 'Application Wave directe',
        logo: 'assets/operators/wave.svg',
        hint: () => '🌊 Ouvrez votre application Wave pour confirmer le paiement.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  ML: {
    countryName: 'Mali',
    prefix: '+223',
    flag: '🇲🇱',
    sample: '66 12 88 40',
    operators: [
      {
        id: 'orange_ml',
        method: 'orange',
        name: 'Orange Money Mali',
        badge: 'Instantané',
        desc: 'Validation push OM',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Validez le paiement sur votre compte Orange Money Mali.'
      },
      {
        id: 'moov_ml',
        method: 'moov',
        name: 'Moov Money (Malitel)',
        badge: 'Flooz direct',
        desc: 'Validation Moov Money',
        logo: 'assets/operators/moov.png',
        hint: () => '🔵 Validez le paiement sur votre compte Moov Mali.'
      },
      {
        id: 'wave_ml',
        method: 'wave',
        name: 'Wave Mali',
        badge: '1% ou 0F',
        desc: 'Appli Wave instantanée',
        logo: 'assets/operators/wave.svg',
        hint: () => '🌊 Validez sur votre application Wave Mali.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  NE: {
    countryName: 'Niger',
    prefix: '+227',
    flag: '🇳🇪',
    sample: '90 12 34 56',
    operators: [
      {
        id: 'airtel_ne',
        method: 'airtel',
        name: 'Airtel Money Niger',
        badge: 'Airtel Money',
        desc: 'Prompt USSD direct',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez le débit sur votre compte Airtel Money Niger.'
      },
      {
        id: 'moov_ne',
        method: 'moov',
        name: 'Moov Africa Niger',
        badge: 'Moov Africa',
        desc: 'Validation Flooz',
        logo: 'assets/operators/moovafrica.png',
        hint: () => '🔵 Confirmez la transaction sur votre compte Moov Niger.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  GN: {
    countryName: 'Guinée Conakry',
    prefix: '+224',
    flag: '🇬🇳',
    sample: '620 12 34 56',
    operators: [
      {
        id: 'orange_gn',
        method: 'orange',
        name: 'Orange Money Guinée',
        badge: 'Instantané',
        desc: 'Validation compte OM',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Validez le paiement sur votre compte Orange Money Guinée.'
      },
      {
        id: 'mtn_gn',
        method: 'mtn',
        name: 'MTN Mobile Money Guinée',
        badge: 'MoMo direct',
        desc: 'Prompt USSD MoMo',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Confirmez le prompt USSD sur votre mobile MTN Guinée.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  GH: {
    countryName: 'Ghana',
    prefix: '+233',
    flag: '🇬🇭',
    sample: '024 123 4567',
    operators: [
      {
        id: 'mtn_gh',
        method: 'mtn',
        name: 'MTN Mobile Money Ghana',
        badge: 'MoMo USSD',
        desc: 'USSD prompt validation',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Saisissez votre code PIN MTN MoMo sur votre mobile.'
      },
      {
        id: 'vodafone_gh',
        method: 'vodafone',
        name: 'Telecel (Vodafone Cash)',
        badge: 'Telecel Cash',
        desc: 'Validation directe',
        logo: 'assets/operators/vodafone.svg',
        hint: () => '🔴 Confirmez l\'opération sur votre compte Telecel Cash.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  NG: {
    countryName: 'Nigéria',
    prefix: '+234',
    flag: '🇳🇬',
    sample: '0803 123 4567',
    operators: [
      {
        id: 'opay_ng',
        method: 'opay',
        name: 'OPay Wallet',
        badge: 'Instantané',
        desc: 'Appli ou USSD instantané',
        logo: 'assets/operators/opay.svg',
        hint: () => '🟢 Ouvrez l\'application OPay ou validez l\'invite sur votre mobile.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire (Naira/USD)',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé en ligne',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  SL: {
    countryName: 'Sierra Leone',
    prefix: '+232',
    flag: '🇸🇱',
    sample: '076 123 456',
    operators: [
      {
        id: 'orange_sl',
        method: 'orange',
        name: 'Orange Money Sierra Leone',
        badge: 'Instantané',
        desc: 'Validation mobile',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Validez le paiement sur votre mobile Orange Sierra Leone.'
      },
      {
        id: 'afrimoney_sl',
        method: 'afrimoney',
        name: 'Afrimoney (Africell)',
        badge: 'Afrimoney',
        desc: 'Validation invite mobile',
        logo: 'assets/operators/afrimoney.png',
        hint: () => '🟣 Validez le débit sur votre compte Afrimoney Sierra Leone.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  CM: {
    countryName: 'Cameroun',
    prefix: '+237',
    flag: '🇨🇲',
    sample: '670 42 18 99',
    operators: [
      {
        id: 'orange_cm',
        method: 'orange',
        name: 'Orange Money Cameroun',
        badge: 'Instantané',
        desc: 'Validation Orange Money',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Confirmez le débit sur votre compte Orange Money Cameroun.'
      },
      {
        id: 'mtn_cm',
        method: 'mtn',
        name: 'MTN Mobile Money',
        badge: 'MoMo USSD',
        desc: 'Validation prompt USSD',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Un prompt USSD s\'affiche sur votre mobile MTN. Saisissez votre code PIN.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  GA: {
    countryName: 'Gabon',
    prefix: '+241',
    flag: '🇬🇦',
    sample: '077 12 34 56',
    operators: [
      {
        id: 'airtel_ga',
        method: 'airtel',
        name: 'Airtel Money Gabon',
        badge: 'Airtel Money',
        desc: 'Prompt USSD direct',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez le prompt Airtel Money sur votre mobile Gabon.'
      },
      {
        id: 'moov_ga',
        method: 'moov',
        name: 'Moov Africa Gabon',
        badge: 'Moov Africa',
        desc: 'Validation Flooz',
        logo: 'assets/operators/moovafrica.png',
        hint: () => '🔵 Confirmez l\'opération sur votre compte Moov Gabon.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  CG: {
    countryName: 'Congo-Brazzaville',
    prefix: '+242',
    flag: '🇨🇬',
    sample: '06 123 45 67',
    operators: [
      {
        id: 'airtel_cg',
        method: 'airtel',
        name: 'Airtel Money Congo',
        badge: 'Airtel Money',
        desc: 'Validation push USSD',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez le prompt Airtel Money sur votre mobile.'
      },
      {
        id: 'mtn_cg',
        method: 'mtn',
        name: 'MTN Mobile Money',
        badge: 'MoMo USSD',
        desc: 'Prompt USSD MTN',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Saisissez votre code PIN MTN sur votre mobile.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  CD: {
    countryName: 'Congo (RDC)',
    prefix: '+243',
    flag: '🇨🇩',
    sample: '081 234 5678',
    operators: [
      {
        id: 'airtel_cd',
        method: 'airtel',
        name: 'Airtel Money RDC',
        badge: 'Airtel Money',
        desc: 'Prompt USSD Airtel',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Saisissez votre PIN Airtel Money sur votre écran.'
      },
      {
        id: 'orange_cd',
        method: 'orange',
        name: 'Orange Money RDC',
        badge: 'Instantané',
        desc: 'Validation Orange RDC',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Confirmez la transaction sur votre compte Orange RDC.'
      },
      {
        id: 'mpesa_cd',
        method: 'mpesa',
        name: 'Vodacom M-Pesa RDC',
        badge: 'M-Pesa STK',
        desc: 'Validation instantanée M-Pesa',
        logo: 'assets/operators/mpesa.svg',
        hint: () => '🟢 Validez le débit M-Pesa sur votre mobile Vodacom RDC.'
      },
      {
        id: 'afrimoney_cd',
        method: 'afrimoney',
        name: 'Afrimoney (Africell RDC)',
        badge: 'Afrimoney',
        desc: 'Validation compte Afrimoney',
        logo: 'assets/operators/afrimoney.png',
        hint: () => '🟣 Validez le paiement sur votre compte Afrimoney RDC.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire (USD/CDF)',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  TD: {
    countryName: 'Tchad',
    prefix: '+235',
    flag: '🇹🇩',
    sample: '66 12 34 56',
    operators: [
      {
        id: 'airtel_td',
        method: 'airtel',
        name: 'Airtel Money Tchad',
        badge: 'Airtel Money',
        desc: 'Validation USSD',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez le prompt Airtel Money sur votre mobile Tchad.'
      },
      {
        id: 'moov_td',
        method: 'moov',
        name: 'Moov Africa Tchad',
        badge: 'Moov Africa',
        desc: 'Validation Flooz',
        logo: 'assets/operators/moovafrica.png',
        hint: () => '🔵 Confirmez l\'opération sur votre compte Moov Tchad.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  CF: {
    countryName: 'Centrafrique',
    prefix: '+236',
    flag: '🇨🇫',
    sample: '75 12 34 56',
    operators: [
      {
        id: 'orange_cf',
        method: 'orange',
        name: 'Orange Money Centrafrique',
        badge: 'Instantané',
        desc: 'Validation mobile',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Validez la transaction sur votre mobile Orange Centrafrique.'
      },
      {
        id: 'moov_cf',
        method: 'moov',
        name: 'Moov Africa Centrafrique',
        badge: 'Moov Africa',
        desc: 'Validation Flooz',
        logo: 'assets/operators/moovafrica.png',
        hint: () => '🔵 Confirmez le débit sur votre compte Moov Centrafrique.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  RW: {
    countryName: 'Rwanda',
    prefix: '+250',
    flag: '🇷🇼',
    sample: '078 123 4567',
    operators: [
      {
        id: 'airtel_rw',
        method: 'airtel',
        name: 'Airtel Money Rwanda',
        badge: 'Airtel Money',
        desc: 'Prompt USSD Airtel',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez le paiement sur votre mobile Airtel Rwanda.'
      },
      {
        id: 'mtn_rw',
        method: 'mtn',
        name: 'MTN MoMo Rwanda',
        badge: 'MoMo USSD',
        desc: 'Prompt USSD direct',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Saisissez votre code PIN MTN MoMo sur votre mobile.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  KE: {
    countryName: 'Kenya',
    prefix: '+254',
    flag: '🇰🇪',
    sample: '0712 345678',
    operators: [
      {
        id: 'airtel_ke',
        method: 'airtel',
        name: 'Airtel Money Kenya',
        badge: 'Airtel Money',
        desc: 'Prompt USSD Airtel',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez l\'ordre de débit Airtel Money sur votre mobile.'
      },
      {
        id: 'mpesa_ke',
        method: 'mpesa',
        name: 'Safaricom M-Pesa',
        badge: 'STK Push',
        desc: 'Prompt STK Push direct',
        logo: 'assets/operators/mpesa.svg',
        hint: () => '🟢 Entrez votre code PIN M-Pesa sur le prompt Safaricom de votre téléphone.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  TZ: {
    countryName: 'Tanzanie',
    prefix: '+255',
    flag: '🇹🇿',
    sample: '0754 123456',
    operators: [
      {
        id: 'airtel_tz',
        method: 'airtel',
        name: 'Airtel Money Tanzanie',
        badge: 'Airtel Money',
        desc: 'Prompt USSD Airtel',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Confirmez l\'opération sur votre mobile Airtel Tanzanie.'
      },
      {
        id: 'mpesa_tz',
        method: 'mpesa',
        name: 'Vodacom M-Pesa Tanzanie',
        badge: 'M-Pesa STK',
        desc: 'Prompt USSD M-Pesa',
        logo: 'assets/operators/mpesa.svg',
        hint: () => '🟢 Validez le débit sur votre mobile Vodacom M-Pesa.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  UG: {
    countryName: 'Ouganda',
    prefix: '+256',
    flag: '🇺🇬',
    sample: '0772 123456',
    operators: [
      {
        id: 'airtel_ug',
        method: 'airtel',
        name: 'Airtel Money Uganda',
        badge: 'Airtel Money',
        desc: 'Prompt USSD Airtel',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Confirmez la transaction sur votre compte Airtel Money Uganda.'
      },
      {
        id: 'mtn_ug',
        method: 'mtn',
        name: 'MTN Mobile Money Uganda',
        badge: 'MoMo direct',
        desc: 'Prompt USSD MoMo',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Saisissez votre code PIN MTN sur votre mobile Ouganda.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  ZM: {
    countryName: 'Zambie',
    prefix: '+260',
    flag: '🇿🇲',
    sample: '097 1234567',
    operators: [
      {
        id: 'airtel_zm',
        method: 'airtel',
        name: 'Airtel Money Zambia',
        badge: 'Airtel Money',
        desc: 'Prompt USSD Airtel',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Saisissez votre code secret Airtel Money.'
      },
      {
        id: 'mtn_zm',
        method: 'mtn',
        name: 'MTN MoMo Zambia',
        badge: 'MoMo direct',
        desc: 'Prompt USSD MoMo',
        logo: 'assets/operators/mtn.svg',
        hint: () => '🟡 Validez le paiement sur votre mobile MTN Zambia.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  MW: {
    countryName: 'Malawi',
    prefix: '+265',
    flag: '🇲🇼',
    sample: '099 123 4567',
    operators: [
      {
        id: 'airtel_mw',
        method: 'airtel',
        name: 'Airtel Money Malawi',
        badge: 'Airtel Money',
        desc: 'Validation mobile',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez la demande sur votre mobile Airtel Malawi.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  GM: {
    countryName: 'Gambie',
    prefix: '+220',
    flag: '🇬🇲',
    sample: '70 12 345',
    operators: [
      {
        id: 'afrimoney_gm',
        method: 'afrimoney',
        name: 'Afrimoney Gambie',
        badge: 'Afrimoney',
        desc: 'Validation compte Afrimoney',
        logo: 'assets/operators/afrimoney.png',
        hint: () => '🟣 Validez le paiement sur votre mobile Afrimoney Gambie.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  MG: {
    countryName: 'Madagascar',
    prefix: '+261',
    flag: '🇲🇬',
    sample: '034 12 345 67',
    operators: [
      {
        id: 'orange_mg',
        method: 'orange',
        name: 'Orange Money Madagascar',
        badge: 'Instantané',
        desc: 'Validation compte Orange',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Validez le paiement sur votre compte Orange Money Madagascar.'
      },
      {
        id: 'airtel_mg',
        method: 'airtel',
        name: 'Airtel Money Madagascar',
        badge: 'Airtel Money',
        desc: 'Prompt USSD direct',
        logo: 'assets/operators/airtel.svg',
        hint: () => '🔴 Validez la transaction sur votre compte Airtel Money Madagascar.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  MZ: {
    countryName: 'Mozambique',
    prefix: '+258',
    flag: '🇲🇿',
    sample: '84 123 4567',
    operators: [
      {
        id: 'mpesa_mz',
        method: 'mpesa',
        name: 'Vodacom M-Pesa Moçambique',
        badge: 'M-Pesa STK',
        desc: 'Validation M-Pesa',
        logo: 'assets/operators/mpesa.svg',
        hint: () => '🟢 Validez le débit sur votre compte Vodacom M-Pesa.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  ZA: {
    countryName: 'Afrique du Sud',
    prefix: '+27',
    flag: '🇿🇦',
    sample: '082 123 4567',
    operators: [
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire (ZAR/USD)',
        badge: '3D-Secure',
        desc: 'Paiement 3D-Secure',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  MA: {
    countryName: 'Maroc',
    prefix: '+212',
    flag: '🇲🇦',
    sample: '06 12 34 56 78',
    operators: [
      {
        id: 'orange_ma',
        method: 'orange',
        name: 'Orange Money Maroc',
        badge: 'Instantané',
        desc: 'Validation mobile',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Validez le paiement sur votre mobile Orange Maroc.'
      },
      {
        id: 'moov_ma',
        method: 'moov',
        name: 'Moov Africa (Maroc Telecom)',
        badge: 'Moov Africa',
        desc: 'Validation MT Cash',
        logo: 'assets/operators/moovafrica.png',
        hint: () => '🔵 Validez le paiement sur votre compte Moov Africa / MT Cash.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire CMI (Dirham/EUR)',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé 3D-Secure',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  EG: {
    countryName: 'Égypte',
    prefix: '+20',
    flag: '🇪🇬',
    sample: '010 1234 5678',
    operators: [
      {
        id: 'vodafone_eg',
        method: 'vodafone',
        name: 'Vodafone Cash Égypte',
        badge: 'Vodafone Cash',
        desc: 'Validation mobile',
        logo: 'assets/operators/vodafone.svg',
        hint: () => '🔴 Confirmez l\'opération sur votre mobile Vodafone Cash.'
      },
      {
        id: 'orange_eg',
        method: 'orange',
        name: 'Orange Cash Égypte',
        badge: 'Orange Cash',
        desc: 'Validation mobile',
        logo: 'assets/operators/orange.svg',
        hint: () => '🟠 Confirmez le débit sur votre compte Orange Cash.'
      },
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire (EGP/USD)',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé par carte',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  },
  FR: {
    countryName: 'France & International',
    prefix: '+33',
    flag: '🌍',
    sample: '06 12 34 56 78',
    operators: [
      {
        id: 'card',
        method: 'card',
        name: 'Carte Bancaire',
        badge: '3D-Secure',
        desc: 'Paiement sécurisé 3D Secure 2.0',
        logo: 'assets/operators/card.svg',
        hint: () => '💳 Saisissez vos coordonnées de carte bancaire pour régler.',
        isCard: true
      }
    ]
  }
};

function renderCountryOperators(countryCode) {
  const grid = document.getElementById('paymentMethodsGrid');
  if (!grid) return;

  const countryData = countryOperators[countryCode] || countryOperators.TG;
  grid.innerHTML = '';

  countryData.operators.forEach((op, index) => {
    const isFirst = index === 0;

    const card = document.createElement('div');
    card.className = 'payment-method-card group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between w-full ' + (isFirst ? 'active' : '');
    card.setAttribute('data-method', op.method);
    card.setAttribute('data-op-id', op.id);

    // Clean badge styling
    let badgeHtml = '';
    if (op.badge) {
      let badgeStyle = 'bg-blue-50 text-[#0052FF] border-blue-100';
      if (op.badge.includes('OTP')) {
        badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
      } else if (op.badge.includes('1%') || op.badge.includes('0F')) {
        badgeStyle = 'bg-cyan-50 text-cyan-800 border-cyan-200';
      } else if (op.badge.includes('3D') || op.badge.includes('Secure')) {
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
      } else if (op.badge.includes('USSD') || op.badge.includes('STK') || op.badge.includes('Flooz')) {
        badgeStyle = 'bg-blue-50 text-[#0052FF] border-blue-100';
      }
      badgeHtml = '<span class="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ' + badgeStyle + ' whitespace-nowrap shrink-0">' + op.badge + '</span>';
    }

    card.innerHTML = `
      <div class="flex items-center gap-3.5 min-w-0 flex-1">
        <!-- Logo Box: Slim, centered & never cropped -->
        <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center p-1.5 shadow-xs shrink-0 group-hover:scale-[1.02] transition-transform">
          <img src="${op.logo}" alt="${op.name}" class="w-full h-full object-contain" loading="lazy">
        </div>
        <!-- Info: Horizontal alignment, no wrapping -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap mb-0.5">
            <span class="text-xs sm:text-sm font-extrabold text-[#0F172A] tracking-tight truncate">${op.name}</span>
            ${badgeHtml}
          </div>
          <p class="text-[11px] sm:text-xs text-slate-500 font-medium leading-snug truncate">${op.desc}</p>
        </div>
      </div>
      <!-- Luxury Radio with Checkmark -->
      <div class="custom-radio w-5 h-5 rounded-full border-2 ${isFirst ? 'border-[#0052FF] bg-[#0052FF]' : 'border-slate-300 bg-white group-hover:border-slate-400'} flex items-center justify-center shrink-0 ml-3 transition-all duration-200 shadow-xs">
        <svg class="w-3 h-3 text-white radio-check ${isFirst ? '' : 'hidden'}" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => {
      selectOperator(op);
    });

    grid.appendChild(card);
  });

  // Automatically select first operator
  if (countryData.operators.length > 0) {
    selectOperator(countryData.operators[0]);
  }
}

function selectOperator(op) {
  CheckoutState.selectedOp = op;
  CheckoutState.method = op.method;

  const cards = document.querySelectorAll('.payment-method-card');
  const fieldsMobile = document.getElementById('fieldsMobileMoney');
  const fieldsCard = document.getElementById('fieldsCard');
  const hintEl = document.getElementById('operatorHintText');
  const otpContainer = document.getElementById('fieldOtpContainer');
  const otpUssdDisplay = document.getElementById('otpUssdCodeDisplay');
  const otpInstructionText = document.getElementById('otpInstructionText');
  const otpInput = document.getElementById('payerOtpCode');
  const phoneLabel = document.getElementById('phoneInputLabel');

  cards.forEach(card => {
    const isThis = card.getAttribute('data-op-id') === op.id;
    const check = card.querySelector('.radio-check');
    const radio = card.querySelector('.custom-radio');
    if (isThis) {
      card.classList.add('active');
      if (check) check.classList.remove('hidden');
      if (radio) {
        radio.classList.remove('border-slate-300', 'bg-white');
        radio.classList.add('border-[#0052FF]', 'bg-[#0052FF]');
      }
    } else {
      card.classList.remove('active');
      if (check) check.classList.add('hidden');
      if (radio) {
        radio.classList.add('border-slate-300', 'bg-white');
        radio.classList.remove('border-[#0052FF]', 'bg-[#0052FF]');
      }
    }
  });

  if (phoneLabel) {
    phoneLabel.textContent = 'Numéro de téléphone ' + op.name;
  }

  if (op.isCard) {
    if (fieldsMobile) fieldsMobile.classList.add('hidden');
    if (fieldsCard) fieldsCard.classList.remove('hidden');
    if (otpContainer) otpContainer.classList.add('hidden');
    if (otpInput) {
      otpInput.removeAttribute('required');
      otpInput.value = '';
    }
  } else {
    if (fieldsMobile) fieldsMobile.classList.remove('hidden');
    if (fieldsCard) fieldsCard.classList.add('hidden');

    const hintText = (typeof op.hint === 'function') ? op.hint(CheckoutState.amount) : op.hint;
    if (hintEl) hintEl.textContent = hintText || 'Validez la transaction sur votre appareil mobile.';

    // GESTION DU CHAMP CODE OTP POUR ORANGE MONEY
    if (op.requiresOtp) {
      if (otpContainer) otpContainer.classList.remove('hidden');
      if (otpInput) {
        otpInput.setAttribute('required', 'required');
      }
      const ussdSyntax = (typeof op.ussdTemplate === 'function') ? op.ussdTemplate(CheckoutState.amount) : op.ussdTemplate;
      if (otpUssdDisplay) otpUssdDisplay.textContent = ussdSyntax;
      if (otpInstructionText) {
        otpInstructionText.innerHTML = 'Composez le <code class="font-mono font-black text-xs bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded">' + ussdSyntax + '</code> sur votre mobile Orange pour générer votre code OTP, puis saisissez-le ci-dessous :';
      }
    } else {
      if (otpContainer) otpContainer.classList.add('hidden');
      if (otpInput) {
        otpInput.removeAttribute('required');
        otpInput.value = '';
      }
    }
  }

  updatePayButtonText();
}

function initCountrySelector() {
  const select = document.getElementById('countrySelect');
  const pickerBtn = document.getElementById('countryPickerBtn');
  const dropdown = document.getElementById('countryPickerDropdown');
  const searchInput = document.getElementById('countrySearchInput');
  const quickChips = document.getElementById('quickCountryChips');
  const countryList = document.getElementById('countryDropdownList');
  const chevron = document.getElementById('countryDropdownChevron');

  const selectedFlag = document.getElementById('selectedCountryFlagImg');
  const selectedName = document.getElementById('selectedCountryNameText');
  const selectedPrefix = document.getElementById('selectedCountryPrefixText');

  const phoneFlag = document.getElementById('phoneCountryFlagImg');
  const phonePrefix = document.getElementById('phoneCountryPrefixText');
  const phoneInput = document.getElementById('payerPhone');

  const summaryFlag = document.getElementById('summaryCountryFlagImg');
  const summaryName = document.getElementById('summaryCountryName');

  // Populate hidden select
  if (select) {
    select.innerHTML = '';
    for (const [code, data] of Object.entries(countryOperators)) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = data.countryName + ' (' + data.prefix + ')';
      select.appendChild(opt);
    }
  }

  // Define top countries for quick chips
  const topCountries = ['TG', 'CI', 'BJ', 'SN', 'CM', 'BF', 'ML', 'CD', 'FR'];
  if (quickChips) {
    quickChips.innerHTML = '';
    topCountries.forEach(code => {
      const data = countryOperators[code];
      if (!data) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'country-chip px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#0052FF] text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors border border-transparent hover:border-blue-200';
      chip.innerHTML = '<img src="' + getFlagUrl(code) + '" class="w-4 h-3 rounded object-cover shadow-xs border border-slate-200"> <span>' + data.countryName + '</span>';
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        applyCountry(code);
        closeDropdown();
      });
      quickChips.appendChild(chip);
    });
  }

  function renderDropdownItems(filter = '') {
    if (!countryList) return;
    countryList.innerHTML = '';
    const norm = filter.trim().toLowerCase();

    for (const [code, data] of Object.entries(countryOperators)) {
      const matchName = data.countryName.toLowerCase().includes(norm);
      const matchPrefix = data.prefix.toLowerCase().includes(norm);
      const matchCode = code.toLowerCase().includes(norm);
      const matchOps = data.operators.some(o => o.name.toLowerCase().includes(norm));

      if (norm && !matchName && !matchPrefix && !matchCode && !matchOps) continue;

      const isCurrent = CheckoutState.country === code;
      const row = document.createElement('div');
      row.className = 'country-item p-2.5 rounded-xl border border-transparent cursor-pointer flex items-center justify-between transition-colors ' + (isCurrent ? 'selected bg-blue-50/80 border-blue-200' : 'hover:bg-slate-50');

      const opsSummary = data.operators.map(o => o.name.split(' ')[0]).join(' • ');

      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <img src="${getFlagUrl(code)}" alt="${data.countryName}" class="w-6 h-4.5 rounded object-cover shadow-xs border border-slate-200 shrink-0">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs sm:text-sm font-bold text-[#0F172A] truncate">${data.countryName}</span>
              <span class="text-[11px] font-mono font-bold text-slate-500">${data.prefix}</span>
            </div>
            <span class="text-[10px] text-slate-400 block truncate font-medium">${opsSummary}</span>
          </div>
        </div>
        ${isCurrent ? '<span class="text-[#0052FF] font-black text-xs ml-2">✓</span>' : ''}
      `;

      row.addEventListener('click', () => {
        applyCountry(code);
        closeDropdown();
      });

      countryList.appendChild(row);
    }
  }

  function applyCountry(countryCode) {
    const data = countryOperators[countryCode] || countryOperators.TG;
    CheckoutState.country = countryCode;
    CheckoutState.prefix = data.prefix;
    CheckoutState.flag = data.flag;

    if (select) select.value = countryCode;

    // Trigger button
    if (selectedFlag) selectedFlag.src = getFlagUrl(countryCode);
    if (selectedName) selectedName.textContent = data.countryName;
    if (selectedPrefix) selectedPrefix.textContent = data.prefix;

    // Summary Column
    if (summaryFlag) summaryFlag.src = getFlagUrl(countryCode);
    if (summaryName) summaryName.textContent = data.countryName + ' (' + data.prefix + ')';

    // Phone input
    if (phoneFlag) phoneFlag.src = getFlagUrl(countryCode);
    if (phonePrefix) phonePrefix.textContent = data.prefix;
    if (phoneInput && data.sample) {
      phoneInput.value = data.sample;
      phoneInput.placeholder = data.sample;
    }

    renderCountryOperators(countryCode);
    renderDropdownItems(searchInput ? searchInput.value : '');
  }

  function openDropdown() {
    if (!dropdown) return;
    dropdown.classList.remove('hidden');
    if (chevron) chevron.classList.add('rotate-180');
    renderDropdownItems('');
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 60);
    }
  }

  function closeDropdown() {
    if (!dropdown) return;
    dropdown.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
  }

  if (pickerBtn) {
    pickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdown.classList.contains('hidden')) {
        openDropdown();
      } else {
        closeDropdown();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderDropdownItems(searchInput.value);
    });
    searchInput.addEventListener('click', (e) => e.stopPropagation());
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target) && pickerBtn && !pickerBtn.contains(e.target)) {
      closeDropdown();
    }
  });

  if (select) {
    select.addEventListener('change', () => {
      applyCountry(select.value);
    });
  }

  // Initial apply
  applyCountry(select?.value || 'TG');
}

function initPaymentMethodSelector() {
  // Géré dynamiquement par renderCountryOperators
}

function updatePayButtonText() {
  const btnText = document.getElementById('btnPayText');
  if (!btnText) return;
  const opName = CheckoutState.selectedOp?.name || 'Payer';
  btnText.textContent = 'Payer ' + new Intl.NumberFormat('fr-FR').format(CheckoutState.amount) + ' ' + CheckoutState.currency + ' avec ' + opName;
}

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('payerName');
    const emailInput = document.getElementById('payerEmail');
    const phoneInput = document.getElementById('payerPhone');
    const otpInput = document.getElementById('payerOtpCode');

    if (nameInput) CheckoutState.payer.name = nameInput.value.trim();
    if (emailInput) CheckoutState.payer.email = emailInput.value.trim();
    if (phoneInput) CheckoutState.payer.phone = phoneInput.value.trim();

    const op = CheckoutState.selectedOp || {
      id: CheckoutState.method,
      method: CheckoutState.method,
      name: CheckoutState.method.toUpperCase(),
      logo: 'assets/operators/card.svg'
    };

    // Validation OTP obligatoire pour Orange Money Burkina Faso & CI
    let otpVal = null;
    if (op.requiresOtp) {
      otpVal = otpInput ? otpInput.value.trim() : '';
      if (!otpVal || otpVal.length < 4) {
        alert("Veuillez composer le code USSD et saisir votre code d'autorisation OTP Orange Money (4 à 6 chiffres) pour valider le paiement.");
        if (otpInput) otpInput.focus();
        return;
      }
      CheckoutState.payer.otpCode = otpVal;
    }

    const btnSubmit = document.getElementById('btnSubmitPayment');
    const origBtnText = btnSubmit ? btnSubmit.innerHTML : '';
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="inline-block animate-spin mr-2">⟳</span> Connexion sécurisée à l'opérateur...`;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = CheckoutState.sessionId || urlParams.get('session_id') || urlParams.get('session') || urlParams.get('link') || urlParams.get('id') || 'demo';

      const res = await fetch(`/api/v1/pay/${encodeURIComponent(targetId)}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          payment_method: (op.method || CheckoutState.method || 'TMONEY').toUpperCase(),
          operator_id: op.id,
          country_code: CheckoutState.country,
          customer_phone: `${CheckoutState.prefix} ${CheckoutState.payer.phone}`,
          customer_name: CheckoutState.payer.name,
          customer_email: CheckoutState.payer.email,
          otp_code: otpVal
        })
      });

      const data = await res.json();

      if (data && data.success) {
        if (data.status === 'SUCCESS' && data.receipt) {
          CheckoutState.lastReceipt = data.receipt;
          triggerPaymentSuccess(data.receipt);
          return;
        }

        // Statut PENDING : affichage de l'écran d'attente
        CheckoutState.lastReceipt = null;
        startPendingValidation(data);
      } else {
        alert(data.error || "Impossible d'initier le paiement. Veuillez vérifier vos coordonnées.");
      }
    } catch (err) {
      console.warn('Submission error fallback:', err);
      startPendingValidation();
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = origBtnText;
      }
    }
  });
}

function startPendingValidation(apiResponse = null) {
  showScreen('screenPendingValidation');
  CheckoutState.currentScreen = 'pending';

  const op = CheckoutState.selectedOp || {
    id: CheckoutState.method,
    name: CheckoutState.method.toUpperCase(),
    logo: 'assets/operators/card.svg',
    hint: 'Validez la transaction sur votre appareil mobile.'
  };

  const iconEl = document.getElementById('pendingOperatorIcon');
  const targetPhoneEl = document.getElementById('pendingTargetPhone');
  const opNameEl = document.getElementById('pendingOperatorName');
  const promptDescEl = document.getElementById('pendingPromptDesc');
  const noticeEl = document.getElementById('pendingStatusNotice');

  if (noticeEl) noticeEl.classList.add('hidden');

  if (iconEl) {
    const isSvg = op.logo.endsWith('.svg');
    const isOrange = op.logo.includes('orange');
    const iconClass = isSvg ? 'w-full h-full object-contain p-2' : (isOrange ? 'w-full h-full object-contain p-1' : 'w-full h-full object-cover scale-[1.03]');
    iconEl.innerHTML = `<img src="${op.logo}" alt="${op.name}" class="${iconClass} rounded-2xl">`;
  }
  if (targetPhoneEl) targetPhoneEl.textContent = `${CheckoutState.prefix} ${CheckoutState.payer.phone}`;
  if (opNameEl) opNameEl.textContent = op.name;
  if (promptDescEl) {
    const hintText = (typeof op.hint === 'function') ? op.hint(CheckoutState.amount) : op.hint;
    promptDescEl.innerHTML = `${hintText || 'Un message push a été envoyé sur votre mobile.'}<br><span class="text-slate-500 font-normal">Numéro cible :</span> <strong class="text-[#0F172A] font-mono">${CheckoutState.prefix} ${CheckoutState.payer.phone}</strong>`;
  }

  // Lancement du compte à rebours de 58 secondes
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

    // Polling discret toutes les 4 secondes pour vérifier si l'utilisateur a confirmé sur son mobile
    if (CheckoutState.countdownSeconds % 4 === 0) {
      checkPaymentStatusSilently();
    }

    if (CheckoutState.countdownSeconds <= 0) {
      clearInterval(CheckoutState.countdownInterval);
      triggerPaymentFailed("Délai de validation expiré. Aucune confirmation reçue de votre opérateur.");
    }
  }, 1000);
}

async function checkPaymentStatusSilently() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = CheckoutState.sessionId || urlParams.get('session_id') || urlParams.get('session') || urlParams.get('link') || urlParams.get('id') || 'demo';

    const res = await fetch(`/api/v1/pay/${encodeURIComponent(targetId)}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' })
    });
    const data = await res.json();
    if (data && data.success && data.status === 'SUCCESS' && data.receipt) {
      CheckoutState.lastReceipt = data.receipt;
      triggerPaymentSuccess(data.receipt);
    }
  } catch {}
}

function triggerPaymentSuccess(receipt = null) {
  if (CheckoutState.countdownInterval) clearInterval(CheckoutState.countdownInterval);
  CheckoutState.currentScreen = 'success';
  showScreen('screenSuccess');

  const op = CheckoutState.selectedOp || {
    id: CheckoutState.method,
    name: CheckoutState.method.toUpperCase(),
    logo: 'assets/operators/card.svg'
  };

  const finalTxId = receipt?.id || `tx_live_${Math.random().toString(36).substring(2, 10)}`;
  const finalRef = receipt?.operator_reference || `VP-${(op.id || CheckoutState.method).toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 899999 + 100000)}`;
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
  const cData = countryOperators[CheckoutState.country] || countryOperators.TG;
  if (methodEl) {
    methodEl.innerHTML = '<span class="inline-flex items-center gap-1.5"><img src="' + op.logo + '" class="w-5 h-5 object-contain inline rounded"> ' + op.name + '</span>';
  }
  const countryEl = document.getElementById('successCountryLabel');
  if (countryEl) {
    countryEl.innerHTML = '<img src="' + getFlagUrl(CheckoutState.country) + '" class="w-4.5 h-3 rounded object-cover shadow-xs border border-slate-200 inline mr-1.5"> <span>' + cData.countryName + ' (' + cData.prefix + ')</span>';
  }
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
  // Bouton "J'ai validé sur mon téléphone" avec vérification réelle et sans validation fictive
  const btnFastForward = document.getElementById('btnFastForwardSuccess');
  if (btnFastForward) {
    btnFastForward.addEventListener('click', async () => {
      btnFastForward.disabled = true;
      const originalText = btnFastForward.innerHTML;
      btnFastForward.innerHTML = '<span class="inline-block animate-spin mr-2">⟳</span> Vérification en direct auprès de l\'opérateur...';

      const noticeEl = document.getElementById('pendingStatusNotice');
      const noticeTitle = document.getElementById('pendingStatusNoticeTitle');
      const noticeDesc = document.getElementById('pendingStatusNoticeDesc');

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetId = CheckoutState.sessionId || urlParams.get('session_id') || urlParams.get('session') || urlParams.get('link') || urlParams.get('id') || 'demo';

        const res = await fetch(`/api/v1/pay/${encodeURIComponent(targetId)}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check' })
        });
        const data = await res.json();

        if (data && data.success && data.status === 'SUCCESS' && data.receipt) {
          CheckoutState.lastReceipt = data.receipt;
          triggerPaymentSuccess(data.receipt);
          return;
        }

        // Si le statut est encore PENDING : avertir l'utilisateur avec bienveillance SANS faire de faux succès !
        if (noticeEl) {
          noticeEl.classList.remove('hidden');
          if (noticeTitle) noticeTitle.textContent = "Validation non encore reçue";
          if (noticeDesc) {
            noticeDesc.innerHTML = `${data.message || "L'opérateur mobile n'a pas encore confirmé la réception des fonds."}<br><span class="text-amber-900 font-bold block mt-1">Veuillez vérifier l'écran de votre téléphone, saisir votre code PIN secret, puis recliquer ici.</span>`;
          }
        }
      } catch (err) {
        console.warn('Confirmation error fallback:', err);
      } finally {
        btnFastForward.disabled = false;
        btnFastForward.innerHTML = originalText;
      }
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