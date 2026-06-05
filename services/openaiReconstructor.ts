
import { ContentBlock, MessageState, SSEEvent, TokenUsage } from '../types';

interface ToolCallAccumulator {
  id?: string;
  name?: string;
  arguments: string;
}

const mapOpenAIUsage = (usage: any): TokenUsage => ({
  input_tokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
  output_tokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
  cache_read_input_tokens: usage.cached_tokens ?? usage.cache_read_input_tokens,
  reasoning_tokens: usage.reasoning_tokens,
});

const getOrCreateBlock = (blocks: ContentBlock[], type: ContentBlock['type']): ContentBlock => {
  const existing = blocks.find((b) => b.type === type);
  if (existing) return existing;
  const block: ContentBlock = { type, content: '' };
  blocks.push(block);
  return block;
};

export const reconstructOpenAIMessage = (events: SSEEvent[]): MessageState => {
  const state: MessageState = {
    provider: 'openai',
    blocks: [],
    usage: undefined,
    model: undefined,
    stop_reason: undefined,
  };

  const toolCalls: Record<number, ToolCallAccumulator> = {};

  events.forEach((ev) => {
    if (ev.data === '[DONE]') return;

    const data = ev.parsedData;
    if (!data) return;

    if (data.model && !state.model) {
      state.model = data.model;
    }

    const choice = data.choices?.[0];
    if (!choice) return;

    const delta = choice.delta;
    if (delta) {
      if (delta.reasoning_content) {
        getOrCreateBlock(state.blocks, 'thinking').content += delta.reasoning_content;
      }
      if (delta.content) {
        getOrCreateBlock(state.blocks, 'text').content += delta.content;
      }
      if (Array.isArray(delta.tool_calls)) {
        delta.tool_calls.forEach((tc: any) => {
          const idx = tc.index ?? 0;
          if (!toolCalls[idx]) {
            toolCalls[idx] = { arguments: '' };
          }
          if (tc.id) toolCalls[idx].id = tc.id;
          if (tc.function?.name) toolCalls[idx].name = tc.function.name;
          if (tc.function?.arguments) {
            toolCalls[idx].arguments += tc.function.arguments;
          }
        });
      }
    }

    if (choice.finish_reason) {
      state.stop_reason = choice.finish_reason;
    }

    if (data.usage) {
      state.usage = mapOpenAIUsage(data.usage);
    }
  });

  Object.keys(toolCalls)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((key) => {
      const tc = toolCalls[Number(key)];
      let input: any = tc.arguments;
      try {
        input = JSON.parse(tc.arguments || '{}');
      } catch {
        // keep raw string
      }
      state.blocks.push({
        type: 'tool_use',
        content: '',
        id: tc.id,
        name: tc.name,
        input,
      });
    });

  return state;
};
