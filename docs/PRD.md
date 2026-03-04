# Clean Gmail - Product Requirements Document

## Vision

A CLI tool that connects to a Gmail account via the Gmail API, analyzes emails, and recommends which ones to delete to free up storage space. The tool helps users reclaim their Google storage by identifying large, old, or bulk emails that are safe to remove.

## Problem

Gmail accounts accumulate years of emails — newsletters, promotions, large attachments, automated notifications — that consume Google Drive storage (shared 15GB free tier). Manually finding and deleting these is tedious and error-prone.

## Target User

Developers and tech-savvy users comfortable with CLI tools who want to clean up their Gmail storage efficiently.

---

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Gmail Access:** Google Gmail API (OAuth2)
- **CLI Framework:** Commander.js
- **Output:** Terminal tables + optional JSON export

---

## Iteration Plan

### Iteration 1 — Init npm + TypeScript

**Goal:** Empty project that compiles.

- `npm init`, install `typescript`, configure `tsconfig.json`
- Create `src/index.ts` with a `console.log("hello")`
- `npm run build` compiles to `dist/`

**Done when:** `npm run build && node dist/index.js` prints "hello".

---

### Iteration 2 — CLI Entry Point

**Goal:** CLI skeleton that responds to `--help`.

- Install `commander`
- Wire `src/index.ts` as CLI with program name `clean-gmail`
- Add `bin` field in `package.json`

**Done when:** `npx clean-gmail --help` prints usage.

---

### Iteration 3 — Google OAuth2 Client

**Goal:** Create an OAuth2 client that opens the browser for consent.

- Install `googleapis`
- Read `credentials.json` (user provides from Google Cloud Console)
- Open browser → user approves → receive auth code

**Done when:** Auth code is received and printed to console.

---

### Iteration 4 — Persist Tokens

**Goal:** Save and reuse OAuth tokens.

- Exchange auth code for tokens
- Save to `~/.clean-gmail/token.json` (file permissions 600)
- On next run, load existing token; refresh if expired

**Done when:** Second run skips browser and reuses saved token.

---

### Iteration 5 — `auth` Command

**Goal:** Wire auth flow into the CLI.

- `clean-gmail auth` triggers the OAuth flow from iterations 3-4
- Print success/failure message

**Done when:** `clean-gmail auth` completes and saves token.

---

### Iteration 6 — `status` Command

**Goal:** Show basic account info.

- `clean-gmail status` calls `gmail.users.getProfile`
- Display: email address, total messages, total threads

**Done when:** Command prints account stats. Prints error if not authenticated.

---

### Iteration 7 — List Large Emails (API Call)

**Goal:** Query Gmail for large emails.

- Use `gmail.users.messages.list` with `larger:5M` query
- Fetch message metadata (sender, subject, date, size) in batches
- Return raw results as an array

**Done when:** Function returns array of large email metadata.

---

### Iteration 8 — Format Output as Table

**Goal:** Display email results as a readable table.

- Install `cli-table3`
- Format email metadata into columns: sender, subject (40 chars), date, size
- Show total count and total size at the bottom

**Done when:** `clean-gmail scan --large` prints a formatted table.

---

### Iteration 9 — Scan Promotions

**Goal:** Find promotional emails.

- `clean-gmail scan --promotions` uses query `category:promotions`
- Reuse same table formatter from iteration 8
- Show count + total size

**Done when:** Command lists promotional emails in a table.

---

### Iteration 10 — Scan Social

**Goal:** Find social notification emails.

- `clean-gmail scan --social` uses query `category:social`

**Done when:** Command lists social emails in a table.

---

### Iteration 11 — Scan Old Emails

**Goal:** Find emails older than a threshold.

- `clean-gmail scan --older-than 2y`
- Parse duration strings: `6m`, `1y`, `2y`, `30d`
- Use Gmail query `older_than:2y`

**Done when:** `--older-than 1y` returns emails older than 1 year.

