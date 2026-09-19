import React from 'react';
import { 
  Lock, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Puzzle, 
  Sparkles, 
  Layers, 
  Download, 
  ExternalLink,
  Code
} from 'lucide-react';

interface BrowserBarProps {
  url: string;
  activeMutationsCount: number;
  viewMode: 'overlay' | 'split';
  onToggleViewMode: (mode: 'overlay' | 'split') => void;
  onOpenArtifactModal: () => void;
  onResetPortal: () => void;
  extensionActive: boolean;
}

export const BrowserBar: React.FC<BrowserBarProps> = ({
  url,
  activeMutationsCount,
  viewMode,
  onToggleViewMode,
  onOpenArtifactModal,
  onResetPortal,
  extensionActive
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 select-none sticky top-0 z-40 shadow-md">
      {/* Mac-style traffic lights + browser navigation buttons */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/90 border border-rose-600/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-600/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-600/50" />
        </div>

        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <button 
            type="button" 
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Back"
          >
            <ArrowLeft size={15} />
          </button>
          <button 
            type="button" 
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Forward"
          >
            <ArrowRight size={15} />
          </button>
          <button 
            type="button" 
            onClick={onResetPortal}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Reload Target Page"
          >
            <RotateCw size={15} />
          </button>
        </div>
      </div>

      {/* Omnibox / URL address bar */}
      <div className="flex-1 max-w-2xl bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-slate-300 shadow-inner">
        <Lock size={13} className="text-emerald-400 shrink-0" />
        <span className="text-emerald-400 font-semibold">https://</span>
        <span className="truncate text-slate-200">{url}</span>
        <span className="ml-auto text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded font-sans shrink-0 hidden md:inline">
          DOM Live Hooked
        </span>
      </div>

      {/* Extension status & controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* View Mode Toggle: Floating HUD vs Side-by-Side Split */}
        <div className="hidden lg:flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onToggleViewMode('overlay')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'overlay' 
                ? 'bg-indigo-600 text-white font-medium' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={13} />
            <span>Floating HUD</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('split')}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'split' 
                ? 'bg-indigo-600 text-white font-medium' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Split View</span>
          </button>
        </div>

        {/* Chrome Extension Toolbar Icon */}
        <div className="relative flex items-center">
          <div 
            className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-700/60 text-indigo-200 hover:bg-indigo-900 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm"
            title="Lucent Chrome Extension (Manifest V3)"
          >
            <Puzzle size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">Lucent</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {activeMutationsCount > 0 && (
              <span className="ml-1 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {activeMutationsCount}
              </span>
            )}
          </div>
        </div>

        {/* Single-File HTML Artifact Download / View Modal */}
        <button
          type="button"
          onClick={onOpenArtifactModal}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
          title="Download complete self-contained index.html prototype"
        >
          <Code size={14} className="text-cyan-400" />
          <span className="hidden md:inline">Standalone Artifact</span>
          <Download size={13} className="text-slate-400" />
        </button>

        {/* Direct link to public/standalone.html */}
        <a
          href="/standalone.html"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors hidden sm:block"
          title="Open Pure Standalone index.html in New Tab"
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </header>
  );
};
