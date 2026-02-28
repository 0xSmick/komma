# Komma

## Development

Start the Electron app in development mode:
```bash
cd doc-editor && npm run electron:dev
```

This compiles the Electron TypeScript and launches the app. The Electron main process starts a Next.js dev server on a random port automatically.

## Architecture

- `electron/main.ts` — Main process: window management, IPC handlers, starts Next.js server
- `electron/preload.ts` — Context bridge exposing IPC to renderer
- `electron/claude.ts` — Spawns `claude -p --output-format stream-json`, parses NDJSON stream
- `src/app/hooks/useClaude.ts` — Uses IPC in Electron, falls back to fetch in browser
- `src/app/hooks/useChat.ts` — Uses IPC in Electron, falls back to fetch in browser

## Building

```bash
npm run dist        # Build Next.js + compile Electron + package .app
```

## Claude Integration

Claude is invoked via `claude -p` CLI (uses Max subscription, no API key needed). The Electron main process spawns it as a child process and streams NDJSON output back to the renderer via IPC.
