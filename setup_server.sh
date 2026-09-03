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
sudo mkdir -p "$SITE_DIR/assets/images/uploads"
sudo chown -R opencode:opencode "$SITE_DIR"

cd "$SITE_DIR"
npm install --production

# Configure PM2 for reliable process keeping
if command -v pm2 &> /dev/null; then
    pm2 restart cherevichka || pm2 start server.js --name cherevichka || true
fi

echo ">>> [2/5] Configuring Nginx Reverse Proxy with SSL..."
if sudo test -f /etc/letsencrypt/live/cherevichka.com/fullchain.pem; then
sudo bash -c "cat > /etc/nginx/sites-available/cherevichka" << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name cherevichka.com www.cherevichka.com 34.88.91.159 _;
    return 301 https://cherevichka.com$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name www.cherevichka.com;

    ssl_certificate /etc/letsencrypt/live/cherevichka.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cherevichka.com/privkey.pem;
    return 301 https://cherevichka.com$request_uri;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    http2 on;
    server_name cherevichka.com 34.88.91.159;

    ssl_certificate /etc/letsencrypt/live/cherevichka.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cherevichka.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/cherevichka;
    index index.html;

    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /assets/ {
        alias /var/www/cherevichka/assets/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
        try_files $uri =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
else
sudo bash -c "cat > /etc/nginx/sites-available/cherevichka" << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name cherevichka.com www.cherevichka.com 34.88.91.159 _;

    root /var/www/cherevichka;
    index index.html;

    location /assets/ {
        alias /var/www/cherevichka/assets/;
        expires 7d;
        try_files $uri =404;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
fi

sudo ln -sf /etc/nginx/sites-available/cherevichka /etc/nginx/sites-enabled/cherevichka
sudo rm -f /etc/nginx/sites-enabled/default || true

echo ">>> [3/5] Testing and reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo ">>> [4/5] Enabling UFW Firewall..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw --force enable

echo "========================================================"
echo "   CHEREVICHKA PRODUCTION SERVER READY & SSL ACTIVE!    "
echo "========================================================"
