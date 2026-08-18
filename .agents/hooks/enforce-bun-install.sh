#!/bin/bash
# Hook: Ensure bun is installed at session start
# Compatible with Claude Code and Gemini CLI
# Works on macOS, Linux, and Windows (via Git Bash)

set -euo pipefail

# Check if bun is available
bun_exists() {
    command -v bun &>/dev/null && return
    for p in "$HOME/.bun/bin/bun" "/usr/local/bin/bun"; do
        [ -x "$p" ] && return
    done
    return 1
}

bun_exists && exit 0

# Install bun
echo "Installing bun..." >&2
case "$(uname -s)" in
    Darwin|Linux)
        if ! curl -fsSL https://bun.com/install | bash; then
            echo "Failed to install bun" >&2
            exit 1
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        if ! powershell -c "irm bun.sh/install.ps1|iex"; then
            echo "Failed to install bun" >&2
            exit 1
        fi
        ;;
    *)
        echo "Unsupported OS: $(uname -s)" >&2
        exit 1
        ;;
esac
