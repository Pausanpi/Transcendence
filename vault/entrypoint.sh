#!/bin/bash
set -e

if [ ! -f "/vault/ssl/certificate.pem" ] || [ ! -f "/vault/ssl/private-key.pem" ]; then
    exit 1
fi

vault server -config=/vault/config.hcl &
VAULT_PID=$!

export VAULT_ADDR="https://127.0.0.1:8200"
export VAULT_SKIP_VERIFY=true

sleep 3

until curl -k -s $VAULT_ADDR/v1/sys/health > /dev/null; do
    sleep 2
done

VAULT_STATUS=$(curl -k -s $VAULT_ADDR/v1/sys/health)
INITIALIZED=$(echo "$VAULT_STATUS" | jq -r '.initialized')
SEALED=$(echo "$VAULT_STATUS" | jq -r '.sealed')

if [ "$INITIALIZED" = "false" ]; then
    INIT_OUTPUT=$(vault operator init -key-shares=1 -key-threshold=1 -format=json)
    ROOT_TOKEN=$(echo "$INIT_OUTPUT" | jq -r '.root_token')
    UNSEAL_KEY=$(echo "$INIT_OUTPUT" | jq -r '.unseal_keys_b64[0]')
    vault operator unseal "$UNSEAL_KEY"
    export VAULT_TOKEN="$ROOT_TOKEN"
else
    if [ "$SEALED" = "true" ]; then
        if [ ! -z "$VAULT_UNSEAL_KEY" ]; then
            vault operator unseal "$VAULT_UNSEAL_KEY"
        fi
    fi
    export VAULT_TOKEN="$VAULT_DEV_ROOT_TOKEN_ID"
fi

until vault status 2>/dev/null | grep -q "Sealed.*false"; do
    sleep 2
done

vault secrets enable -path=secret kv-v2
vault policy write app /vault/policies/policy.hcl

if [ ! -z "$GITHUB_CLIENT_ID" ] && [ ! -z "$GITHUB_CLIENT_SECRET" ]; then
    vault kv put secret/oauth/github client_id="$GITHUB_CLIENT_ID" client_secret="$GITHUB_CLIENT_SECRET"
fi

if [ ! -z "$SESSION_SECRET" ]; then
    vault kv put secret/session/config secret="$SESSION_SECRET"
fi

vault kv put secret/database/redis url="redis://redis:6379"

wait $VAULT_PID
