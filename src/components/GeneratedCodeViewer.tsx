import React, { useState } from 'react';
import { IntermediateRepresentation } from '../types/floe';
import { getAllGeneratedFiles, GeneratedFile } from '../engine/codegenEngine';
import { Copy, Check, FileCode, Terminal, Download } from 'lucide-react';

interface GeneratedCodeViewerProps {
  ir: IntermediateRepresentation;
  onDownloadZip: () => void;
}

export const GeneratedCodeViewer: React.FC<GeneratedCodeViewerProps> = ({
  ir,
  onDownloadZip
}) => {
  const files = getAllGeneratedFiles(ir);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile = files[activeFileIndex] || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-slate-100 flex flex-col md:flex-row h-[620px]">
      
      {/* File Tree Sidebar */}
      <div className="w-full md:w-64 bg-slate-950 border-b md:border-b-0 md:border-r border-slate-800 p-3 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-2 py-2 border-b border-slate-800/80 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Source Artifacts ({files.length})
          </span>
          <span className="text-[10px] font-mono text-emerald-400">100% Deterministic</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {files.map((file, idx) => {
            const isActive = activeFileIndex === idx;
            return (
              <button
                key={file.path}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{file.path}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 mt-2">
          <button
            onClick={onDownloadZip}
            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        
        {/* File Header */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">{currentFile.path}</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {currentFile.language}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{currentFile.description}</p>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre">{currentFile.content}</pre>
        </div>
      </div>
    </div>
  );
};
