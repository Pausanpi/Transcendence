#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="https://localhost:8443"

echo "======================================"
echo "   Transcendence Health Check"
echo "======================================"
echo ""

echo -e "${YELLOW}Containers:${NC}"
docker-compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null || docker-compose ps
echo ""

echo -e "${YELLOW}Services:${NC}"

check_service() {
    local name=$1
    local url=$2
    
    http_code=$(curl -sk --max-time 3 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$http_code" = "200" ]; then
        echo -e "  $name: ${GREEN}✓ OK${NC}"
    else
        echo -e "  $name: ${RED}✗ DOWN (HTTP $http_code)${NC}"
    fi
}

check_service "Gateway" "$BASE_URL/status"
check_service "Auth   " "$BASE_URL/api/auth/status"
check_service "Users  " "$BASE_URL/api/users/status"
check_service "Backend" "$BASE_URL/api/backend/status"

echo ""
echo -e "${YELLOW}Infrastructure:${NC}"

# Vault
vault_code=$(curl -sk --max-time 3 -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/vault-status" 2>/dev/null)
if [ "$vault_code" = "200" ]; then
    echo -e "  Vault : ${GREEN}✓ Connected${NC}"
else
    echo -e "  Vault : ${RED}✗ Error (HTTP $vault_code)${NC}"
fi

# Redis
redis_running=$(docker-compose ps redis 2>/dev/null | grep -c "Up")
if [ "$redis_running" -gt 0 ]; then
    echo -e "  Redis : ${GREEN}✓ Running${NC}"
else
    echo -e "  Redis : ${RED}✗ Down${NC}"
fi

# nginx-waf
waf_running=$(docker-compose ps nginx-waf 2>/dev/null | grep -c "Up")
if [ "$waf_running" -gt 0 ]; then
    echo -e "  WAF   : ${GREEN}✓ Running${NC}"
else
    echo -e "  WAF   : ${RED}✗ Down${NC}"
fi

echo ""
echo "======================================"