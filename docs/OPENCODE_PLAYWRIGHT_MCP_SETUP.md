# OpenCode + Playwright MCP Setup

Use this to replicate the Claude Chrome extension workflow in OpenCode with GPT.

## What you get

- Browser navigation and interaction from the agent
- Deterministic UI assertions against the running app
- Screenshots, trace, and video artifacts for smoke-test evidence
- Reusable prompt template for iteration "Done when" checks

## 1) Install browser dependencies

From the project root:

```bash
pnpm exec playwright install chromium
```

If your environment needs OS packages too:

```bash
pnpm exec playwright install --with-deps chromium
```

## 2) Configure OpenCode MCP server

Create or edit `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "playwright": {
      "type": "local",
      "command": [
        "npx",
        "@playwright/mcp@latest",
        "--browser",
        "chrome",
        "--save-trace",
        "--save-video=1280x720",
        "--output-dir",
        "test-results/mcp"
      ],
      "enabled": true
    }
  }
}
```

Notes:

- `--browser chrome` gives behavior closer to a real user browser.
- Artifacts are stored in `test-results/mcp`.
- If Chrome is unavailable on CI, switch to `chromium`.

## 3) Restart OpenCode and verify tools

After restarting OpenCode, ask:

```txt
Use the playwright tool to open http://localhost:3000 and return the page title.
```

If the tool is available, OpenCode will call Playwright MCP browser actions.

## 4) Run the app and execute smoke checks

Start the app:

```bash
pnpm dev
```

Then use the prompt template in:

- `docs/templates/SMOKE_TEST_PROMPT_OPENCODE.md`

When done:

```bash
pkill -f "next dev"
```

## 5) Optional: connect to existing Chrome session

If you need logged-in state from your existing browser, Playwright MCP supports extension/CDP-based connection modes. Start with the default setup above first; only add extension/CDP mode when you specifically need shared tabs/cookies.
