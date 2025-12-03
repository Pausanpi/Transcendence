#!/bin/sh

CERT_DIR="/etc/nginx/ssl"
CRT="$CERT_DIR/server.crt"
KEY="$CERT_DIR/server.key"

mkdir -p "$CERT_DIR"

if [ ! -f "$CRT" ] || [ ! -f "$KEY" ]; then
    echo "[WAF] SSL certificate not found — generating self-signed cert..."

    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$KEY" \
        -out "$CRT" \
        -subj "/C=ES/ST=Malaga/L=Malaga/O=transcendence/CN=localhost"

    chmod 644 "$CRT"
    chmod 600 "$KEY"

    echo "[WAF] Self-signed certificate generated."
else
    echo "[WAF] Existing SSL certificate found — using it."
fi

# Call the original entrypoint to set up ModSecurity
exec /docker-entrypoint.sh "$@"