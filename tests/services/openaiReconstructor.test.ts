import { describe, expect, it } from 'vitest';
import { reconstructOpenAIMessage } from '../../services/openaiReconstructor';
import { SSEEvent } from '../../types';

describe('services/openaiReconstructor.reconstructOpenAIMessage', () => {
  it('最小事件序列：thinking/text/tool_calls/usage/model/stop_reason', () => {
    const events: SSEEvent[] = [
      {
        event: 'message',
        data: '{}',
        parsedData: {
          model: 'gpt-4.1-mini',
          choices: [
            {
              delta: {
                reasoning_content: 'r1',
                content: 'h',
                tool_calls: [
                  {
                    index: 0,
                    id: 'call_1',
                    function: { name: 'add', arguments: '{"a":' },
                  },
                ],
              },
            },
          ],
        },
        timestamp: 1,
      },
      {
        event: 'message',
        data: '{}',
        parsedData: {
          choices: [
            {
              delta: {
                reasoning_content: 'r2',
                content: 'i',
                tool_calls: [
                  {
                    index: 0,
                    function: { arguments: '1}' },
                  },
                ],
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 3, completion_tokens: 4, reasoning_tokens: 2 },
        },
        timestamp: 2,
      },
      { event: 'done', data: '[DONE]', parsedData: undefined, timestamp: 3 },
    ];

    const state = reconstructOpenAIMessage(events);
    expect(state.provider).toBe('openai');
    expect(state.model).toBe('gpt-4.1-mini');
    expect(state.stop_reason).toBe('stop');
    expect(state.usage).toMatchObject({
      input_tokens: 3,
      output_tokens: 4,
      reasoning_tokens: 2,
    });

    const thinking = state.blocks.find((b) => b.type === 'thinking');
    const text = state.blocks.find((b) => b.type === 'text');
    const tool = state.blocks.find((b) => b.type === 'tool_use');

    expect(thinking?.content).toBe('r1r2');
    expect(text?.content).toBe('hi');
    expect(tool).toMatchObject({ type: 'tool_use', id: 'call_1', name: 'add', input: { a: 1 } });
  });
});

