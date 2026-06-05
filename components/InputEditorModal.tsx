import React, { useEffect, useMemo, useRef } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { foldAll, foldGutter, foldKeymap, unfoldAll } from '@codemirror/language';
import { defaultKeymap } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import { detectEditorLanguage } from '../utils/detectEditorLanguage';
import { formatJson } from '../utils/formatJson';

interface InputEditorModalProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  detectionLabel?: string;
  parseError?: string | null;
}

const InputEditorModal: React.FC<InputEditorModalProps> = ({
  open,
  value,
  onChange,
  onClose,
  detectionLabel,
  parseError,
}) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const language = detectEditorLanguage(value);
  const isJsonMode = language === 'json';

  const extensions = useMemo(() => {
    const base = [
      EditorView.lineWrapping,
      keymap.of([...defaultKeymap, ...foldKeymap]),
    ];

    if (isJsonMode) {
      return [...base, json(), foldGutter()];
    }

    return base;
  }, [isJsonMode]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      editorRef.current?.view?.focus();
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open, onClose]);

  const runEditorCommand = (command: (view: EditorView) => void) => {
    const view = editorRef.current?.view;
    if (view) command(view);
  };

  const handleFormat = () => {
    const formatted = formatJson(value);
    if (formatted !== null) onChange(formatted);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="RAW DATA INPUT editor"
        className="w-[min(1100px,95vw)] h-[min(85vh,900px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              RAW DATA INPUT
            </span>
            {detectionLabel && (
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                Detected: {detectionLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isJsonMode && (
              <>
                <button
                  type="button"
                  onClick={handleFormat}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white rounded-md border border-slate-200 transition-colors"
                >
                  Format
                </button>
                <button
                  type="button"
                  onClick={() => runEditorCommand(foldAll)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white rounded-md border border-slate-200 transition-colors"
                >
                  Fold All
                </button>
                <button
                  type="button"
                  onClick={() => runEditorCommand(unfoldAll)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white rounded-md border border-slate-200 transition-colors"
                >
                  Unfold All
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close input editor"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-hidden min-h-0">
          <CodeMirror
            ref={editorRef}
            value={value}
            height="100%"
            className="h-full rounded-xl border border-slate-200 overflow-hidden shadow-inner [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
            style={{ fontSize: '12px', fontFamily: "'Fira Code', monospace" }}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
              bracketMatching: true,
              spellcheck: false,
            }}
            extensions={extensions}
            onChange={onChange}
            placeholder="Paste SSE stream or dialogue JSON (Anthropic / OpenAI)..."
          />
        </div>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {parseError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {parseError}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputEditorModal;
