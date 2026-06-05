
import { ChatHistory, ChatMessage, ChatPart, NormalizedSystemBlock, NormalizedTool, Provider } from '../types';
import { detectDialogueProvider } from './formatDetector';

const parseToolArguments = (args: string | undefined): any => {
  if (!args) return {};
  try {
    return JSON.parse(args);
  } catch {
    return args;
  }
};

const normalizeAnthropicMessages = (messages: any[]): ChatMessage[] =>
  messages.map((msg) => {
    const role: ChatMessage['role'] =
      msg?.role === 'user' ? 'user' : msg?.role === 'tool' ? 'tool' : 'assistant';

    const normalizedContent: ChatPart[] = Array.isArray(msg?.content)
      ? msg.content.map((part: any) =>
          typeof part === 'object' && part !== null ? part : { type: 'text', text: String(part ?? '') }
        )
      : [{ type: 'text', text: String(msg?.content ?? '') }];

    return { role, content: normalizedContent };
  });

const normalizeOpenAISystem = (system: any[]): NormalizedSystemBlock[] =>
  system.map((item) => ({
    type: 'text',
    text: typeof item?.content === 'string' ? item.content : JSON.stringify(item?.content ?? item),
  }));

const systemContentToText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part?.type === 'text') return part.text ?? '';
        return JSON.stringify(part);
      })
      .filter(Boolean)
      .join('\n');
  }
  if (content != null) return JSON.stringify(content);
  return '';
};

const extractOpenAISystem = (raw: any): NormalizedSystemBlock[] => {
  const blocks: NormalizedSystemBlock[] = [];

  // Alternate format: top-level system array
  if (Array.isArray(raw.system)) {
    blocks.push(...normalizeOpenAISystem(raw.system));
  }

  // Standard OpenAI format: role "system" inside messages
  if (Array.isArray(raw.messages)) {
    raw.messages
      .filter((m: any) => m?.role === 'system')
      .forEach((m: any) => {
        const text = systemContentToText(m.content);
        if (text) blocks.push({ type: 'text', text });
      });
  }

  return blocks;
};

const normalizeOpenAIMessages = (messages: any[]): ChatMessage[] =>
  messages
    .filter((msg) => msg?.role !== 'system')
    .map((msg) => {
    const role: ChatMessage['role'] =
      msg?.role === 'assistant' ? 'assistant' : msg?.role === 'tool' ? 'tool' : 'user';

    const parts: ChatPart[] = [];

    if (typeof msg?.content === 'string' && msg.content) {
      parts.push({ type: 'text', text: msg.content });
    } else if (Array.isArray(msg?.content)) {
      msg.content.forEach((part: any) => {
        if (typeof part === 'string') {
          parts.push({ type: 'text', text: part });
        } else if (part?.type === 'text') {
          parts.push({ type: 'text', text: part.text ?? '' });
        }
      });
    }

    if (Array.isArray(msg?.tool_calls)) {
      msg.tool_calls.forEach((tc: any) => {
        parts.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function?.name,
          input: parseToolArguments(tc.function?.arguments),
        });
      });
    }

    if (role === 'tool') {
      return {
        role: 'tool',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.tool_call_id,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? ''),
            is_error: msg.is_error ?? String(msg.content ?? '').toLowerCase().includes('error'),
          },
        ],
      };
    }

    return { role, content: parts };
  });

const normalizeAnthropicSystem = (system: any[]): NormalizedSystemBlock[] =>
  system.map((item) => ({
    type: item?.type ?? 'text',
    text: item?.text ?? (typeof item === 'string' ? item : JSON.stringify(item)),
  }));

const normalizeAnthropicTools = (tools: any[]): NormalizedTool[] =>
  tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    schema: tool.input_schema,
  }));

const normalizeOpenAITools = (tools: any[]): NormalizedTool[] =>
  tools.map((tool) => ({
    name: tool.function?.name ?? tool.name ?? 'unknown',
    description: tool.function?.description ?? tool.description,
    schema: tool.function?.parameters ?? tool.parameters ?? tool.input_schema,
  }));

export const normalizeAnthropicDialogue = (raw: any): ChatHistory | null => {
  if (!raw || !Array.isArray(raw.messages)) return null;

  return {
    provider: 'anthropic',
    model: typeof raw.model === 'string' ? raw.model : 'unknown',
    messages: normalizeAnthropicMessages(raw.messages),
    system: Array.isArray(raw.system) ? normalizeAnthropicSystem(raw.system) : [],
    tools: Array.isArray(raw.tools) ? normalizeAnthropicTools(raw.tools) : [],
    usage: raw.usage,
  };
};

export const normalizeOpenAIDialogue = (raw: any): ChatHistory | null => {
  if (!raw || !Array.isArray(raw.messages)) return null;

  return {
    provider: 'openai',
    model: typeof raw.model === 'string' ? raw.model : 'unknown',
    messages: normalizeOpenAIMessages(raw.messages),
    system: extractOpenAISystem(raw),
    tools: Array.isArray(raw.tools) ? normalizeOpenAITools(raw.tools) : [],
    usage: raw.usage,
  };
};

export const normalizeDialogue = (raw: any): ChatHistory | null => {
  const provider = detectDialogueProvider(raw);
  if (!provider) return null;

  return provider === 'openai'
    ? normalizeOpenAIDialogue(raw)
    : normalizeAnthropicDialogue(raw);
};
