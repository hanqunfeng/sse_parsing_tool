import { describe, expect, it } from 'vitest';
import { detectDialogueProvider, detectSSEProvider } from '../../services/formatDetector';
import { SSEEvent } from '../../types';

describe('services/formatDetector.detectSSEProvider', () => {
  it('识别 OpenAI chat.completion.chunk', () => {
    const events: SSEEvent[] = [
      {
        event: 'message',
        data: '{"object":"chat.completion.chunk","choices":[{"delta":{"content":"hi"}}]}',
        parsedData: { object: 'chat.completion.chunk', choices: [{ delta: { content: 'hi' } }] },
        timestamp: 1,
      },
    ];
    expect(detectSSEProvider(events)).toBe('openai');
  });

  it('识别 Anthropic 事件 type', () => {
    const events: SSEEvent[] = [
      {
        event: 'message',
        data: '{"type":"message_start","message":{"model":"claude"}}',
        parsedData: { type: 'message_start', message: { model: 'claude' } },
        timestamp: 1,
      },
    ];
    expect(detectSSEProvider(events)).toBe('anthropic');
  });

  it('忽略 [DONE] 并默认 anthropic', () => {
    const events: SSEEvent[] = [
      { event: 'done', data: '[DONE]', parsedData: undefined, timestamp: 1 },
    ];
    expect(detectSSEProvider(events)).toBe('anthropic');
  });
});

describe('services/formatDetector.detectDialogueProvider', () => {
  it('通过 tools.function 识别 OpenAI', () => {
    const raw = {
      tools: [{ type: 'function', function: { name: 'x', parameters: {} } }],
      messages: [{ role: 'user', content: 'hi' }],
    };
    expect(detectDialogueProvider(raw)).toBe('openai');
  });

  it('通过 role: tool / tool_calls 识别 OpenAI', () => {
    const raw1 = { messages: [{ role: 'tool', tool_call_id: '1', content: 'ok' }] };
    const raw2 = { messages: [{ role: 'assistant', tool_calls: [] }] };
    expect(detectDialogueProvider(raw1)).toBe('openai');
    expect(detectDialogueProvider(raw2)).toBe('openai');
  });

  it('通过 system 数组 text 识别 Anthropic', () => {
    const raw = { system: [{ type: 'text', text: 's' }], messages: [] };
    expect(detectDialogueProvider(raw)).toBe('anthropic');
  });

  it('通过消息 content parts 中 thinking/tool_use/tool_result 识别 Anthropic', () => {
    const raw = {
      messages: [
        { role: 'assistant', content: [{ type: 'thinking', thinking: 'x' }] },
      ],
    };
    expect(detectDialogueProvider(raw)).toBe('anthropic');
  });

  it('Claude Code 请求：messages 含 role:system 但有 Anthropic 特征时仍识别为 Anthropic', () => {
    const raw = {
      system: [{ type: 'text', text: 'You are Claude Code' }],
      tools: [{ name: 'Edit', description: 'edit', input_schema: { type: 'object' } }],
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'hi' }] },
        { role: 'system', content: 'Called the Read tool...' },
        {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'plan' },
            { type: 'tool_use', id: 'call_1', name: 'Edit', input: {} },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'call_1', content: 'ok' }],
        },
      ],
    };
    expect(detectDialogueProvider(raw)).toBe('anthropic');
  });
});

