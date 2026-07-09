#!/bin/sh
set -eu

API_URL="${VITE_API_URL:-http://127.0.0.1:8000}"
ESCAPED_API_URL=$(printf '%s' "$API_URL" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  VITE_API_URL: "${ESCAPED_API_URL}"
};
EOF