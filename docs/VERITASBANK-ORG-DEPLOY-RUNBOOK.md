# veritasbank.org — DNS + VPS Deployment Runbook

Goal: `https://veritasbank.org` serves the Veritas platform (Rust backend + built React
frontend) with the landing gate at `/`, Veritas Gold behind it, and the API on the same
origin.

Status of this runbook: **everything except DNS + the final server run can be prepared
locally.** The domain does not resolve yet and no VPS SSH access is configured in
`~/.ssh/config`, so steps 1 and 6 need the domain registrar and the VPS provider.

---

## 1. DNS (registrar side — needs registrar access)

Point the domain at the VPS IPv4 (and IPv6 if available):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A    | `@`     | `<VPS_IPV4>` | 3600 |
| A    | `www`   | `<VPS_IPV4>` | 3600 |
| AAAA | `@`     | `<VPS_IPV6>` (optional) | 3600 |
| AAAA | `www`   | `<VPS_IPV6>` (optional) | 3600 |

Verify after propagation:

```bash
dig +short veritasbank.org A
dig +short www.veritasbank.org A
```

## 2. VPS prerequisites (Ubuntu 22.04/24.04 assumed)

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
# Node 20:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 3. Get the code on the VPS

```bash
sudo mkdir -p /opt/veritas && sudo chown "$USER" /opt/veritas
git clone https://github.com/veritas-bank-system/Veritas-Gold-V1.git /opt/veritas/repo
cd /opt/veritas/repo
```

(The public `v1` remote carries the same main branch that is pushed from the
workstation; `backup` is private and can be used instead if the VPS has access.)

## 4. Build

`deploy_web_showcase.sh` builds both sides and starts the server in the foreground
(PORT defaults to 8080). For a supervised install run the build once, then use
systemd (step 5):

```bash
cd /opt/veritas/repo/frontend
npm ci
VITE_API_BASE=/api/v1 npm run build      # same-origin API: /api/v1/* + /health
cd ..
cargo build --release --bin icp-canister-suite --target-dir target
```

`VITE_API_BASE=/api/v1` is important: [frontend/src/services/api.ts](../frontend/src/services/api.ts)
resolves the API base to `/api/v1` when that env var is set, so the browser talks to the
same origin nginx proxies to the Rust server — no CORS, no second port.

## 5. systemd unit

`/etc/systemd/system/veritas.service`:

```ini
[Unit]
Description=Veritas Institutional Ledger (icp-canister-suite)
After=network.target

[Service]
User=veritas
WorkingDirectory=/opt/veritas/repo
Environment=PORT=127.0.0.1:8080
ExecStart=/opt/veritas/repo/target/release/icp-canister-suite
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd -r -s /usr/sbin/nologin veritas || true
sudo chown -R veritas:veritas /opt/veritas/repo
sudo systemctl daemon-reload
sudo systemctl enable --now veritas
curl -s http://127.0.0.1:8080/health   # {"status":"healthy",...}
```

> Check how the binary reads PORT/HOST before relying on `PORT=127.0.0.1:8080`:
> locally it is launched with `PORT=8080 HOST=0.0.0.0`. If it takes a bare port only,
> bind it to `127.0.0.1` via the host flag instead and keep it off the public interface —
> nginx terminates TLS and proxies.

## 6. nginx reverse proxy + TLS

`/etc/nginx/sites-available/veritasbank.org`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name veritasbank.org www.veritasbank.org;

    # ACME challenge for certbot
    location /.well-known/acme-challenge/ { root /var/www/html; }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 75s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/veritasbank.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d veritasbank.org -d www.veritasbank.org
```

Certbot rewrites the server block for TLS and installs a renewal timer. Test:

```bash
curl -s https://veritasbank.org/health          # healthy JSON
curl -s https://veritasbank.org/api/v1/settlement/telemetry | head -c 200
```

## 7. What the visitor sees

| URL | Behavior |
|-----|----------|
| `https://veritasbank.org/` | Landing gate: LOGIN hero + two desk cards (Veritas Gold live, Full System reserved) |
| click **LOGIN TO VERITAS GOLD** | Workspace chooser → institutional login → live workstations (backend on this VPS) |
| `/?entry=gold` | Skips the landing straight into the Gold flow |
| `/?login=true`, `/?mode=mobile`, `/?mode=tablet` | Legacy deep links — still work, also skip the gate |

## 8. Operational notes

- **Sandbox ledger resets on restart.** The backend keeps accounts/holdings in memory
  (genesis: 10 GOLD Alice, 100 USTB Bob). Restarting `veritas.service` resets to genesis.
- **Do not use `setup_and_run_vps.sh`** for this flow — it serves only the static dist
  with Python, no API, so the landing's LIVE badge and all live telemetry would fail.
- **Tunnel alternative** (no DNS yet): `cloudflared tunnel --url http://localhost:8080`
  on the VPS gives a temporary public URL to test the full flow before the A-record.
- **Full-system desk** is intentionally non-functional (RESERVED / COMING SOON).
