# SSE Stream Inspector

A developer tool to parse, visualize, and reconstruct Server-Sent Events (SSE) streams — optimized for Claude-style model outputs (thinking blocks, tool calls, dialogue history).

## Project

- **Stack:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS via CDN (no PostCSS/config file; use only inline utility classes)
- **Entry:** `index.tsx` → `App.tsx`
- **Type definitions:** `types.ts`
- **SSE parser service:** `services/sseParser.ts`
- **No test framework** — no `vitest`, `jest`, or `playwright` configured

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server on `http://0.0.0.0:3000` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

## Architecture

- **`App.tsx`** — Root component. Owns all state (input text, events, parsed message, view mode). Auto-parses on input change via `useEffect`. Two modes: `sse` (for raw SSE streams) and `dialogue` (for full Claude HTTP JSON).
- **`services/sseParser.ts`** — Exports `parseRawSSE()` (tokenizes raw SSE text into `SSEEvent[]`) and `reconstructMessage()` (assembles events into a `MessageState` with content blocks, usage, stop reason).
- **`types.ts`** — Interfaces: `SSEEvent`, `ContentBlock`, `MessageState`, `ClaudePart`, `ClaudeMessage`, `ClaudeChatHistory`.
- **`components/EventItem.tsx`** — Accordion display for a single parsed SSE event. Color-coded by event type.
- **`components/MessagePreview.tsx`** — Visual reconstruction of the SSE stream into structured content blocks (thinking, text, tool_use) with token usage.
- **`components/ChatHistory.tsx`** — Chat-like UI for full Claude dialogue history JSON. Renders turns, thinking blocks, tool calls, results, system instructions, and tool definitions.

## Conventions

- **Components:** `React.FC<Props>` pattern, exported as default.
- **Types:** All in `types.ts`; import via `import { X } from '../types'`.
- **Naming:** PascalCase for components; camelCase for variables/functions.
- **Styling:** Tailwind inline classes only — no CSS modules, no styled-components.
- **Error handling:** Try/catch around JSON.parse; fall back gracefully. Manual error state (`parseError`) shown in UI.
- **State management:** Local `useState` + `useCallback` in App — no external state library.
- **SSE parsing:** Multi-line data concatenation supported; HTTP headers automatically skipped.

## Notes

(Add project-specific notes as needed.)
