# SSE Stream Inspector

A developer tool to parse, visualize, and reconstruct Server-Sent Events (SSE) streams — supports **Anthropic** and **OpenAI Chat Completions** formats (thinking/reasoning blocks, tool calls, dialogue history).

## Project

- **Stack:** React 19 + TypeScript + Vite 6
- **Styling:** Tailwind CSS via CDN (no PostCSS/config file; use only inline utility classes)
- **Entry:** `index.tsx` → `App.tsx`
- **Type definitions:** `types.ts`
- **Examples:** `examples/{anthropic,openai}/` — per-provider `sse.txt` and `dialogue.json`
- **Testing:** Vitest 3 (`vitest.config.ts`); unit tests in `tests/services/` for `services/` pure functions (no Playwright / component tests)
- **Editor:** CodeMirror 6 via `@uiw/react-codemirror` in expand modal; `react-window` virtualizes SSE event list

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server on `http://0.0.0.0:3000` |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest once (`tests/**/*.test.ts`) |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | `tsc --noEmit` type check |

## Architecture

- **`App.tsx`** — Root layout; wires `useInspector` hook to `Header`, panes, and `InputEditorModal`.
- **`hooks/useInspector.ts`** — State, debounced auto-parse (~220ms) on input change, example loading, clear.
- **`services/inspectInput.ts`** — Pure parse orchestration (JSON → dialogue, else SSE); no React.
- **`components/Header.tsx`** — Top bar: title, example-template select, load/clear buttons.
- **`components/InputEditorModal.tsx`** — Full-screen CodeMirror editor for large pastes; shares `inputText` state with sidebar textarea.
- **`components/EventList.tsx`** — Virtualized SSE event list (`react-window`); search/filter + detail panel.
- **`services/sseParser.ts`** — `parseRawSSE()`: tokenizes raw SSE text into `SSEEvent[]`. Supports multiline `data:` payloads and `data: [DONE]`.
- **`services/formatDetector.ts`** — `detectSSEProvider()` / `detectDialogueProvider()`: auto-identify Anthropic vs OpenAI.
- **`services/anthropicReconstructor.ts`** — `reconstructAnthropicMessage()`: Anthropic SSE → `MessageState`.
- **`services/openaiReconstructor.ts`** — `reconstructOpenAIMessage()`: OpenAI SSE → `MessageState` (reasoning_content, content, tool_calls, usage).
- **`services/reconstructMessage.ts`** — Dispatches to provider-specific reconstructor.
- **`services/dialogueNormalizer.ts`** — `normalizeDialogue()`: JSON → unified `ChatHistory` with provider-specific adapters.
- **`types.ts`** — `Provider`, `SSEEvent`, `ContentBlock`, `MessageState`, `ChatHistory`, `ChatPart`, etc.
- **`components/MessagePreview.tsx`** — SSE reconstruction preview with provider badge and reasoning token usage.
- **`components/ChatHistory.tsx`** — Chat UI for dialogue JSON; supports `role: tool`, normalized system/tools.
- **`utils/detectEditorLanguage.ts`** / **`utils/formatJson.ts`** — Editor language hint and JSON pretty-print for modal.
- **`tests/services/*.test.ts`** — Unit tests for parsers, detectors, reconstructors, normalizer (`inspectInput` not yet covered).

## Conventions

- **Components:** `React.FC<Props>` pattern, exported as default.
- **Types:** All in `types.ts`; import via `import { X } from '../types'`.
- **Naming:** PascalCase for components; camelCase for variables/functions.
- **Styling:** Tailwind inline classes only — no CSS modules, no styled-components.
- **Error handling:** Try/catch around JSON.parse; fall back gracefully. Manual error state (`parseError`) shown in UI.
- **State management:** Local `useState` + `useCallback` in `useInspector` — no external state library.
- **Tests:** Add cases under `tests/services/`; run `npm test`. Prefer example fixtures from `examples/` where useful.
- **Normalization:** Provider-specific parsers produce unified internal models; UI components stay provider-agnostic.
- **SSE parsing:** Multiline data concatenation; HTTP headers automatically skipped.

## Notes

- OpenAI `reasoning_content` is normalized to `thinking` content blocks.
- OpenAI dialogue `tool_calls` → `tool_use` parts; `role: tool` → `tool_result` parts.
