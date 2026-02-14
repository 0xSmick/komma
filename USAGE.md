# Helm + Obsidian Workspace

A markdown document editor with Claude integration for AI-assisted editing and chat, backed by SQLite for persistence. Works alongside Obsidian for document organization and linking.

## Quick Start

You need **three terminals** running:

```bash
# Terminal 1: Dev server
cd doc-editor
npm run dev
```

```bash
# Terminal 2: Edit watcher (processes "Send to Claude" requests)
cd doc-editor
./scripts/claude-watcher.sh
```

```bash
# Terminal 3: Chat watcher (processes chat messages)
cd doc-editor
chmod +x scripts/chat-watcher.sh
./scripts/chat-watcher.sh
```

Then open **http://localhost:3000** in your browser.

---

## Features

### Browse & Load Documents

Click **Browse** (top-left) to open the file browser. Navigate directories and click any `.md` file to load it. Recent files appear at the top for quick access.

The default directory is `/Users/sheldon/Developer/torque/planning/` — the Obsidian vault root.

### Document Info Panel

A collapsible bar appears below the header showing metadata from YAML frontmatter:
- **Type** and **Status** badges (color-coded)
- **Tags** as chips
- **Related documents** as clickable links (click to navigate)
- **Sharing** toggle

Click the bar to expand/collapse. This data comes from the frontmatter block at the top of each markdown file.

### Comment-Based Editing (Core Workflow)

This is the primary workflow — annotate a document with editing instructions, then batch-send them to Claude:

1. **Select text** in the document (view mode, not edit mode)
2. A small **"Add Comment"** tooltip appears near your selection
3. Click it to open the **Comment Drawer** (slides in from the right)
4. Write your instruction (e.g., "Make this more concise", "Add error handling details", "Rewrite for a technical audience")
5. Click **Add Comment** — it appears in the Comments sidebar tab
6. Repeat for as many comments as you want
7. Click **Send to Claude** in the Comments tab

Claude processes all comments as a batch, editing the file directly. Watch the Output tab for live streaming progress.

### Manual Editing

Click **Edit** in the header to switch to rich-text mode (TipTap editor). You get:
- Text formatting (bold, italic, strikethrough)
- Headings (H1–H3)
- Lists (bullet, ordered)
- Tables (insert, add/remove rows/columns)
- Code blocks, blockquotes, horizontal rules
- Undo/redo

Click **Save** to convert back to markdown and write to disk. Frontmatter is preserved through edit/save cycles.

### Chat

The **Chat** tab in the sidebar lets you have a conversation with Claude about the current document:

1. Switch to the **Chat** tab
2. Type a question or message in the input box
3. Press Enter or click Send
4. Claude responds with context about the loaded document

You can optionally select text first — it'll be included as context in your message. Chat history persists across page refreshes (stored in SQLite).

Click **+ New Chat** to start a fresh conversation.

### Wiki-Links

Documents can reference each other with `[[wiki-links]]`. These render as styled clickable links in the document body. Clicking one navigates to that document.

The Obsidian vault also recognizes these links — open the vault in Obsidian to see the graph view of document connections.

### Changelog / Output History

The **Output** tab shows:
- **Live stream** of the current Claude operation (real-time output)
- **Changelog history** — every "Send to Claude" operation with timestamp, status, and expandable stream logs

This replaces the old localStorage-based history — everything persists in SQLite.

---

## Obsidian Integration

The planning directory (`/Users/sheldon/Developer/torque/planning/`) is an Obsidian vault. Open it in Obsidian to get:

- **Graph view** of document connections (via `[[wiki-links]]` and `related:` frontmatter)
- **Tag browsing** across all planning docs
- **Search** across all documents
- **Sidebar navigation** with folder structure

Obsidian and Helm operate on the same markdown files on disk. Edits in either tool are visible in the other (reload in Helm after Obsidian edits).

The `.obsidianignore` file excludes `doc-editor/`, `node_modules/`, and non-markdown files from the vault.

---

## Architecture

```
doc-editor/
├── scripts/
│   ├── claude-watcher.sh      # Watches /tmp for edit requests, runs Claude
│   └── chat-watcher.sh        # Watches /tmp for chat messages, runs Claude
├── data/
│   └── helm.db           # SQLite database (auto-created, gitignored)
└── src/app/
    ├── page.tsx                 # Layout shell (~300 lines)
    ├── types.ts                 # Shared interfaces
    ├── hooks/
    │   ├── useDocument.ts       # File load/save, frontmatter
    │   ├── useComments.ts       # Comment CRUD via API
    │   ├── useChangelog.ts      # Changelog queries via API
    │   ├── useClaude.ts         # Send to Claude, polling, streaming
    │   └── useChat.ts           # Chat sessions and messages
    ├── components/
    │   ├── Header.tsx           # Top bar
    │   ├── Sidebar.tsx          # Tab container with resize handle
    │   ├── DocumentInfo.tsx     # Frontmatter info panel
    │   ├── CommentDrawer.tsx    # Comment creation slide-in
    │   ├── CommentTooltip.tsx   # Selection tooltip
    │   ├── FileBrowser.tsx      # File browser modal
    │   ├── RichEditor.tsx       # TipTap rich text editor
    │   └── tabs/
    │       ├── CommentsTab.tsx   # Comment list + send
    │       ├── OutputTab.tsx     # Stream viewer + changelog
    │       └── ChatTab.tsx      # Chat interface
    └── api/
        ├── comments/route.ts    # Comment CRUD
        ├── changelogs/route.ts  # Changelog CRUD
        ├── chat/route.ts        # Chat sessions + messages
        ├── chat/stream/route.ts # Chat stream log
        ├── chat/status/route.ts # Chat response polling
        ├── claude/route.ts      # Edit request dispatch
        ├── claude/stream/route.ts # Edit stream log
        ├── file/route.ts        # File read/write
        ├── files/route.ts       # Directory listing
        └── frontmatter/route.ts # Frontmatter parsing
```

### Data Flow

**Comments → Claude edits:**
```
UI comments → POST /api/comments → SQLite
"Send to Claude" → writes /tmp/helm-comments.json
claude-watcher.sh detects → runs Claude CLI → streams to /tmp/helm-stream.log
UI polls /api/claude + /api/claude/stream → shows live output
Completion → PATCH changelog + comments status in SQLite
```

**Chat:**
```
User message → POST /api/chat → SQLite + writes /tmp/helm-chat.json
chat-watcher.sh detects → runs Claude with doc context → streams to /tmp/helm-chat-stream.log
UI polls /api/chat/status + /api/chat/stream → shows response
Response → PATCH /api/chat to save assistant message in SQLite
```

### SQLite Tables

| Table | Purpose |
|-------|---------|
| `documents` | Tracks opened files, frontmatter cache |
| `comments` | Persistent comments with status (pending → sent → applied/dismissed) |
| `changelogs` | Every "Send to Claude" operation with stream logs |
| `chat_sessions` | Chat conversation sessions per document |
| `chat_messages` | Individual chat messages (user + assistant) |

---

## Frontmatter Format

Each document has YAML frontmatter that both Obsidian and Helm understand:

```yaml
---
title: "Torque 6-Week Master Roadmap"
type: roadmap
status: in-progress
created: 2026-01-23
shared: false
related:
  - "[[PRODUCT_FEATURES_V2]]"
  - "[[PRODUCT_BACKLOG]]"
tags: [strategy, planning, roadmap]
---
```

The `related` field creates links in both the Document Info panel and Obsidian's graph view.
