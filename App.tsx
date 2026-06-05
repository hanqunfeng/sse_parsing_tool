
import React, { useState } from 'react';
import MessagePreview from './components/MessagePreview';
import ChatHistoryView from './components/ChatHistory';
import Header from './components/Header';
import InputEditorModal from './components/InputEditorModal';
import { useInspector } from './hooks/useInspector';
import EventList from './components/EventList';

const App: React.FC = () => {
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const {
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
  } = useInspector();

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        exampleTemplate={exampleTemplate}
        exampleSelectRef={exampleSelectRef}
        onExampleTemplateChange={setExampleTemplate}
        onLoadSseExample={() => loadExample('sse')}
        onLoadDialogueExample={() => loadExample('dialogue')}
        onClear={clear}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 flex flex-col border-r border-slate-200 h-[calc(100vh-73px)]">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center gap-2">
              <span>RAW DATA INPUT</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInputModalOpen(true)}
                  aria-label="Expand input editor"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-transparent hover:border-indigo-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <span className={`px-2 py-0.5 rounded ${viewMode === 'sse' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  Detected: {detectionLabel}
                </span>
              </div>
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
                <EventList events={events} />
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

      <InputEditorModal
        open={isInputModalOpen}
        value={inputText}
        onChange={setInputText}
        onClose={() => setIsInputModalOpen(false)}
        detectionLabel={detectionLabel}
        parseError={parseError}
      />
    </div>
  );
};

export default App;
