#!/bin/bash
# ==============================================================================
# CHEREVICHKA - Automated Production Server Setup for Google Cloud VM
# ==============================================================================
set -e

echo ">>> [1/5] Updating packages and installing Node.js, Nginx, UFW, Git, rsync..."
sudo apt-get update -y
sudo apt-get install -y curl ufw nginx git rsync

# Install Node.js (NodeSource LTS v20) if not installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo ">>> Installed Node version: $(node -v)"
echo ">>> Installed NPM version: $(npm -v)"

# Setup Directory
SITE_DIR="/var/www/cherevichka"
sudo mkdir -p "$SITE_DIR/data"
sudo mkdir -p "$SITE_DIR/uploads"
sudo chown -R $USER:$USER "$SITE_DIR"

echo ">>> [2/5] Creating Systemd Service (cherevichka.service)..."
sudo bash -c "cat > /etc/systemd/system/cherevichka.service" << 'EOF'
[Unit]
Description=Cherevichka Node.js Production Web Server & API
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

echo ">>> [3/5] Configuring Nginx Reverse Proxy..."
sudo bash -c "cat > /etc/nginx/sites-available/cherevichka" << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name cherevichka.com www.cherevichka.com 34.88.91.159 _;

    client_max_body_size 25M;
    root /var/www/cherevichka;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/json image/svg+xml;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static Assets Caching
    location /assets/ {
        alias /var/www/cherevichka/assets/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Uploaded Media Caching
    location /uploads/ {
        alias /var/www/cherevichka/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API Proxy to Node.js Backend
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
    }

    # Frontend Static SPA Route
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/cherevichka /etc/nginx/sites-enabled/cherevichka
sudo nginx -t
sudo systemctl reload nginx

echo ">>> [4/5] Configuring Firewall (UFW)..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable || true

echo ">>> [5/5] Reloading and starting systemd daemon..."
sudo systemctl daemon-reload
sudo systemctl enable cherevichka
sudo systemctl restart cherevichka || true

echo "========================================================"
echo "   CHEREVICHKA SERVER SETUP COMPLETED SUCCESSFULLY!"
echo "========================================================"
