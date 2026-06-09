#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# Lendwell – Local environment setup
# ─────────────────────────────────────────────────────────
# Usage:
#   ./scripts/setup-env.sh                    # interactive
#   ./scripts/setup-env.sh --from .env         # copy from existing file
#   ./scripts/setup-env.sh --from .env --print  # print path & exit
# ─────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Detect the Electron userData directory for Lendwell
detect_userdata() {
  case "$(uname -s)" in
    Linux*)
      echo "${XDG_CONFIG_HOME:-$HOME/.config}/lendwell"
      ;;
    Darwin*)
      echo "$HOME/Library/Application Support/lendwell"
      ;;
    *)
      echo "Unsupported OS: $(uname -s)" >&2
      exit 1
      ;;
  esac
}

USERDATA_DIR="$(detect_userdata)"
ENV_FILE="$USERDATA_DIR/.env"

print_path() {
  echo "$ENV_FILE"
  exit 0
}

# Handle --print flag
if [[ "${1:-}" == "--print" ]]; then
  print_path
fi

# ── Create userData directory ────────────────────────────
mkdir -p "$USERDATA_DIR"

# ── Copy from existing .env ──────────────────────────────
if [[ "${1:-}" == "--from" ]]; then
  SRC="${2:-}"
  if [[ -z "$SRC" ]]; then
    echo "Usage: $0 --from <path-to-env-file>" >&2
    exit 1
  fi
  if [[ ! -f "$SRC" ]]; then
    echo "File not found: $SRC" >&2
    exit 1
  fi
  cp "$SRC" "$ENV_FILE"
  echo "[OK] Copied $(basename "$SRC") → $ENV_FILE"
  exit 0
fi

# ── Interactive setup ────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existing .env found at $ENV_FILE"
  echo "We'll create one now."
  echo ""
fi

ask() {
  local var="$1"
  local prompt="$2"
  local default="${3:-}"
  local val
  read -r -p "$prompt${default:+ [$default]}: " val
  echo "${val:-$default}"
}

SUPABASE_URL=$(ask "SUPABASE_URL"    "Supabase project URL"       "")
SUPABASE_ANON_KEY=$(ask "SUPABASE_ANON_KEY" "Supabase anon key"  "")
SUPABASE_SERVICE_ROLE_KEY=$(ask "SUPABASE_SERVICE_ROLE_KEY" "Supabase service-role key (optional)" "")

POWERSYNC_URL=$(ask "POWERSYNC_URL"  "PowerSync URL (optional)"   "")
FLW_PUBLIC_KEY=$(ask "FLW_PUBLIC_KEY" "Flutterwave public key (optional)" "")
FLW_SECRET_KEY=$(ask "FLW_SECRET_KEY" "Flutterwave secret key (optional)" "")
COMMS_SDK_USERNAME=$(ask "COMMS_SDK_USERNAME" "EgoSMS username (optional)" "")
COMMS_SDK_API_KEY=$(ask "COMMS_SDK_API_KEY"   "EgoSMS API key (optional)"   "")
SACCO_NAME=$(ask "SACCO_NAME"        "SACCO name (optional)"      "My SACCO")
APP_URL=$(ask "APP_URL"              "App URL (optional)"         "")

cat > "$ENV_FILE" <<-EOF
# ── Lendwell local config ──
# Created by setup-env.sh on $(date)

SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

POWERSYNC_URL=$POWERSYNC_URL

FLW_PUBLIC_KEY=$FLW_PUBLIC_KEY
FLW_SECRET_KEY=$FLW_SECRET_KEY

COMMS_SDK_USERNAME=$COMMS_SDK_USERNAME
COMMS_SDK_API_KEY=$COMMS_SDK_API_KEY

SACCO_NAME=$SACCO_NAME
APP_URL=$APP_URL
EOF

echo ""
echo "[OK] Wrote $ENV_FILE"
echo ""

# ── Guidance ─────────────────────────────────────────────
echo "──────────────────────────────────────────────────────────"
echo " Next steps:"
echo ""
echo "  1. Build & run the app once to seed the secure vault:"
echo ""
echo "     npm run electron:compile"
echo "     npx electron . --seed-vault \"$ENV_FILE\""
echo ""
echo "  2. Or run in development mode (reads .env.local):"
echo ""
echo "     cp \"$ENV_FILE\" .env.local"
echo "     npm run electron:dev"
echo ""
echo " The app will use these local env vars instead of the"
echo " online config server."
echo "──────────────────────────────────────────────────────────"
