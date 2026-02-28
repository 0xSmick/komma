<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/logo-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="./public/logo-light.svg" />
    <img alt="komma" src="./public/logo-dark.svg" width="128" height="128" />
  </picture>
</p>

<h1 align="center">komma</h1>

<p align="center">
  <strong>A rich, open source markdown editor where Claude edits with you, not for you.</strong>
  <br />
  macOS &nbsp;·&nbsp; Electron &nbsp;·&nbsp; AGPL-3.0
</p>

https://github.com/user-attachments/assets/9f2f04ce-8e4f-4708-b161-6248d3e36ea4

---

## Why

Markdown is the default format for AI agents, but there's no good editor for it. AI writing tools rewrite everything when you just want one paragraph tightened. And documents still don't have real version control outside of closed source systems.

I wanted:

1. **Comment-based editing** — highlight, instruct, review the diff, accept or reject
2. **Git for documents** — every save tracked, every change attributed, fully reversible
3. **Cross-document context** — Claude knows about your other docs, not starting from scratch
4. **Instant action from conversation** — mid-chat, turn a thread into a memo right where you're writing

---

## How it works

1. **Write** in a clean markdown editor
2. **Comment** on any selection with `Cmd+K` — "flesh this out", "add edge cases", "make this clearer"
3. **Send** your comments to Claude with `Cmd+Enter`
4. **Review** suggested edits as inline diffs — accept or reject each one
5. **Chat** with Claude about your document in the sidebar

You stay in control. Claude suggests, you accept or reject.

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
| **Vim mode** | Toggle in status bar |

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

## Contributing

Issues and PRs welcome. If you have ideas or run into bugs, [open an issue](https://github.com/0xSmick/komma/issues).

## License

AGPL-3.0
