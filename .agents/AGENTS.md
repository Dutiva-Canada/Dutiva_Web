# AGENTS.md

## Critical Rules

- NEVER delete files you didn't create
- On Windows, run Python with `py -3` (signed launcher). Do not use `uv run` here — App Control blocks uv's unsigned cached python.exe (os error 4551). On macOS/Linux, use `uv run`.
- ALWAYS write newly created scripts to the `temp/` subfolder (create it if it doesn't exist)
- ALWAYS verify before marking a task complete that your solution fully addresses the original request
