#!/usr/bin/env bash
# Setup script: creates a nyas.io project and initialises the schema
set -euo pipefail

API="https://api.nyas.io"

if [[ -z "${NYAS_TOKEN:-}" ]]; then
  echo "Error: NYAS_TOKEN environment variable not set."
  echo "Get your token from https://app.nyas.io (Profile → API Tokens)"
  exit 1
fi

PROJECT_NAME="${NYAS_PROJECT_NAME:-event-analytics}"

echo "Creating nyas.io project: $PROJECT_NAME ..."
RESPONSE=$(curl -s -X POST "$API/projects" \
  -H "Authorization: Bearer $NYAS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"project_name\": \"$PROJECT_NAME\"}")

echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Project ID:', d.get('id','?'))"

DB_URI=$(echo "$RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
opts = d.get('connection_options', [])
# Prefer transaction-mode pooling for high traffic
for o in opts:
    if 'transaction' in (o.get('pooling_mode') or '').lower():
        print(o['postgres_uri']); sys.exit(0)
# Fallback to first option
if opts:
    print(opts[0]['postgres_uri'])
")

if [[ -z "$DB_URI" ]]; then
  echo "Could not extract DATABASE_URL from response:"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "DATABASE_URL: $DB_URI"
echo ""
echo "Writing .env files..."

cat > ../backend/.env <<EOF
DATABASE_URL=$DB_URI
PORT=3001
BATCH_SIZE=500
BATCH_INTERVAL_MS=2000
CORS_ORIGIN=http://localhost:5173
EOF

cat > ../frontend/.env <<EOF
VITE_API_URL=http://localhost:3001
EOF

echo "Running schema migrations..."
psql "$DB_URI" -f schema.sql
echo ""
echo "Setup complete! Run:"
echo "  cd backend && npm install && npm run dev"
echo "  cd frontend && npm install && npm run dev"