---

### Iteration 12 — Cache Scan Results

**Goal:** Save scan results locally to avoid re-fetching.

- Save metadata to `~/.clean-gmail/cache.json` after each scan
- On next scan, reuse cache if <1 hour old
- `--fresh` flag bypasses cache

**Done when:** Second scan is instant. `--fresh` hits the API.

---

### Iteration 13 — Top Senders Report

**Goal:** Rank senders by space used.

- `clean-gmail top-senders` aggregates cached data by sender
- Display: sender, email count, total size
- Top 20, sorted by size descending

**Done when:** Command prints ranked sender table.

---

### Iteration 14 — Recommendations

**Goal:** Suggest cleanup actions ranked by impact.

- `clean-gmail recommend` analyzes cached data
- Output actions like: "Delete 342 promotions — 128MB"
- Sorted by space saved descending

**Done when:** Command prints ranked recommendations.

---

### Iteration 15 — Delete Dry-Run

**Goal:** Preview what would be trashed.

- `clean-gmail delete --sender "x@example.com"` — dry-run by default
- `clean-gmail delete --category promotions` — dry-run by default
- Print list + total size, with "DRY RUN" banner

**Done when:** Command shows what would be deleted, changes nothing.

---

### Iteration 16 — Delete Execute

**Goal:** Actually trash emails.

- `--confirm` flag enables real deletion
- Add `gmail.modify` scope (re-auth if needed)
- Batch `gmail.users.messages.trash` calls
- Log deleted IDs to `~/.clean-gmail/last-delete.json`

**Done when:** Emails move to Trash. Log file is saved.

---

### Iteration 17 — Undo

**Goal:** Un-trash the last deletion batch.

- `clean-gmail undo` reads `last-delete.json`
- Calls `gmail.users.messages.untrash` for each ID

**Done when:** Emails restored from Trash. Graceful error if nothing to undo.

---

### Iteration 18 — Config File

**Goal:** User-configurable defaults.

- Load `~/.clean-gmail/config.json` on startup
- Configurable: `sizeThreshold`, `ageThreshold`
- `clean-gmail config --show` prints current config

**Done when:** Config values override default thresholds.

---

### Iteration 19 — Whitelist

**Goal:** Protect senders from deletion.

- Add `whitelist` array to config (emails/domains)
- Whitelisted senders excluded from scan, recommend, and delete

**Done when:** Whitelisted sender never appears in any output.

---

### Iteration 20 — Progress Bar

**Goal:** Show progress during long scans.

- Install `cli-progress`
- Show bar when fetching >50 messages
- Update as batches complete

**Done when:** Scan shows a progress bar that fills to 100%.

---

### Iteration 21 — JSON/CSV Export

**Goal:** Export results for external analysis.

- `clean-gmail export --json` / `--csv`
- Export from cached scan data

**Done when:** Valid JSON/CSV files are written to disk.

---

### Iteration 22 — Verbose & Quiet Modes

**Goal:** Control output verbosity.

- `--verbose` shows API call details, timing
- `--quiet` shows only final summary line

**Done when:** Both flags work across all commands.

---

## Non-Goals (Out of Scope)

- Web UI or desktop app (CLI only)
- Multi-account management in a single run
- Permanent deletion (always Trash first)
- Modifying email content or labels (read + delete only)
- Real-time monitoring or scheduled runs (manual trigger only)

## API Quotas & Limits

- Gmail API free tier: 250 quota units/second per user
- Batch requests: up to 100 requests per batch
- Design must respect rate limits with backoff strategy

## Security Considerations

- OAuth2 tokens stored locally with restricted file permissions (600)
- No email content is stored — only metadata (sender, size, date, labels)
- Credentials never logged or transmitted beyond Google's OAuth flow
- Google Cloud project uses minimum required scopes:
  - `gmail.readonly` for scanning
  - `gmail.modify` for trash operations
