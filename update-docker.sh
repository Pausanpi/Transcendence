#!/bin/bash
# Script para actualizar el contenedor nginx con los cambios del frontend
# Uso (desde Ubuntu): ./update-docker.sh

echo "🐳 Rebuilding nginx container..."
docker compose build nginx

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🔄 Restarting nginx..."
docker compose up -d nginx --force-recreate

echo "✅ Done! Reload browser: https://localhost:8443"
echo "📝 Check logs: docker logs nginx --tail 20"
