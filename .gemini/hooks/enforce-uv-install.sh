#!/bin/bash
# Hook: Ensure uv is installed at session start
# Compatible with Claude Code and Gemini CLI
# Works on macOS, Linux, and Windows (via Git Bash)

set -euo pipefail

# Check if uv is available
uv_exists() {
    command -v uv &>/dev/null && return
    for p in "$HOME/.local/bin/uv" "$HOME/.cargo/bin/uv" "/usr/local/bin/uv"; do
        [ -x "$p" ] && return
    done
    return 1
}

uv_exists && exit 0

# Install uv
echo "Installing uv..." >&2
case "$(uname -s)" in
    Darwin|Linux)
        if ! curl -LsSf https://astral.sh/uv/install.sh | sh; then
            echo "Failed to install uv" >&2
            exit 1
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        if ! powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"; then
            echo "Failed to install uv" >&2
            exit 1
        fi
        ;;
    *)
        echo "Unsupported OS: $(uname -s)" >&2
        exit 1
        ;;
esac
