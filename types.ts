
export type Provider = 'anthropic' | 'openai';

export interface SSEEvent {
  event: string;
  data: string;
  parsedData?: any;
  id?: string;
  timestamp: number;
}

export interface ContentBlock {
  type: 'thinking' | 'text' | 'tool_use' | 'tool_result';
  content: string;
  id?: string;
  name?: string;
  input?: any;
  signature?: string;
  is_error?: boolean;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  reasoning_tokens?: number;
}

export interface MessageState {
  provider?: Provider;
  model?: string;
  role?: string;
  blocks: ContentBlock[];
  usage?: TokenUsage;
  stop_reason?: string;
}

export interface ChatPart {
  type: string;
  text?: string;
  thinking?: string;
  signature?: string;
  id?: string;
  name?: string;
  input?: any;
  content?: string | any;
  is_error?: boolean;
  tool_use_id?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: ChatPart[];
}

export interface NormalizedSystemBlock {
  type: string;
  text: string;
}

export interface NormalizedTool {
  name: string;
  description?: string;
  schema?: any;
}

export interface ChatHistory {
  provider: Provider;
  model: string;
  messages: ChatMessage[];
  system?: NormalizedSystemBlock[];
  tools?: NormalizedTool[];
  usage?: any;
}
