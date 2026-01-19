#!/bin/sh
set -e

export VAULT_ADDR=https://localhost:8200
export VAULT_SKIP_VERIFY=true

echo "Starting Vault..."
vault server -config=/vault/config.hcl &
VAULT_PID=$!

echo "Waiting for Vault API..."
for i in $(seq 1 15); do
  if curl -sk $VAULT_ADDR/v1/sys/health >/dev/null; then
    break
  fi
  sleep 2
done

STATUS=$(curl -sk $VAULT_ADDR/v1/sys/health)
INITIALIZED=$(echo "$STATUS" | jq -r .initialized)
SEALED=$(echo "$STATUS" | jq -r .sealed)

echo "Vault status → initialized=$INITIALIZED sealed=$SEALED"

if [ "$INITIALIZED" = "false" ]; then
  echo ""
  echo "⚠️  Vault is NOT initialized"
  echo "Run once:"
  echo "docker exec -it vault vault operator init -key-shares=1 -key-threshold=1"
  echo ""
  wait "$VAULT_PID"
  exit 0
fi

if [ "$SEALED" = "true" ]; then
  if [ -z "$VAULT_UNSEAL_KEY" ]; then
    echo "ERROR: VAULT_UNSEAL_KEY not set"
    exit 1
  fi

  echo "Unsealing Vault..."
  vault operator unseal "$VAULT_UNSEAL_KEY"
fi

echo "✓ Vault ready"

wait "$VAULT_PID"
