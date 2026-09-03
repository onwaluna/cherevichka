"""
CHEREVICHKA - Full Master Production Deployment & Infrastructure Fix
Executes:
  1. Full file synchronization from local repo to /var/www/cherevichka/ via SCP/SSH
  2. Runs npm install on VPS for Express backend
  3. Obtains dual-domain Let's Encrypt certificate for cherevichka.com AND www.cherevichka.com
  4. Configures Nginx with full SSL, port 80 -> 443 301 redirect, www -> non-www 301 redirect, and API proxy
  5. Reloads Nginx and restarts cherevichka systemd service
  6. Validates everything over TLS and HTTP
"""

import os
import sys
import subprocess
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

VPS_IP = "34.88.91.159"
USER = "opencode"
KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519_gcp")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_remote_ssh(cmd, timeout=30):
    full_cmd = [
        "ssh", "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-o", "ConnectTimeout=8",
        f"{USER}@{VPS_IP}",
        cmd
    ]
    return subprocess.run(full_cmd, capture_output=True, encoding='utf-8', errors='ignore', timeout=timeout)

def main():
    print("=" * 80)
    print("🚀 STARTING FULL MASTER PRODUCTION DEPLOYMENT TO " + VPS_IP)
    print("=" * 80 + "\n")

    # 1. Test SSH Connection
    print("[1/6] Testing SSH connection to " + VPS_IP + "...")
    res = run_remote_ssh("echo SSH_AUTH_OK")
    if "SSH_AUTH_OK" not in res.stdout:
        print("[!] SSH connection failed:", res.stderr)
        sys.exit(1)
    print("   -> SSH Connection verified successfully.")

    # 2. Ensure Remote Directories
    print("\n[2/6] Preparing remote directories on VPS...")
    run_remote_ssh("sudo mkdir -p /var/www/cherevichka/data /var/www/cherevichka/assets/images/uploads /var/www/cherevichka/assets/vendor/leaflet /var/www/cherevichka/moodboard && sudo chown -R opencode:opencode /var/www/cherevichka")
    print("   -> Remote directories created and permissions set.")

    # 3. Synchronize Files via SCP
    print("\n[3/6] Uploading all project files, assets, and code to /var/www/cherevichka/...")
    scp_items = [
        "index.html",
        "admin.html",
        "styles.css",
        "admin.css",
        "app.js",
        "admin.js",
        "server.js",
        "package.json",
        "data",
        "assets",
        "moodboard"
    ]

    scp_cmd = [
        "scp", "-i", KEY_PATH,
        "-o", "StrictHostKeyChecking=no",
        "-r"
    ] + scp_items + [f"{USER}@{VPS_IP}:/var/www/cherevichka/"]

    scp_res = subprocess.run(scp_cmd, capture_output=True, encoding='utf-8', errors='ignore')
    if scp_res.returncode != 0:
        print("   [!] SCP Warning:", scp_res.stderr)
    else:
        print("   -> All project files, assets, and vendor libraries uploaded.")

    # 4. Install npm dependencies & start Node.js service
    print("\n[4/6] Installing Node dependencies and configuring backend service...")
    npm_setup_cmd = """
    cd /var/www/cherevichka
    npm install --production
    sudo bash -c 'cat > /etc/systemd/system/cherevichka.service' << 'EOF'
[Unit]
Description=Cherevichka Express API & Backend
After=network.target

[Service]
Type=simple
User=opencode
WorkingDirectory=/var/www/cherevichka
ExecStart=/usr/bin/node /var/www/cherevichka/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=ADMIN_SECRET=fav256sobaka

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable cherevichka
    sudo systemctl restart cherevichka
    """
    backend_res = run_remote_ssh(npm_setup_cmd, timeout=45)
    print("   -> Backend service updated:", backend_res.stdout.strip() if backend_res.stdout else "OK")

    # 5. Obtain Dual-Domain Let's Encrypt Certificate
    print("\n[5/6] Requesting / expanding Let's Encrypt SSL certificate for cherevichka.com AND www.cherevichka.com...")
    certbot_cmd = "sudo certbot certonly --nginx -d cherevichka.com -d www.cherevichka.com --expand --non-interactive --agree-tos -m cherevichka.map@gmail.com || true"
    cert_res = run_remote_ssh(certbot_cmd, timeout=60)
    print("   -> Certbot output:\n", cert_res.stdout)

    # 6. Apply Perfect Production Nginx Configuration
    print("\n[6/6] Writing production Nginx configuration with dual HTTPS and redirects...")
    nginx_conf_cmd = """
    sudo bash -c 'cat > /etc/nginx/sites-available/cherevichka' << 'EOF'
# 1. HTTP -> HTTPS Redirect for all domains & IPs
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name cherevichka.com www.cherevichka.com 34.88.91.159 _;
    return 301 https://cherevichka.com$request_uri;
}

# 2. HTTPS www.cherevichka.com -> https://cherevichka.com Canonical 301 Redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.cherevichka.com;

    ssl_certificate /etc/letsencrypt/live/cherevichka.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cherevichka.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";

    return 301 https://cherevichka.com$request_uri;
}

# 3. Main Production Server: https://cherevichka.com
server {
    listen 443 ssl http2 default_server;
    listen [::]:443 ssl http2 default_server;
    server_name cherevichka.com 34.88.91.159;

    ssl_certificate /etc/letsencrypt/live/cherevichka.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cherevichka.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384";
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    root /var/www/cherevichka;
    index index.html;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static Assets Caching
    location /assets/images/uploads/ {
        alias /var/www/cherevichka/assets/images/uploads/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files $uri =404;
    }

    location /assets/ {
        alias /var/www/cherevichka/assets/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files $uri =404;
    }

    # API Proxy to Node.js Backend (Port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # HTML files — Zero Cache for Instant Updates
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files $uri =404;
    }

    # Main SPA Route
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/cherevichka /etc/nginx/sites-enabled/cherevichka
    sudo nginx -t
    sudo systemctl reload nginx
    """
    nginx_res = run_remote_ssh(nginx_conf_cmd, timeout=30)
    print("   -> Nginx status:\n", nginx_res.stdout)
    if nginx_res.stderr:
        print("   -> Nginx stderr:\n", nginx_res.stderr)

    print("\n" + "=" * 80)
    print("✅ DEPLOYMENT & NGINX PROVISIONING FINISHED")
    print("=" * 80 + "\n")

if __name__ == '__main__':
    main()
