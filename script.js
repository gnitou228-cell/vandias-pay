/**
 * AfriqPay API — Interactive Logic & Real-Time Components
 * High-Converting Fintech Experience
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMobileMenu();
  initHeroCheckout();
  initCodeTerminal();
  initBentoLinkGenerator();
  initFeeCalculator();
  initFaqAccordion();
  initSocialProofToast();
});

/* ========================================================
   1. NAVBAR SCROLL EFFECT
   ======================================================== */
function initNavbarScroll() {
  const header = document.getElementById('mainHeader');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 25) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ========================================================
   2. MOBILE NAVIGATION MENU
   ======================================================== */
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  const iconOpen = document.getElementById('menuIconOpen');
  const iconClose = document.getElementById('menuIconClose');
  const links = document.querySelectorAll('.mobile-nav-link');

  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      menu.classList.remove('hidden');
      iconOpen.classList.add('hidden');
      iconClose.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
    }
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
    });
  });
}

/* ========================================================
   3. HERO INTERACTIVE CHECKOUT & OPERATOR SELECTOR
   ======================================================== */
function initHeroCheckout() {
  const methodItems = document.querySelectorAll('.payment-method-item');
  const payBtn = document.getElementById('heroPayBtn');
  const payBtnText = document.getElementById('heroPayBtnText');
  const successMsg = document.getElementById('checkoutSuccessMessage');
  const simulatedPhone = document.getElementById('simulatedPhone');
  const phoneContainer = document.getElementById('phoneInputContainer');

  const operatorInfo = {
    wave: { name: 'Wave', prefix: '🇸🇳 +221', samplePhone: '77 842 19 04' },
    orange: { name: 'Orange Money', prefix: '🇨🇮 +225', samplePhone: '07 58 92 14 30' },
    mtn: { name: 'MTN MoMo', prefix: '🇨🇲 +237', samplePhone: '670 42 18 99' },
    card: { name: 'Carte Bancaire', prefix: '💳 N° Carte', samplePhone: '4242 •••• •••• 4242' }
  };

  let currentOperator = 'wave';

  methodItems.forEach(item => {
    item.addEventListener('click', () => {
      methodItems.forEach(el => {
        el.classList.remove('active');
        const dot = el.querySelector('.radio-dot');
        if (dot) dot.classList.add('hidden');
      });

      item.classList.add('active');
      const activeDot = item.querySelector('.radio-dot');
      if (activeDot) activeDot.classList.remove('hidden');

      const method = item.getAttribute('data-method');
      currentOperator = method;

      if (operatorInfo[method]) {
        payBtnText.textContent = `Payer 5 000 FCFA avec ${operatorInfo[method].name}`;
        if (simulatedPhone) {
          simulatedPhone.value = operatorInfo[method].samplePhone;
        }
      }
    });
  });

  // Simulated Pay action
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      const originalText = payBtnText.textContent;
      payBtn.disabled = true;
      payBtnText.textContent = "Validation sécurisée en cours...";
      payBtn.classList.add('opacity-90', 'cursor-wait');

      setTimeout(() => {
        payBtnText.textContent = "✓ Paiement Réussi !";
        payBtn.classList.remove('opacity-90', 'cursor-wait');
        payBtn.classList.add('bg-emerald-600');
        if (successMsg) {
          successMsg.classList.remove('hidden');
        }

        setTimeout(() => {
          payBtn.disabled = false;
          payBtnText.textContent = originalText;
          payBtn.classList.remove('bg-emerald-600');
          if (successMsg) {
            successMsg.classList.add('hidden');
          }
        }, 4000);
      }, 1100);
    });
  }

  // Hero Copy Code Button
  const copyHeroBtn = document.getElementById('copyHeroCodeBtn');
  const copyHeroText = document.getElementById('copyHeroCodeText');
  if (copyHeroBtn) {
    copyHeroBtn.addEventListener('click', () => {
      const codeSnippet = `import { AfriqPay } from '@afriqpay/node';
const client = new AfriqPay(process.env.AFRIQPAY_SECRET_KEY);

const session = await client.sessions.createPaymentSession({
  amount: 5000,
  currency: 'XOF',
  methods: ['wave', 'orange_money', 'mtn_momo', 'card'],
  customer: {
    name: 'Amadou Diallo',
    phone: '+221778421904'
  },
  success_url: 'https://votreboutique.com/success',
  webhook_url: 'https://api.votreboutique.com/webhooks/pay'
});`;
      navigator.clipboard.writeText(codeSnippet).then(() => {
        if (copyHeroText) copyHeroText.textContent = 'Copié !';
        copyHeroBtn.classList.add('text-emerald-400');
        setTimeout(() => {
          if (copyHeroText) copyHeroText.textContent = 'Copier';
          copyHeroBtn.classList.remove('text-emerald-400');
        }, 2000);
      });
    });
  }
}

/* ========================================================
   4. BENTO LINK GENERATOR SIMULATOR
   ======================================================== */
