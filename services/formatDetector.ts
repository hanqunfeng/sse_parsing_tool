
import { Provider, SSEEvent } from '../types';

const ANTHROPIC_EVENT_TYPES = new Set([
  'message_start',
  'content_block_start',
  'content_block_delta',
  'content_block_stop',
  'message_delta',
  'message_stop',
  'ping',
]);

export const detectSSEProvider = (events: SSEEvent[]): Provider => {
  for (const ev of events) {
    if (ev.data === '[DONE]') continue;
    const data = ev.parsedData;
    if (!data) continue;

    if (data.object === 'chat.completion.chunk' || Array.isArray(data.choices)) {
      return 'openai';
    }

    if (data.type && ANTHROPIC_EVENT_TYPES.has(data.type)) {
      return 'anthropic';
    }
  }

  return 'anthropic';
};

const hasAnthropicSystemBlocks = (raw: any): boolean =>
  Array.isArray(raw.system) &&
  raw.system.some((s: any) => s?.type === 'text' && s?.text !== undefined);

const hasAnthropicContentParts = (raw: any): boolean =>
  raw.messages.some(
    (m: any) =>
      Array.isArray(m?.content) &&
      m.content.some(
        (p: any) => p?.type === 'thinking' || p?.type === 'tool_use' || p?.type === 'tool_result'
      )
  );

const hasAnthropicTools = (raw: any): boolean =>
  Array.isArray(raw.tools) && raw.tools.some((t: any) => t?.input_schema !== undefined);

const isAnthropicDialogue = (raw: any): boolean =>
  hasAnthropicSystemBlocks(raw) || hasAnthropicContentParts(raw) || hasAnthropicTools(raw);

export const detectDialogueProvider = (raw: any): Provider | null => {
  if (!raw || !Array.isArray(raw.messages)) return null;

  if (Array.isArray(raw.tools) && raw.tools.some((t: any) => t?.type === 'function' && t?.function)) {
    return 'openai';
  }

  // Anthropic signals before OpenAI heuristics — Claude Code may inject role:system in messages
  if (isAnthropicDialogue(raw)) {
    return 'anthropic';
  }

  if (raw.messages.some((m: any) => m?.role === 'tool' || m?.role === 'system' || Array.isArray(m?.tool_calls))) {
    return 'openai';
  }

  if (Array.isArray(raw.system) && raw.system.some((s: any) => s?.role === 'system')) {
    return 'openai';
  }

  // Default: messages with string content → openai-style chat completions
  if (raw.messages.some((m: any) => typeof m?.content === 'string')) {
    return 'openai';
  }

  return 'anthropic';
};
