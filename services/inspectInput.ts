
import { parseRawSSE } from './sseParser';
import { reconstructMessage } from './reconstructMessage';
import { normalizeDialogue } from './dialogueNormalizer';
import { detectSSEProvider } from './formatDetector';
import { ChatHistory, MessageState, Provider, SSEEvent } from '../types';

export type ViewMode = 'sse' | 'dialogue';

export type InspectResult =
  | { kind: 'empty' }
  | { kind: 'dialogue'; chatHistory: ChatHistory; provider: Provider }
  | { kind: 'sse'; events: SSEEvent[]; messageState: MessageState; provider: Provider }
  | { kind: 'error'; message: string };

const PARSE_ERROR = '解析失败：输入内容格式异常，请检查是否为完整 JSON 或 SSE 文本。';

export const inspectInput = (text: string): InspectResult => {
  const trimmed = text.trim();
  if (!trimmed) {
    return { kind: 'empty' };
  }

  const leading = text.replace(/^\s+/, '');
  const looksLikeSSE = leading.startsWith('event:') || leading.startsWith('data:');
  const firstNonSpace = leading[0];
  const looksLikeJSON = firstNonSpace === '{' || firstNonSpace === '[';

  if (!looksLikeSSE && looksLikeJSON) {
    try {
      const json = JSON.parse(text);
      const normalized = normalizeDialogue(json);
      if (normalized) {
        return { kind: 'dialogue', chatHistory: normalized, provider: normalized.provider };
      }
    } catch {
      // Not JSON dialogue — fall through to SSE
    }
  }

  try {
    const events = parseRawSSE(text);
    const provider = detectSSEProvider(events);
    const messageState = reconstructMessage(events, provider);
    return { kind: 'sse', events, messageState, provider };
  } catch {
    return { kind: 'error', message: PARSE_ERROR };
  }
};

export const formatDetectionLabel = (
  viewMode: ViewMode,
  detectedProvider: Provider | null
): string =>
  detectedProvider
    ? `${viewMode.toUpperCase()} · ${detectedProvider.toUpperCase()}`
    : viewMode.toUpperCase();