function initBentoLinkGenerator() {
  const prodInput = document.getElementById('demoLinkProduct');
  const amountInput = document.getElementById('demoLinkAmount');
  const preview = document.getElementById('generatedLinkPreview');
  const copyBtn = document.getElementById('copyGeneratedLinkBtn');

  if (!prodInput || !amountInput || !preview) return;

  const updatePreview = () => {
    const slug = prodInput.value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '_') || 'produit';
    const amount = amountInput.value ? `${Math.round(amountInput.value / 1000)}k` : '10k';
    preview.textContent = `https://afriqpay.link/pay_${slug}_${amount}`;
  };

  prodInput.addEventListener('input', updatePreview);
  amountInput.addEventListener('input', updatePreview);

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(preview.textContent).then(() => {
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'Copié !';
        copyBtn.classList.add('bg-emerald-500/40', 'text-white');
        setTimeout(() => {
          copyBtn.textContent = orig;
          copyBtn.classList.remove('bg-emerald-500/40', 'text-white');
        }, 2000);
      });
    });
  }
}

/* ========================================================
   5. CODE TERMINAL (NODE, CURL, PYTHON, PHP)
   ======================================================== */
function initCodeTerminal() {
  const tabButtons = document.querySelectorAll('.code-tab-btn');
  const copyBtn = document.getElementById('copyTabCodeBtn');
  const copyText = document.getElementById('copyTabCodeText');

  const panels = {
    nodejs: document.getElementById('codeNodejs'),
    curl: document.getElementById('codeCurl'),
    python: document.getElementById('codePython'),
    php: document.getElementById('codePhp')
  };

  let activeLang = 'nodejs';

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active');
      btn.classList.remove('text-slate-400');

      const lang = btn.getAttribute('data-lang');
      activeLang = lang;

      Object.keys(panels).forEach(key => {
        if (panels[key]) {
          if (key === lang) {
            panels[key].classList.remove('hidden');
          } else {
            panels[key].classList.add('hidden');
          }
        }
      });
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const activePanel = panels[activeLang];
      if (!activePanel) return;
      const code = activePanel.innerText;

      navigator.clipboard.writeText(code).then(() => {
        if (copyText) copyText.textContent = 'Copié !';
        copyBtn.classList.add('text-emerald-400');
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Copier le code';
          copyBtn.classList.remove('text-emerald-400');
        }, 2000);
      });
    });
  }
}

/* ========================================================
   6. CALCULATEUR INTERACTIF DE FRAIS
   ======================================================== */
function initFeeCalculator() {
  const slider = document.getElementById('volumeSlider');
  const volumeDisplay = document.getElementById('volumeDisplay');
  const netDisplay = document.getElementById('netAmountDisplay');
  const feeDisplay = document.getElementById('feeAmountDisplay');
  const savingsDisplay = document.getElementById('savingsAmountDisplay');

  if (!slider) return;

  const formatFCFA = (val) => {
    return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
  };

  const calculate = () => {
    const volume = parseInt(slider.value, 10);
    // AfriqPay fee is 2.5%
    const fee = Math.round(volume * 0.025);
    const net = volume - fee;
    // Traditional banks charge ~4.5% + fixed monthly maintenance fee ~ 35 000 FCFA
    const bankCost = Math.round(volume * 0.045 + 35000);
    const savings = Math.max(0, bankCost - fee);

    if (volumeDisplay) volumeDisplay.textContent = formatFCFA(volume);
    if (netDisplay) netDisplay.textContent = formatFCFA(net);
    if (feeDisplay) feeDisplay.textContent = formatFCFA(fee);
    if (savingsDisplay) savingsDisplay.textContent = `+ ${formatFCFA(savings)}`;
  };

  slider.addEventListener('input', calculate);
  calculate();
}

/* ========================================================
   7. FAQ ACCORDION (INTERACTIF & ACCESSIBLE)
   ======================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!questionBtn || !answer) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all other items
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.faq-question');
          const otherAns = other.querySelector('.faq-answer');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherAns) otherAns.classList.add('hidden');
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove('active');
        questionBtn.setAttribute('aria-expanded', 'false');
        answer.classList.add('hidden');
      } else {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
        answer.classList.remove('hidden');
      }
    });
  });
}

/* ========================================================
   8. SOCIAL PROOF LIVE TOASTS (DISCRET BOTTOM-LEFT)
   ======================================================== */
function initSocialProofToast() {
  const toast = document.getElementById('livePaymentToast');
  const title = document.getElementById('toastTitle');
  const subtitle = document.getElementById('toastSubtitle');

  if (!toast || !title || !subtitle) return;

  const events = [
    { amount: '15 000 FCFA', operator: 'Wave', location: 'Dakar, Sénégal', time: 'il y a 3s' },
    { amount: '45 000 FCFA', operator: 'Orange Money', location: 'Abidjan, Côte d\'Ivoire', time: 'il y a 7s' },
    { amount: '82 000 FCFA', operator: 'MTN MoMo', location: 'Douala, Cameroun', time: 'il y a 12s' },
    { amount: '25 000 FCFA', operator: 'Wave', location: 'Bamako, Mali', time: 'il y a 4s' },
    { amount: '60 000 FCFA', operator: 'Carte VISA', location: 'Cotonou, Bénin', time: 'il y a 15s' },
    { amount: '30 000 FCFA', operator: 'Moov Africa', location: 'Lomé, Togo', time: 'il y a 9s' }
  ];

  let index = 0;

  const showNextNotification = () => {
    const current = events[index];
    title.textContent = `Paiement reçu : ${current.amount}`;
    subtitle.textContent = `via ${current.operator} • ${current.location} (${current.time})`;

    // Slide up
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    // Slide down after 4.5s
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 4500);

    index = (index + 1) % events.length;
  };

  // Trigger first notification after 3 seconds, then every 11 seconds
  setTimeout(() => {
    showNextNotification();
    setInterval(showNextNotification, 11000);
  }, 3200);
}
