
import React, { RefObject } from 'react';
import { PROVIDER_LIST, Provider as ExampleProvider } from '../examples';

interface HeaderProps {
  exampleTemplate: ExampleProvider;
  exampleSelectRef: RefObject<HTMLSelectElement | null>;
  onExampleTemplateChange: (provider: ExampleProvider) => void;
  onLoadSseExample: () => void;
  onLoadDialogueExample: () => void;
  onClear: () => void;
}

const Header: React.FC<HeaderProps> = ({
  exampleTemplate,
  exampleSelectRef,
  onExampleTemplateChange,
  onLoadSseExample,
  onLoadDialogueExample,
  onClear,
}) => {
  return (
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
            onChange={(e) => onExampleTemplateChange(e.target.value as ExampleProvider)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {PROVIDER_LIST.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <button
          onClick={onLoadSseExample}
          className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
        >
          Load SSE Example
        </button>
        <button
          onClick={onLoadDialogueExample}
          className="px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
        >
          Load Dialogue Example
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
        >
          Clear
        </button>
      </div>
    </header>
  );
};

export default Header;
