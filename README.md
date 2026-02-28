# Komma

**A writing app where AI is your editor, not your author.**

Komma is a native macOS markdown editor built for writers who want Claude as a collaborator — not a replacement. Select text, leave comments, and let Claude suggest edits you can accept or reject line-by-line. Every change is tracked with full version history.

## Why Komma

Most AI writing tools generate text for you. Komma takes a different approach: **you write, AI edits**. Think of it like track changes with a brilliant co-editor who understands your entire document.

- Leave inline comments on any selection, then send them to Claude for targeted rewrites
- Review every AI suggestion as a diff — accept, reject, or revise per chunk
- Chat with Claude about your document with full context awareness
- Every save and edit is versioned — roll back to any point in time

## Install

```bash
brew tap 0xSmick/komma
brew install --cask komma
```

Requires the [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) for AI features (uses your Claude Max subscription — no API key needed):

```bash
npm install -g @anthropic-ai/claude-code
claude   # login once
```

## How It Works

1. **Write** in a clean markdown editor with optional vim keybindings
2. **Comment** — select text, hit `Cmd+K` to leave edit instructions
3. **Send** — `Cmd+Enter` sends your comments to Claude
4. **Review** — inline diffs appear with accept/reject controls per chunk
5. **Chat** — open the chat tab for conversational editing with full document context

## Features

| Feature | Details |
|---------|---------|
| Inline AI edits | Comment-driven editing with per-chunk diff review |
| AI chat | Conversational editing with full document context |
| Version history | Every save and edit tracked, restore any version |
| Git integration | Auto-commit on save, push to GitHub from the app |
| Vault context | `@vault` gives Claude awareness of all your documents |
| Google Docs sync | Share and pull comments back (optional, bring your own OAuth) |
| Split panes | View two documents side by side |
| File explorer | Sidebar tree + fuzzy finder (`Cmd+P`) |
| Vim mode | Toggle in status bar |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+E` | Toggle edit mode |
| `Cmd+K` | Comment on selection |
| `Cmd+Enter` | Send to Claude |
| `Cmd+P` | Fuzzy file finder |
| `Cmd+B` | File explorer |
| `Cmd+\` | Split pane |
| `Cmd+S` | Save |
| `Cmd+T` / `Cmd+W` | New / close tab |

## Building from Source

```bash
git clone https://github.com/0xSmick/komma.git
cd komma && npm install
npm run electron:dev     # dev mode
npm run dist             # package .app + .dmg
```

## Configuration

- **Vault** — place a `.vault` file at your documents root, or set in Settings
- **Google OAuth** — configure in Settings with your own Client ID/Secret ([setup guide](./SETUP.md))
- **Settings** stored at `~/.komma/config.json`

## Architecture

```
electron/main.ts       Main process — IPC, Claude, git, Google auth
electron/claude.ts     Spawns claude -p, streams NDJSON
src/app/page.tsx       Main editor component
src/app/hooks/         useDocument, useClaude, useChat, useVim
src/lib/db.ts          SQLite (sql.js) — comments, history, chat
```

## License

MIT
