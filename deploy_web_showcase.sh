#!/usr/bin/env bash
# ==============================================================================
# 🏛️ VERITAS INSTITUTIONAL LEDGER — PRODUCTION WEB & SHOWCASE DEPLOYMENT SCRIPT
# ==============================================================================
# Purpose: Build and launch the complete institutional platform (Rust Canister
# Backend + React 18 TypeScript Frontend) as a unified, high-performance web service.
#
# Supported Environments: Localhost, Local Network (Wi-Fi/LAN), Cloud VPS, Docker.
# ==============================================================================

set -eo pipefail

PORT="${PORT:-8080}"
export PORT
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for Terminal Display
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${BOLD}${RED}"
echo "================================================================================"
echo "    🏛️  VERITAS INSTITUTIONAL LEDGER — PRODUCTION WEB SHOWCASE DEPLOYER         "
echo "================================================================================"
echo -e "${RESET}"

# 1. Dependency Checks
echo -e "${CYAN}🔍 [1/4] Checking System Prerequisites...${RESET}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js v18+${RESET}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ Error: npm is not installed.${RESET}"; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo -e "${RED}❌ Error: Rust & Cargo are not installed.${RESET}"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e "${RED}❌ Error: curl is required for the local health check.${RESET}"; exit 1; }

NODE_VER=$(node -v)
RUST_VER=$(rustc --version | awk '{print $1, $2}')
echo -e "   ✓ Found Node.js: ${GREEN}${NODE_VER}${RESET}"
echo -e "   ✓ Found Rust toolchain: ${GREEN}${RUST_VER}${RESET}"

# 2. Build Frontend (React + TypeScript + TradingView + Mobile)
echo -e "\n${CYAN}📦 [2/4] Building Institutional Frontend (Vite + TypeScript)...${RESET}"
cd frontend
echo "   Installing locked frontend dependencies (npm ci)..."
npm ci --silent
echo "   Compiling production bundle (npm run build)..."
npm run build
cd ..
echo -e "   ✓ Frontend built successfully into ${GREEN}frontend/dist${RESET}"

# 3. Build Backend Binary (High-Performance Release Mode)
echo -e "\n${CYAN}🦀 [3/4] Compiling Rust Canister Suite & DvP Settlement Engine...${RESET}"
CARGO_TARGET="${CARGO_TARGET_DIR:-target}"
echo "   Building release binary into ${CARGO_TARGET}..."
cargo build --release --bin icp-canister-suite --target-dir "$CARGO_TARGET"
BINARY_PATH="${CARGO_TARGET}/release/icp-canister-suite"
if [ ! -x "$BINARY_PATH" ]; then
    echo -e "${RED}❌ Error: Release build did not produce ${BINARY_PATH}.${RESET}"
    exit 1
fi
echo -e "   ✓ Binary ready: ${GREEN}${BINARY_PATH}${RESET}"

# 4. Detect IP Addresses for LAN & Mobile Presentation
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo -e "\n${CYAN}🚀 [4/4] Starting Veritas Institutional Web Server on 0.0.0.0:${PORT}...${RESET}"

# Graceful cleanup on Ctrl+C
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down Veritas Web Server...${RESET}"
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null || true
    fi
    exit 0
}
trap cleanup SIGINT SIGTERM

# Execute the Unified Web & Canister Engine
"$BINARY_PATH" &
SERVER_PID=$!

HEALTHY=0
for attempt in $(seq 1 30); do
    if curl --fail --silent "http://127.0.0.1:${PORT}/health" >/dev/null; then
        HEALTHY=1
        break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        break
    fi
    sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
    echo -e "${RED}❌ Error: Web server did not pass its health check at http://127.0.0.1:${PORT}/health.${RESET}"
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    exit 1
fi

echo -e "   ✓ Health check passed at http://127.0.0.1:${PORT}/health"
echo -e "\n${BOLD}${GREEN}================================================================================${RESET}"
echo -e "${BOLD}${GREEN}   ✨ VERITAS INSTITUTIONAL LEDGER IS LIVE ON THE WEB!                          ${RESET}"
echo -e "${BOLD}${GREEN}================================================================================${RESET}"
echo -e ""
echo -e "   🌐 ${BOLD}Primary Desktop Workstation:${RESET}   ${CYAN}http://localhost:${PORT}${RESET}"
echo -e "   📱 ${BOLD}Direct Mobile iPhone View:${RESET}     ${CYAN}http://localhost:${PORT}/?mode=mobile${RESET}"
echo -e "   📟 ${BOLD}Direct Tablet iPad View:${RESET}       ${CYAN}http://localhost:${PORT}/?mode=tablet${RESET}"
echo -e "   🚪 ${BOLD}Institutional Login Gateway:${RESET}   ${CYAN}http://localhost:${PORT}/?login=true${RESET}"
echo -e ""
echo -e "   📶 ${BOLD}Local Network / Phone / Wi-Fi Access:${RESET}"
echo -e "      • Mobile Phone:  ${YELLOW}http://${LAN_IP}:${PORT}/?mode=mobile${RESET}"
echo -e "      • Tablet/iPad:   ${YELLOW}http://${LAN_IP}:${PORT}/?mode=tablet${RESET}"
echo -e "      • Workstation:   ${YELLOW}http://${LAN_IP}:${PORT}${RESET}"
echo -e ""
echo -e "   🌍 ${BOLD}To Expose Publicly on the Internet for Showcases:${RESET}"
echo -e "      • Cloudflare Tunnel:  ${BOLD}cloudflared tunnel --url http://localhost:${PORT}${RESET}"
echo -e "      • Ngrok Tunnel:       ${BOLD}ngrok http ${PORT}${RESET}"
echo -e ""
echo -e "   ${BOLD}Press [Ctrl+C] to stop the server at any time.${RESET}"
echo -e "================================================================================\n"

# Wait for process
wait "$SERVER_PID"
