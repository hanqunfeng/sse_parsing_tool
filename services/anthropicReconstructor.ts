
import { ContentBlock, MessageState, SSEEvent } from '../types';

export const reconstructAnthropicMessage = (events: SSEEvent[]): MessageState => {
  const state: MessageState = {
    provider: 'anthropic',
    blocks: [],
    usage: undefined,
    model: undefined,
    stop_reason: undefined,
  };

  const blockMap: Record<number, ContentBlock & { input?: string }> = {};

  events.forEach((ev) => {
    const data = ev.parsedData;
    if (!data?.type) return;

    switch (data.type) {
      case 'message_start':
        state.model = data.message?.model;
        state.role = data.message?.role;
        if (data.message?.usage) {
          state.usage = {
            input_tokens: data.message.usage.input_tokens ?? 0,
            output_tokens: data.message.usage.output_tokens ?? 0,
            cache_read_input_tokens: data.message.usage.cache_read_input_tokens,
            cache_creation_input_tokens: data.message.usage.cache_creation_input_tokens,
          };
        }
        break;

      case 'content_block_start': {
        const blockType = data.content_block?.type;
        blockMap[data.index] = {
          type: blockType,
          content: '',
          id: data.content_block?.id,
          name: data.content_block?.name,
          input: blockType === 'tool_use' ? '' : undefined,
          signature: data.content_block?.signature ?? '',
        };
        break;
      }

      case 'content_block_delta': {
        const block = blockMap[data.index];
        if (!block) break;
        if (data.delta?.type === 'thinking_delta') {
          block.content += data.delta.thinking || '';
        } else if (data.delta?.type === 'text_delta') {
          block.content += data.delta.text || '';
        } else if (data.delta?.type === 'input_json_delta') {
          block.input = (block.input || '') + (data.delta.partial_json || '');
        } else if (data.delta?.type === 'signature_delta') {
          block.signature = data.delta.signature;
        }
        break;
      }

      case 'message_delta':
        state.stop_reason = data.delta?.stop_reason;
        if (data.usage) {
          state.usage = {
            input_tokens: state.usage?.input_tokens ?? data.usage.input_tokens ?? 0,
            output_tokens: data.usage.output_tokens ?? state.usage?.output_tokens ?? 0,
            cache_read_input_tokens: data.usage.cache_read_input_tokens ?? state.usage?.cache_read_input_tokens,
            cache_creation_input_tokens: data.usage.cache_creation_input_tokens ?? state.usage?.cache_creation_input_tokens,
          };
        }
        break;
    }
  });

  state.blocks = Object.keys(blockMap)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => {
      const block = blockMap[Number(key)];
      if (block.type === 'tool_use' && typeof block.input === 'string') {
        try {
          return { ...block, input: JSON.parse(block.input || '{}') };
        } catch {
          return block;
        }
      }
      return block;
    });

  return state;
};
