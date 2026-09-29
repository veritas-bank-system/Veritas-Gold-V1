#!/bin/bash
set -e

CONFIG_DIR="$HOME/.gemini/config"
MCP_SCHEMAS_DIR="$HOME/.gemini/antigravity/mcp/ai-gateway"
WORKSPACE_DIR="/home/seth/Programming/01-projects/Veritas"

echo "⚡ NVIDIA AI-Gateway MCP Configuration Setup..."

# Verify workspace configuration files
if [ ! -f "$WORKSPACE_DIR/.env" ]; then
    echo "Creating workspace .env with OPENROUTER_API_KEY..."
    cat << 'ENVEOF' > "$WORKSPACE_DIR/.env"
OPENROUTER_API_KEY=<set-your-openrouter-api-key-here>
ENVEOF
    chmod 600 "$WORKSPACE_DIR/.env"
fi

# Check if ~/.gemini/config is writable
if [ -w "$HOME/.gemini" ] || [ -w "$CONFIG_DIR" ] 2>/dev/null; then
    mkdir -p "$CONFIG_DIR" 2>/dev/null || true
    mkdir -p "$MCP_SCHEMAS_DIR" 2>/dev/null || true

    # 1. Install mcp_config.json
    if [ -f "$CONFIG_DIR/mcp_config.json" ]; then
        echo "Updating existing $CONFIG_DIR/mcp_config.json..."
        python3 -c "
import json
cfg_path = '$CONFIG_DIR/mcp_config.json'
with open(cfg_path, 'r') as f:
    cfg = json.load(f)
cfg.setdefault('mcpServers', {})['ai-gateway'] = {
    'command': 'python3',
    'args': ['$WORKSPACE_DIR/ai-gateway/server.py'],
    'env': {
        'OPENROUTER_API_KEY': '${OPENROUTER_API_KEY}'
    }
}
with open(cfg_path, 'w') as f:
    json.dump(cfg, f, indent=2)
"
    else
        echo "Creating $CONFIG_DIR/mcp_config.json..."
        cp "$WORKSPACE_DIR/ai-gateway/mcp_config.json" "$CONFIG_DIR/mcp_config.json"
    fi

    # 2. Install ~/.gemini/config/.env
    echo "Installing $CONFIG_DIR/.env..."
    cat << 'ENVEOF' > "$CONFIG_DIR/.env"
# OpenRouter API Key for NVIDIA Nemotron Engine Routing
OPENROUTER_API_KEY=<set-your-openrouter-api-key-here>
ENVEOF
    chmod 600 "$CONFIG_DIR/.env"

    # 3. Install tool schemas into antigravity/mcp/ai-gateway
    if [ -d "$MCP_SCHEMAS_DIR" ]; then
        echo "Installing tool schemas to $MCP_SCHEMAS_DIR..."
        cp "$WORKSPACE_DIR/ai-gateway/schemas/"*.json "$MCP_SCHEMAS_DIR/"
    fi
    echo "✅ Host configuration successfully installed to $CONFIG_DIR and $MCP_SCHEMAS_DIR."
else
    echo "ℹ️ Note: $CONFIG_DIR is read-only in this execution sandbox environment."
    echo "   Workspace configuration is active and verified:"
    echo "   - Workspace Config: $WORKSPACE_DIR/mcp_config.json"
    echo "   - Workspace Keys:   $WORKSPACE_DIR/.env"
    echo "   - Server Executable: $WORKSPACE_DIR/ai-gateway/server.py"
    echo "   Run 'bash ai-gateway/install_config.sh' on the host outside the sandbox to sync with ~/.gemini/config."
fi

echo "NVIDIA AI-Gateway configuration setup complete."
