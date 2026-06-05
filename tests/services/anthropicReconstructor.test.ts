import { describe, expect, it } from 'vitest';
import { reconstructAnthropicMessage } from '../../services/anthropicReconstructor';
import { SSEEvent } from '../../types';

describe('services/anthropicReconstructor.reconstructAnthropicMessage', () => {
  it('最小事件序列：blocks/usage/model/stop_reason', () => {
    const events: SSEEvent[] = [
      {
        event: 'message',
        data: '{}',
        parsedData: {
          type: 'message_start',
          message: {
            model: 'claude-3-5-sonnet',
            role: 'assistant',
            usage: { input_tokens: 1, output_tokens: 0 },
          },
        },
        timestamp: 1,
      },
      {
        event: 'message',
        data: '{}',
        parsedData: {
          type: 'content_block_start',
          index: 0,
          content_block: { type: 'text' },
        },
        timestamp: 2,
      },
      {
        event: 'message',
        data: '{}',
        parsedData: {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: 'hi' },
        },
        timestamp: 3,
      },
      {
        event: 'message',
        data: '{}',
        parsedData: {
          type: 'content_block_start',
          index: 1,
          content_block: { type: 'tool_use', id: 'tu_1', name: 'add' },
        },
        timestamp: 4,
      },
      {
        event: 'message',
        data: '{}',
        parsedData: {
          type: 'content_block_delta',
          index: 1,
          delta: { type: 'input_json_delta', partial_json: '{"a":1}' },
        },
        timestamp: 5,
      },
      {
        event: 'message',
        data: '{}',
        parsedData: {
          type: 'message_delta',
          delta: { stop_reason: 'end_turn' },
          usage: { output_tokens: 2 },
        },
        timestamp: 6,
      },
    ];

    const state = reconstructAnthropicMessage(events);
    expect(state.provider).toBe('anthropic');
    expect(state.model).toBe('claude-3-5-sonnet');
    expect(state.role).toBe('assistant');
    expect(state.stop_reason).toBe('end_turn');
    expect(state.usage).toMatchObject({ input_tokens: 1, output_tokens: 2 });

    expect(state.blocks).toHaveLength(2);
    expect(state.blocks[0]).toMatchObject({ type: 'text', content: 'hi' });
    expect(state.blocks[1]).toMatchObject({ type: 'tool_use', id: 'tu_1', name: 'add', input: { a: 1 } });
  });
});

