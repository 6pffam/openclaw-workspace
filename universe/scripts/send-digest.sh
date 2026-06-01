#!/bin/bash
# Universe Interlock Digest — runs at 08:00 Zurich
# Fetches the digest from the running Universe app and posts to Discord webhook.
#
# Usage: ./send-digest.sh
# Install cron: bash scripts/install-cron.sh

set -e

UNIVERSE_URL="${UNIVERSE_URL:-http://localhost:3001}"
ENV_FILE="$(dirname "$(dirname "$(realpath "$0")")")/.env.local"
LOG_FILE="$HOME/.openclaw/workspace/universe/logs/digest.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" | tee -a "$LOG_FILE"
}

# Load DIGEST_CRON_SECRET from .env.local
if [ -f "$ENV_FILE" ]; then
  DIGEST_CRON_SECRET=$(grep '^DIGEST_CRON_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
fi

if [ -z "$DIGEST_CRON_SECRET" ]; then
  log "ERROR: DIGEST_CRON_SECRET not found in $ENV_FILE"
  exit 1
fi

CRON_HEADER="X-Cron-Secret: $DIGEST_CRON_SECRET"

log "=== Interlock digest starting ==="

# Check if Universe is running
if ! curl -sf --max-time 5 "$UNIVERSE_URL/api/auth/status" > /dev/null 2>&1; then
  log "ERROR: Universe app not running at $UNIVERSE_URL"
  log "Start it with: cd ~/.openclaw/workspace/universe && npm run dev"
  exit 1
fi

# Fetch digest text (cron secret bypasses session auth)
log "Fetching digest…"
DIGEST_RESP=$(curl -sf --max-time 10 \
  -H "$CRON_HEADER" \
  "$UNIVERSE_URL/api/interlocks?mode=digest")

if [ -z "$DIGEST_RESP" ]; then
  log "ERROR: Empty response from /api/interlocks?mode=digest"
  exit 1
fi

DIGEST_TEXT=$(echo "$DIGEST_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('text',''))" 2>/dev/null)

if [ -z "$DIGEST_TEXT" ]; then
  log "ERROR: Could not extract digest text. Response: $DIGEST_RESP"
  exit 1
fi

log "Digest fetched (${#DIGEST_TEXT} chars). Posting to Discord…"

# Send via Universe's notification endpoint (also uses cron secret)
SEND_RESP=$(curl -sf --max-time 10 \
  -X POST "$UNIVERSE_URL/api/discord/digest" \
  -H "Content-Type: application/json" \
  -H "$CRON_HEADER" \
  -d "{\"text\": $(echo "$DIGEST_TEXT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")

log "Send response: $SEND_RESP"
log "=== Digest complete ==="
