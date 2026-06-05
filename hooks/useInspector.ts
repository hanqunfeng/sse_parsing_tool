
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatHistory, MessageState, Provider, SSEEvent } from '../types';
import { DEFAULT_PROVIDER, getProviderExamples, Provider as ExampleProvider } from '../examples';
import { formatDetectionLabel, inspectInput, ViewMode } from '../services/inspectInput';

export const useInspector = () => {
  const [inputText, setInputText] = useState('');
  const [exampleTemplate, setExampleTemplate] = useState<ExampleProvider>(DEFAULT_PROVIDER);
  const exampleSelectRef = useRef<HTMLSelectElement>(null);
  const [detectedProvider, setDetectedProvider] = useState<Provider | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('sse');
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [messageState, setMessageState] = useState<MessageState>({ blocks: [] });
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const applyInspectResult = useCallback((result: ReturnType<typeof inspectInput>) => {
    switch (result.kind) {
      case 'empty':
        setEvents([]);
        setMessageState({ blocks: [] });
        setChatHistory(null);
        setDetectedProvider(null);
        setParseError(null);
        break;
      case 'dialogue':
        setViewMode('dialogue');
        setChatHistory(result.chatHistory);
        setDetectedProvider(result.provider);
        setExampleTemplate(result.provider);
        setEvents([]);
        setMessageState({ blocks: [] });
        setParseError(null);
        break;
      case 'sse':
        setViewMode('sse');
        setChatHistory(null);
        setEvents(result.events);
        setMessageState(result.messageState);
        setDetectedProvider(result.provider);
        setExampleTemplate(result.provider);
        setParseError(null);
        break;
      case 'error':
        setEvents([]);
        setMessageState({ blocks: [] });
        setChatHistory(null);
        setDetectedProvider(null);
        setParseError(result.message);
        break;
    }
  }, []);

  useEffect(() => {
    applyInspectResult(inspectInput(inputText));
  }, [inputText, applyInspectResult]);

  const loadExample = useCallback((type: 'sse' | 'dialogue') => {
    const provider = (exampleSelectRef.current?.value ?? exampleTemplate) as ExampleProvider;
    const examples = getProviderExamples(provider);
    if (examples) {
      setExampleTemplate(provider);
      setInputText(type === 'sse' ? examples.sse : examples.dialogue);
    }
  }, [exampleTemplate]);

  const clear = useCallback(() => {
    setInputText('');
    setEvents([]);
    setChatHistory(null);
    setDetectedProvider(null);
    setParseError(null);
  }, []);

  const detectionLabel = formatDetectionLabel(viewMode, detectedProvider);

  return {
    inputText,
    setInputText,
    exampleTemplate,
    setExampleTemplate,
    exampleSelectRef,
    detectedProvider,
    viewMode,
    events,
    messageState,
    chatHistory,
    parseError,
    detectionLabel,
    loadExample,
    clear,
  };
};
