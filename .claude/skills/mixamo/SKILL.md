---
name: mixamo
description: Download Mixamo animations (FBX) into the project through the mixamo MCP. Use when asked to fetch, search or download a Mixamo animation/character, or when the mixamo MCP tools (mcp__mixamo__*) fail to connect or report not logged in.
---

# Mixamo MCP — usage

The project's `.mcp.json` declares a `mixamo` MCP server (Playwright driving mixamo.com).
Code lives **outside the repo**: `D:\AgenticCoding\tools\mixamo-mcp\` (`mcp_server.py`, `login.py`, README).

## Tools (`mcp__mixamo__*`, deferred — load with ToolSearch first)

| Tool | Purpose |
|---|---|
| `status()` | `logged_in`, screen, character, selected animation |
| `list_animations(query)` | Search; returns page 1 with numeric IDs (only ~48 per page) |
| `select_animation(animation_id)` | ID must be visible on the current page (search first) |
| `set_param(name, value)` | `inplace`/`mirror` = true/false; `overdrive`/`arm-space`/`trim` = 0-100 |
| `download_animation(output_path, format, skin, fps)` | format: `fbx` (FBX 2019), `fbx_unity`, `fbx_ascii`, `fbx_7.4`, `fbx_6.1`, `collada` |
| `upload_character(path)`, `confirm_review()`, `close_upload_modal()` | Auto-Rigger flow for a custom character |

## Standard flow

1. `status()` — must say `logged_in: True`. If not, see **Login** below. Do not try to enter credentials yourself.
2. `list_animations("idle")` — pick an ID.
3. `select_animation("<id>")`; `set_param(...)` only if needed (e.g. `inplace=true` for locomotion loops).
4. Create the target dir, then `download_animation(output_path=<absolute Windows path>, format="fbx", skin=true)`.
   Use `skin=true` for the first file of a character, `skin=false` for extra animations on the same rig.
5. Verify: `ls -l` the file and check it starts with `Kaydara FBX Binary`.

Project convention: files go in `public/assets/mixamo/<name>.fbx`. Conversion/wiring into the game is a separate step.
Downloading a file needs the user's explicit OK if they did not ask for it.

## Login (the tricky part)

- The Adobe session lives in **session cookies**: it only survives while the MCP's browser stays open. A separate
  login script (`login.py`) does NOT hand its session to the MCP — don't bother.
- `.mcp.json` sets `MIXAMO_HEADLESS=0`, so the MCP opens a **visible Chromium window**. The user logs in there
  and must **leave the window open**. Then call `status()` again.
- After a restart of the MCP/session the login is lost and must be redone.
- Do not run `tools/mixamo-mcp/main.py` (CLI) at the same time: same `browser_profile/`.

## Troubleshooting (all hit on 2026-09-30)

- **`CONNECTION_CLOSED` / server fails to start:** run it by hand:
  `python D:\AgenticCoding\tools\mixamo-mcp\mcp_server.py`. It needs `mcp<2` (`pip install "mcp<2"`; mcp 2.x removed
  `mcp.server.fastmcp`). `requirements.txt` there still says `mcp>=1.0` — should be `mcp>=1.0,<2`.
- **Tools absent from `/mcp` after editing `.mcp.json`:** the file must be valid JSON (backslashes doubled, `\\`).
  Write it with the Write tool, not a shell heredoc. Changes only apply after restarting the session.
- **No window appears:** the server defaults to headless unless `MIXAMO_HEADLESS=0` is in the server's `env`.
- Running Chromium from the sandboxed Bash tool fails with `spawn UNKNOWN`; let the MCP launch the browser instead.
- Shell note: the user's terminal is PowerShell — call executables with `& "path\python.exe" args`.

## Worked example

Animation `117780901` ("Idle", plain standing idle) downloaded as FBX 2019, skin, 30 fps onto "Default Character"
→ `public/assets/mixamo/idle.fbx` (2,261,824 bytes).
