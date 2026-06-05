
import { MessageState, Provider, SSEEvent } from '../types';
import { reconstructAnthropicMessage } from './anthropicReconstructor';
import { detectSSEProvider } from './formatDetector';
import { reconstructOpenAIMessage } from './openaiReconstructor';

export const reconstructMessage = (events: SSEEvent[], provider?: Provider): MessageState => {
  const resolved = provider ?? detectSSEProvider(events);
  return resolved === 'openai'
    ? reconstructOpenAIMessage(events)
    : reconstructAnthropicMessage(events);
};
