#!/bin/sh

CERT_DIR="/etc/nginx/ssl"
CRT="$CERT_DIR/server.crt"
KEY="$CERT_DIR/server.key"

# Create directory if missing
mkdir -p "$CERT_DIR"

if [ ! -f "$CRT" ] || [ ! -f "$KEY" ]; then
    echo "[NGINX] SSL certificate not found — generating self-signed cert..."

    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$KEY" \
        -out "$CRT" \
        -subj "/C=ES/ST=Malaga/L=Malaga/O=transcendence/CN=localhost"

    echo "[NGINX] Self-signed certificate generated."
else
    echo "[NGINX] Existing SSL certificate found — using it."
fi

# Start nginx normal entrypoint
exec "$@"
