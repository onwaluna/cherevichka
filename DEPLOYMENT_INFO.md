# VPS Deployment & Server Configuration

## 1. Server Access Information
- **IP Address:** `34.88.91.159`
- **SSH Username:** `opencode`
- **SSH Key Location (Local):** `~/.ssh/id_ed25519_gcp` (fallback: `~/.ssh/id_rsa_gcp`)
- **OS:** Ubuntu Linux (x86_64)
- **Sudo:** Full passwordless root access enabled
- **Hostname:** `kiska-temka`

### Quick Connect Command
```bash
ssh -i ~/.ssh/id_ed25519_gcp opencode@34.88.91.159
```

### SSH Config (~/.ssh/config snippet)
```ssh-config
Host cherevichka-vps
    HostName 34.88.91.159
    User opencode
    IdentityFile ~/.ssh/id_ed25519_gcp
    IdentitiesOnly yes
```

---

## 2. Architecture for Standalone Hosting (100% Self-Hosted)

### Components
1. **Nginx Reverse Proxy & Web Server:**
   - Handles incoming HTTP (Port 80) and HTTPS (Port 443).
   - Serves static assets (`/assets`, `/data`, `/styles.css`, `index.html`, etc.) directly with gzip and optimal caching.
   - Proxies `/api/*` to the Node.js backend.
   - Handles SSL (Let's Encrypt / Cloudflare Origin Certificate).

2. **Node.js Production Server (`server.js` with PM2 / systemd):**
   - Independent REST API replacing Netlify Functions.
   - `GET /api/config` -> returns live site configuration from local JSON storage (`/var/www/cherevichka/data/live_config.json`).
   - `POST /api/config` -> saves live changes with password authentication (`fav256sobaka`).
   - `POST /api/upload` -> handles and saves uploaded media directly to `/var/www/cherevichka/uploads/`.
   - `GET /api/media?id=...` -> serves uploaded media files.

3. **System Daemon (systemd / PM2):**
   - Keeps the Node.js API server running 24/7 with automatic restart on crashes or reboots.

4. **Security & Firewall (UFW):**
   - Ports open: `22` (SSH), `80` (HTTP), `443` (HTTPS).
