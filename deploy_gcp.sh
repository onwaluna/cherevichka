#!/bin/bash
set -e

echo "=== 1. Updating Nginx with Canonical Redirect for WWW ==="
cat << 'EOF' > /tmp/cherevichka_nginx.conf
# 1. Canonical Redirect www -> non-www
server {
    listen 80;
    listen [::]:80;
    server_name www.cherevichka.com;
    return 301 https://cherevichka.com$request_uri;
}

# 2. Main Production HTTPS Server (cherevichka.com)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;

    ssl_certificate /etc/nginx/ssl/cherevichka.crt;
    ssl_certificate_key /etc/nginx/ssl/cherevichka.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    server_name cherevichka.com 34.88.91.159 _;

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

    # Uploads & Static Assets Cache
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

    # API Proxy to Express Backend (Port 3000)
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

    # HTML files — Zero Cache for Instant Live Sync
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        try_files $uri =404;
    }

    # Main Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo mv /tmp/cherevichka_nginx.conf /etc/nginx/sites-available/cherevichka
sudo ln -sf /etc/nginx/sites-available/cherevichka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
echo "=== NGINX REDIRECT APPLIED ==="
