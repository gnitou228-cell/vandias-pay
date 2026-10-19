# ⚡ VANDIAS PAY API

> **La passerelle de paiement tout-en-un et infrastructure multi-devises pour plus de 25 pays en Afrique et à l'international.**

![VandiasPay Banner](https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80)

[![Status](https://img.shields.io/badge/Status-Production%20Ready-5846F6)](http://localhost:4173)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com)

---

## 🌍 Présentation

**VandiasPay** est une solution Fintech moderne permettant aux startups, créateurs, e-commerçants et éditeurs de logiciels d'encaisser des paiements partout en Afrique et depuis la diaspora avec une **API unifiée** et des **Liens de paiement instantanés**.

### 📱 Moyens de Paiement Pris en Charge :
- **Wave Mobile Money** (Sénégal, Côte d'Ivoire, Mali, Gambie...)
- **Orange Money** (Sénégal, Côte d'Ivoire, Cameroun, Mali, Burkina Faso, Guinée...)
- **MTN MoMo** (Côte d'Ivoire, Cameroun, Bénin, Ghana, Rwanda, Ouganda...)
- **Moov Africa / Flooz** (Togo, Bénin, Côte d'Ivoire, Burkina Faso, Centrafrique...)
- **Cartes Bancaires VISA & Mastercard** (Paiement diaspora avec 3D Secure 2.0)

---

## 📁 Architecture du Projet

```text
VANDIAS-PAY/
├── index.html            # Landing Page SaaS moderne à très haute conversion
├── styles.css            # Feuille de style principale (Design System clair & violet #5846F6)
├── script.js             # Interactions de la landing page (simulateurs, FAQ, calculateur)
├── dashboard.html        # Tableau de bord Marchand complet (15 onglets, 25+ wallets)
├── dashboard.css         # Styles du dashboard (Design SaaS épuré)
├── dashboard.js          # Moteur interactif du tableau de bord
├── checkout.html         # Page de paiement hébergée (Hosted Checkout - 4 écrans d'état)
├── checkout.css          # Styles du checkout avec réassurance SSL
├── checkout.js           # Machine à états du paiement (validation 60s, reçus officiels)
├── server.js             # Serveur API Express autonome (Auth, Marchands, Dev API, Checkout)
├── schema.sql            # Schéma PostgreSQL pour Supabase (5 tables, RLS, triggers, seed)
├── package.json          # Dépendances Node.js
└── .env.example          # Modèle des variables d'environnement
```

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Copiez `.env.example` en `.env` :
```bash
cp .env.example .env
```
Renseignez vos clés Supabase si vous souhaitez connecter la base cloud. Le serveur inclut également un **Memory Store de secours** pour démarrer immédiatement en local.

### 3. Lancer le serveur
```bash
npm start
```
- **Landing Page** : [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Tableau de Bord** : [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)
- **Hosted Checkout** : [http://localhost:3000/checkout.html](http://localhost:3000/checkout.html)
- **Statut API** : [http://localhost:3000/api/v1/status](http://localhost:3000/api/v1/status)

---

## ⚡ Exemple d'Intégration Développeur (API REST)

### Créer une session de paiement :
```bash
curl -X POST http://localhost:3000/api/v1/checkout-sessions \
  -H "Authorization: Bearer sk_live_vdp_9f81a7b6c5d4e3f2a1b0c9d8" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "XOF",
    "title": "Abonnement Pro",
    "customer_phone": "+221770000000",
    "customer_name": "Amadou Diallo",
    "redirect_url": "https://votresite.com/confirmation"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "id": "sess_89a421b0",
  "checkout_url": "http://localhost:3000/checkout.html?session=sess_89a421b0",
  "amount": 10000,
  "fee": 250,
  "net": 9750,
  "currency": "XOF",
  "status": "PENDING"
}
```

---

## 🔒 Sécurité & Webhooks

Tous les événements de paiement (`payment.success`) envoient un Webhook HTTP POST signé cryptographiquement en **HMAC-SHA256** avec l'en-tête :
```http
X-Vandias-Signature: t=1729334,v1=9a2b8f...
```

---

## 📄 Licence
Ce projet est sous licence MIT. Développé pour propulser l'économie numérique africaine.
