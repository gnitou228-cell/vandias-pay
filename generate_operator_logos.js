const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'assets', 'operators');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const svgs = {
  // 1. Wave
  'wave.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#1BA2FF"/>
  <circle cx="50" cy="50" r="34" fill="#008BE3"/>
  <path d="M30 52 C35 38, 42 38, 47 52 C52 66, 58 66, 64 52 C67 45, 71 45, 74 52" fill="none" stroke="#FFFFFF" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="50" cy="30" r="4.5" fill="#FFFFFF"/>
</svg>`,

  // 2. Orange Money
  'orange.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#FF7900"/>
  <rect x="18" y="68" width="64" height="14" rx="4" fill="#000000"/>
  <text x="50" y="79" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">MONEY</text>
  <circle cx="50" cy="40" r="18" fill="none" stroke="#FFFFFF" stroke-width="7"/>
  <path d="M42 40 L58 40" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
</svg>`,

  // 3. MTN MoMo
  'mtn.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#FFCC00"/>
  <ellipse cx="50" cy="42" rx="34" ry="22" fill="#002B49"/>
  <text x="50" y="48" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="16" fill="#FFCC00" text-anchor="middle" letter-spacing="0.5">MTN</text>
  <rect x="22" y="68" width="56" height="14" rx="7" fill="#002B49"/>
  <text x="50" y="79" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">MoMo</text>
</svg>`,

  // 4. Moov Money / Flooz
  'moov.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#005DAA"/>
  <circle cx="50" cy="50" r="36" fill="#004A88"/>
  <path d="M26 62 Q36 32 46 50 Q56 68 66 38" fill="none" stroke="#F37021" stroke-width="7" stroke-linecap="round"/>
  <text x="50" y="78" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">MOOV</text>
  <circle cx="68" cy="34" r="5" fill="#F37021"/>
</svg>`,

  // 5. Mixx by Yas / T-Money (Togo)
  'tmoney.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#E30613"/>
  <circle cx="50" cy="44" r="26" fill="#FFCC00"/>
  <text x="50" y="52" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#E30613" text-anchor="middle">T</text>
  <rect x="16" y="68" width="68" height="16" rx="8" fill="#111827"/>
  <text x="50" y="80" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="9" fill="#FFCC00" text-anchor="middle" letter-spacing="0.5">MIXX / YAS</text>
</svg>`,

  // 6. Celtiis Cash (Bénin)
  'celtiis.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="celtiisGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4F17A8"/>
      <stop offset="100%" stop-color="#00A3E0"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#celtiisGrad)"/>
  <circle cx="50" cy="40" r="22" fill="none" stroke="#FFFFFF" stroke-width="6"/>
  <path d="M42 40 L58 40" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>
  <rect x="20" y="68" width="60" height="14" rx="7" fill="#FFFFFF"/>
  <text x="50" y="79" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="10" fill="#4F17A8" text-anchor="middle" letter-spacing="0.5">CELTIIS</text>
</svg>`,

  // 7. Airtel Money (Congo, Gabon, Niger)
  'airtel.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#ED1C24"/>
  <path d="M34 56 C34 38, 66 38, 66 56" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
  <circle cx="50" cy="34" r="6" fill="#FFFFFF"/>
  <rect x="18" y="70" width="64" height="14" rx="4" fill="#FFFFFF"/>
  <text x="50" y="81" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9" fill="#ED1C24" text-anchor="middle">AIRTEL MONEY</text>
</svg>`,

  // 8. Free Money (Sénégal)
  'freemoney.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#E21A22"/>
  <text x="50" y="52" font-family="'Times New Roman', serif" font-style="italic" font-weight="900" font-size="28" fill="#FFFFFF" text-anchor="middle">free</text>
  <rect x="20" y="68" width="60" height="14" rx="4" fill="#111827"/>
  <text x="50" y="79" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">MONEY</text>
</svg>`,

  // 9. Carte Bancaire (Visa / Mastercard)
  'card.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#0F172A"/>
  <rect x="14" y="24" width="72" height="52" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
  <rect x="14" y="34" width="72" height="10" fill="#0F172A"/>
  <circle cx="38" cy="58" r="9" fill="#EB001B"/>
  <circle cx="50" cy="58" r="9" fill="#F79E1B" fill-opacity="0.85"/>
  <rect x="64" y="54" width="14" height="8" rx="2" fill="#00579F"/>
</svg>`,

  // 10. M-Pesa (Kenya, RDC, Tanzanie, Mozambique)
  'mpesa.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#00A859"/>
  <circle cx="50" cy="42" r="22" fill="#ED1C24"/>
  <text x="50" y="49" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">M</text>
  <rect x="16" y="68" width="68" height="16" rx="8" fill="#FFFFFF"/>
  <text x="50" y="80" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="10" fill="#00A859" text-anchor="middle" letter-spacing="1">M-PESA</text>
</svg>`,

  // 11. OPay (Nigéria)
  'opay.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#1DC779"/>
  <circle cx="50" cy="46" r="22" fill="#000000"/>
  <circle cx="50" cy="46" r="14" fill="#1DC779"/>
  <text x="50" y="82" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">OPay</text>
</svg>`,

  // 12. Vodafone Cash / Telecel (Ghana)
  'vodafone.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="22" fill="#E60000"/>
  <circle cx="50" cy="45" r="20" fill="#FFFFFF"/>
  <path d="M46 38 C43 45, 52 50, 48 57 C45 61, 39 56, 42 48" fill="#E60000"/>
  <rect x="18" y="70" width="64" height="14" rx="4" fill="#FFFFFF"/>
  <text x="50" y="81" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9" fill="#E60000" text-anchor="middle">CASH</text>
</svg>`
};

for (const [filename, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(dir, filename), content.trim(), 'utf8');
  console.log('Créé:', filename);
}
