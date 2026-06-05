import anthropicSse from './anthropic/sse.txt?raw';
import anthropicDialogue from './anthropic/dialogue.json?raw';
import openaiSse from './openai/sse.txt?raw';
import openaiDialogue from './openai/dialogue.json?raw';

export type Provider = 'anthropic' | 'openai';

export interface ProviderExamples {
  sse: string;
  dialogue: string;
}

export const PROVIDER_LIST: Provider[] = ['anthropic', 'openai'];

export const PROVIDER_EXAMPLES: Partial<Record<Provider, ProviderExamples>> = {
  anthropic: {
    sse: anthropicSse,
    dialogue: anthropicDialogue,
  },
  openai: {
    sse: openaiSse,
    dialogue: openaiDialogue,
  },
};

export const DEFAULT_PROVIDER: Provider = 'anthropic';

export const getProviderExamples = (provider: Provider = DEFAULT_PROVIDER): ProviderExamples | null =>
  PROVIDER_EXAMPLES[provider] ?? null;
