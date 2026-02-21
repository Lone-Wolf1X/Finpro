#!/bin/bash
# Create 5 test tenants with different plans

# 1. Login as Super Admin to get Token
echo "Logging in as Super Admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{
    "email": "admin@finpro.com",
    "password": "admin123"
}')

# Extract Token (using python for reliability as jq might not be present)
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo "Login failed! Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "Login successful! Token acquired."
echo ""

# Function to create tenant
create_tenant() {
    NAME=$1
    SUBDOMAIN=$2
    EMAIL=$3
    PLAN=$4

    echo "Creating '$NAME' ($PLAN)..."
    curl -s -X POST http://localhost:8080/api/admin/tenants \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"companyName\": \"$NAME\",
        \"subdomain\": \"$SUBDOMAIN\",
        \"adminEmail\": \"$EMAIL\",
        \"adminPassword\": \"pass\",
        \"plan\": \"$PLAN\"
    }"
    echo ""
}

create_tenant "Tiny Traders" "tiny-101" "admin@tiny.com" "BASIC"
create_tenant "Small Shop" "small-101" "admin@small.com" "BASIC"
create_tenant "Growth Inc" "growth-102" "admin@growth.com" "PRO"
create_tenant "Mega Corp" "mega-103" "admin@mega.com" "ENTERPRISE"
create_tenant "Global Tech" "global-103" "admin@global.com" "ENTERPRISE"
