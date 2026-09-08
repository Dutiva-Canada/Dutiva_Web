# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
Hook: Intercept bare python commands and rewrite them to a safe runner.

Compatible with Claude Code (PreToolUse) and Gemini CLI (BeforeTool).

On Windows, Application Control / Smart App Control often blocks the unsigned
python.exe trampolines that `uv run` drops under %LOCALAPPDATA%\\uv\\cache.
Those failures surface as "Failed to spawn: python (os error 4551)" and block
the whole prompt. Prefer the signed Windows `py -3` launcher there instead.
Elsewhere, keep wrapping with `uv run`.
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

PYTHON_PATTERN = re.compile(r"^(\s*)(python3?(?:\.\d+)?)\b(.*)$")
UV_RUN_PATTERN = re.compile(r"^\s*(uv|.*[/\\]uv(\.exe)?)\s+run\s+")
PY_LAUNCHER_PATTERN = re.compile(r"^\s*py\s+")


def find_uv() -> str | None:
    """Find uv binary, checking PATH first then common install locations."""
    # Check PATH
    uv = shutil.which("uv")
    if uv:
        return uv

    # Common install locations
    home = Path.home()
    candidates = [
        home / ".local" / "bin" / "uv",
        home / ".cargo" / "bin" / "uv",
        Path("/usr/local/bin/uv"),
    ]

    # Windows: check LOCALAPPDATA
    localappdata = os.environ.get("LOCALAPPDATA")
    if localappdata:
        candidates.append(Path(localappdata) / "uv" / "uv.exe")

    for p in candidates:
        if p.is_file():
            return str(p)

    return None


def rewrite_command(command: str) -> str | None:
    """Return a rewritten command, or None when no change is needed."""
    if UV_RUN_PATTERN.match(command) or PY_LAUNCHER_PATTERN.match(command):
        return None

    match = PYTHON_PATTERN.match(command)
    if not match:
        return None

    whitespace, _python_cmd, rest = match.groups()

    # Signed Windows launcher — avoids uv's unsigned cache shims under App Control.
    if os.name == "nt" and shutil.which("py"):
        return f"{whitespace}py -3{rest}"

    uv_path = find_uv()
    if not uv_path:
        return None

    return f"{whitespace}{uv_path} run python{rest}"


def main():
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        return

    tool_name = data.get("tool_name", "")
    command = data.get("tool_input", {}).get("command", "")

    if tool_name not in ("Bash", "run_shell_command") or not command:
        return

    new_command = rewrite_command(command)
    if not new_command:
        return

    # Output format based on CLI
    if data.get("hook_event_name") == "BeforeTool":
        output = {"decision": "approve", "updatedInput": {"command": new_command}}
    else:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "updatedInput": {"command": new_command},
            }
        }

    print(json.dumps(output))


if __name__ == "__main__":
    main()
