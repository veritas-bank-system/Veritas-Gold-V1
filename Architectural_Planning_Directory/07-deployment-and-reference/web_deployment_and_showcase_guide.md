# 🌐 Veritas Institutional Ledger — Production Web & Showcase Deployment Guide

## 📌 Executive Summary
This guide explains how to deploy and showcase the complete **Veritas Institutional Ledger** on the Web, a local network, or a public domain using the automated script: [`deploy_web_showcase.sh`](file:///home/seth/Documents/Project/BlockchainTest-Rust/deploy_web_showcase.sh).

---

## 🚀 1. Instant 1-Command Web Deployment

To compile and launch the entire stack (Rust Canister Suite Backend + React 18 TypeScript Frontend):

```bash
chmod +x deploy_web_showcase.sh
./deploy_web_showcase.sh
```

### What the Script Does Automatically:
1. ✅ **Prerequisite Validation**: Verifies Node.js (v18+), npm, and Rust toolchains.
2. ✅ **Frontend Production Build**: Executes `npm run build` to generate the production client bundle (`frontend/dist`) with TradingView Lightweight Charts, SVG touch finger-scrubber, and multi-persona state managers.
3. ✅ **Rust Release Compilation**: Builds the high-performance Axum & canister backend in `--release` mode.
4. ✅ **Single-Port Unified Serving**: Serves both the REST API endpoints (`/api/v1/*`) and the static web client fallback on port `8080`.
5. ✅ **LAN IP Auto-Discovery**: Automatically prints your Wi-Fi/LAN IP address so you can open the mobile app on a real smartphone or tablet immediately!

---

## 📱 2. Demonstration & Showcase URLs

Once running, navigate to these URLs depending on your demonstration context:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       VERITAS SHOWCASE URL NAVIGATION DIRECTORY                                        │
├──────────────────────────────┬────────────────────────────────────────────┬────────────────────────────────────────────┤
│ Demonstration Audience       │ URL Address                                │ Key Features to Show Off                   │
├──────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────┤
│ 🚪 Board & Regulators        │ http://localhost:8080/?login=true          │ • 8-Persona Institutional Gateway          │
│    (Executive Clearance)     │                                            │ • FIPS 140-2 Level 5 Attestation           │
│                              │                                            │ • SNB, JPMC, Debt Office, & FINMA Mandates │
├──────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────┤
│ 📱 Smartphone Presentation   │ http://localhost:8080/?mode=mobile         │ • Real-time touch finger-slide chart       │
│    (Mobile / iPhone Demo)    │ http://<YOUR_LAN_IP>:8080/?mode=mobile     │ • 1-Tap purchase order routing             │
│                              │                                            │ • Biometric 2-of-2 colleague approval      │
├──────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────┤
│ 📟 Tablet / iPad Showcase    │ http://localhost:8080/?mode=tablet         │ • Widescreen touch terminal                │
│    (iPad Executive View)     │ http://<YOUR_LAN_IP>:8080/?mode=tablet     │ • Full 8-group slide-out menu drawer       │
├──────────────────────────────┼────────────────────────────────────────────┼────────────────────────────────────────────┤
│ 💻 Trading Desk & Operations │ http://localhost:8080                      │ • 9-timeframe TradingView RWA Terminal     │
│    (Institutional Terminal)  │                                            │ • Sub-second atomic DvP settlement         │
│                              │                                            │ • Dutch Debt Auction bookbuilding          │
└──────────────────────────────┴────────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 🌍 3. Public Web Deployment Options (To Share with Global Investors)

### Option A: Free Instant Public URL via Cloudflare Tunnel (Zero Port-Forwarding)
To generate a temporary, encrypted public HTTPS URL in 10 seconds:

```bash
# In a separate terminal:
cloudflared tunnel --url http://localhost:8080
```
* Cloudflare provides a public link (e.g. `https://random-word-abc.trycloudflare.com`) that anyone worldwide can open on their laptop or mobile phone to test the platform live!

### Option B: Free Instant Public URL via Ngrok
```bash
ngrok http 8080
```

### Option C: Cloud VPS Deployment (Ubuntu / Debian / AWS EC2 / DigitalOcean)
```bash
# 1. Clone repository on VPS
git clone https://github.com/seelvupledevelop/ICPMoneta-VeritasGold.git
cd ICPMoneta-VeritasGold

# 2. Run the deployment script
PORT=80 ./deploy_web_showcase.sh
```

---

## 🧪 4. Investor Demonstration Script (Recommended Flow)

1. **Start with the Login Portal**: Open `/?login=true`, choose **Central Bank Governor (Swiss National Bank)**, and show sovereign policy authority.
2. **Execute 1-Click Acceptance Verification**: Go to `⚡ Live MVP Verification` and run the **6-Stage Test Suite** to prove that principal verification, ACTUS bond factory, Dutch auctions, atomic DvP, 2-of-2 multi-sig, and Merkle Proof-of-Reserve pass 100%.
3. **Switch to Mobile Presentation**: Open `/?mode=mobile` (or open on your actual smartphone via Wi-Fi IP), slide your finger across the gold chart, execute a buy order, and approve it as a colleague.
4. **Demonstrate 9 Extended Timeframes**: In the RWA Terminal, switch between `1H`, `24H`, and the macro `10Y` historical chart with G10 foreign exchange pairs (`EUR/USD`, `USD/JPY`, `EUR/JPY`, `EUR/CHF`).
