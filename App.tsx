
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parseRawSSE } from './services/sseParser';
import { reconstructMessage } from './services/reconstructMessage';
import { normalizeDialogue } from './services/dialogueNormalizer';
import { detectSSEProvider } from './services/formatDetector';
import { SSEEvent, MessageState, ChatHistory, Provider } from './types';
import EventItem from './components/EventItem';
import MessagePreview from './components/MessagePreview';
import ChatHistoryView from './components/ChatHistory';
import { DEFAULT_PROVIDER, getProviderExamples, PROVIDER_LIST, Provider as ExampleProvider } from './examples';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [exampleTemplate, setExampleTemplate] = useState<ExampleProvider>(DEFAULT_PROVIDER);
  const exampleSelectRef = useRef<HTMLSelectElement>(null);
  const [detectedProvider, setDetectedProvider] = useState<Provider | null>(null);
  const [viewMode, setViewMode] = useState<'sse' | 'dialogue'>('sse');
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [messageState, setMessageState] = useState<MessageState>({ blocks: [] });
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = useCallback(() => {
    if (!inputText.trim()) {
      setEvents([]);
      setMessageState({ blocks: [] });
      setChatHistory(null);
      setDetectedProvider(null);
      setParseError(null);
      return;
    }

    try {
      const json = JSON.parse(inputText);
      const normalized = normalizeDialogue(json);
      if (normalized) {
        setViewMode('dialogue');
        setChatHistory(normalized);
        setDetectedProvider(normalized.provider);
        setExampleTemplate(normalized.provider);
        setEvents([]);
        setMessageState({ blocks: [] });
        setParseError(null);
        return;
      }
    } catch {
      // Not JSON — try SSE parsing
    }

    try {
      const parsed = parseRawSSE(inputText);
      const provider = detectSSEProvider(parsed);
      const reconstructed = reconstructMessage(parsed, provider);

      setViewMode('sse');
      setChatHistory(null);
      setEvents(parsed);
      setMessageState(reconstructed);
      setDetectedProvider(provider);
      setExampleTemplate(provider);
      setParseError(null);
    } catch {
      setEvents([]);
      setMessageState({ blocks: [] });
      setChatHistory(null);
      setDetectedProvider(null);
      setParseError('解析失败：输入内容格式异常，请检查是否为完整 JSON 或 SSE 文本。');
    }
  }, [inputText]);

  useEffect(() => {
    handleParse();
  }, [handleParse]);

  const loadExample = (type: 'sse' | 'dialogue') => {
    const provider = (exampleSelectRef.current?.value ?? exampleTemplate) as ExampleProvider;
    const examples = getProviderExamples(provider);
    if (examples) {
      setExampleTemplate(provider);
      setInputText(type === 'sse' ? examples.sse : examples.dialogue);
    }
  };

  const detectionLabel = detectedProvider
    ? `${viewMode.toUpperCase()} · ${detectedProvider.toUpperCase()}`
    : viewMode.toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">AI Protocol Inspector</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">SSE & Dialogue Stream Analyzer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold whitespace-nowrap">示例模板</span>
            <select
              ref={exampleSelectRef}
              value={exampleTemplate}
              onChange={(e) => setExampleTemplate(e.target.value as ExampleProvider)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {PROVIDER_LIST.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => loadExample('sse')}
            className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
          >
            Load SSE Example
          </button>
          <button
            onClick={() => loadExample('dialogue')}
            className="px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
          >
            Load Dialogue Example
          </button>
          <button
            onClick={() => { setInputText(''); setEvents([]); setChatHistory(null); setDetectedProvider(null); }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
          >
            Clear
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 flex flex-col border-r border-slate-200 h-[calc(100vh-73px)]">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
              <span>RAW DATA INPUT</span>
              <span className={`px-2 py-0.5 rounded ${viewMode === 'sse' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                Detected: {detectionLabel}
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste SSE stream or dialogue JSON (Anthropic / OpenAI)..."
              className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-[10px] mono resize-none"
            />
            {parseError && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {parseError}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {viewMode === 'sse' ? (
              <>
                <div className="px-4 py-3 bg-white border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Sequence ({events.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-white">
                  {events.map((ev) => <EventItem key={ev.id} event={ev} />)}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col bg-slate-100 p-8 items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-600">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 className="font-bold text-slate-700">Dialogue Mode Active</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dialogue JSON detected ({detectedProvider ?? 'unknown'}).<br />
                  Visualizing the full turn sequence on the right.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-2/3 flex flex-col h-[calc(100vh-73px)] bg-slate-50">
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-[5]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual Reconstruction</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
            {viewMode === 'sse' ? (
              <MessagePreview state={messageState} />
            ) : chatHistory ? (
              <ChatHistoryView history={chatHistory} />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
