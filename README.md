# komma

**A markdown editor where Claude edits with you, not for you.**

https://github.com/user-attachments/assets/9f2f04ce-8e4f-4708-b161-6248d3e36ea4

---

## Why

AI made me a faster writer but a worse editor. Every tool I tried would rewrite entire documents when I just wanted one paragraph tightened. None of them tracked changes or remembered anything between sessions.

Markdown is the universal primitive for AI agents — CLAUDE.md, context files, PRDs — but there's no good native editor for it. And nobody brought version control to writing the way git brought it to code. Engineers solved "who changed what and when" decades ago. Strategy docs are still stuck in `Q4 Plan FINAL v3 (copy).docx`.

I wanted:

1. **Comment-based editing.** Highlight a section, say "make this clearer," review the diff, accept or reject.
2. **Git for documents.** Every save tracked, every change attributed, fully reversible.
3. **Context across documents.** Claude knows about your other docs — not starting from zero every time.
4. **Instant action from conversation.** Mid-chat, decide "turn this into a memo" and it happens right where you're writing.

---

## How it works

1. **Write** in a clean markdown editor
2. **Comment** on any selection with `Cmd+K` — "flesh this out", "add edge cases", "make this clearer"
3. **Send** your comments to Claude with `Cmd+Enter`
4. **Review** suggested edits as inline diffs — accept or reject each one
5. **Chat** with Claude about your document in the sidebar

**You direct the edits, Claude executes them.** No full rewrites. No leaving your editor. Just a tight loop between your intent and AI.

---

## Features

| | |
|---|---|
| **Inline editing** | Comment on selections, get suggested rewrites, accept/reject each change |
| **Sidebar chat** | Ask questions or discuss your document with Claude |
| **Version history** | Every save tracked with timestamps, restore any version |
| **Git built in** | Auto-commits on save, push to GitHub from the app |
| **Vault context** | `@vault` gives Claude awareness of all your documents |
| **File explorer** | Sidebar tree + fuzzy finder (`Cmd+P`) |
| **Split panes** | View two documents side by side |
| **Google Docs sync** | Share documents and pull comments back |
| **Vim mode** | Because of course |

---

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

---

## Build from source

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

## Keyboard shortcuts

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

---

## License

AGPL-3.0
