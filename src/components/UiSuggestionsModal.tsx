import React from 'react';
import { UI_SUGGESTIONS } from '../data/uiSuggestions';
import { Sparkles, X, Check, Copy, Lightbulb, Shield, Clock, Calculator } from 'lucide-react';

interface UiSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UiSuggestionsModal: React.FC<UiSuggestionsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = (id: string, snippet?: string) => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 border border-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">UI / UX Design Suggestions for Floe Apps</h2>
              <p className="text-xs text-slate-500">Architectural heuristics for internal enterprise tools & human-in-the-loop workflows.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 leading-relaxed">
            <b className="font-semibold text-indigo-950 flex items-center gap-1.5 mb-1">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              Core Enterprise UI Principles
            </b>
            Internal enterprise applications succeed when they prioritize <b>speed of decision-making</b>, <b>radical transparency on AI vs rule-based decisions</b>, and <b>frictionless notifications</b> over decorative aesthetics.
          </div>

          <div className="grid grid-cols-1 gap-5">
            {UI_SUGGESTIONS.map((sug) => (
              <div
                key={sug.id}
                className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-indigo-700 border border-slate-200">
                      {sug.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{sug.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sug.summary}</p>
                  </div>
                </div>

                {/* Rationale */}
                <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block mb-0.5">Why this matters:</span>
                  <p className="leading-relaxed">{sug.rationale}</p>
                </div>

                {/* Code Snippet */}
                {sug.codeSnippet && (
                  <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-[11px] relative overflow-x-auto">
                    <button
                      onClick={() => handleCopyCode(sug.id, sug.codeSnippet)}
                      className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 flex items-center gap-1"
                    >
                      {copiedId === sug.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <pre className="whitespace-pre">{sug.codeSnippet}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
