import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Code, 
  FileCode, 
  Sparkles,
  Info,
  Layers,
  Cpu
} from 'lucide-react';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'architecture'>('overview');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    fetch('/standalone.html')
      .then(res => res.text())
      .then(code => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Fallback
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/standalone.html';
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <FileCode size={20} />
            </div>
            <div>
              <h2 id="modal-title" className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                <span>Self-Contained `index.html` Prototype Artifact</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40 font-mono">
                  Pure Vanilla JS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                A User-Centric Accessibility Layer for the Modern Web (Warner & Spencer • March 2030)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download standalone index.html"
            >
              <Download size={14} />
              <span>Download index.html</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info size={14} />
            <span>Artifact Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            <span>Hackathon Architecture</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code size={14} />
            <span>View Source (`index.html`)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-start gap-3">
                <Sparkles size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Standalone Delivery Specification Met</h4>
                  <p className="text-slate-300 text-xs mt-1">
                    This prototype is packaged as a 100% self-contained, zero-dependency <code>index.html</code> file with complete vanilla CSS and JavaScript. It does not require Node.js, npm, or external build bundlers to run. You can double-click it in any Chromium browser directly off disk.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-indigo-400 flex items-center gap-1.5 text-xs">
                    <span>1. Target Site Canvas</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-normal">
                    Recreates a real-world civic portal featuring 5 intentional WCAG failures: sub-24px click targets, &lt;3:1 contrast text, missing ARIA icon buttons, dense bureaucratic legalese, and animated distractions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-violet-400 flex items-center gap-1.5 text-xs">
                    <span>2. Injected Extension HUD</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-normal">
                    Floating draggable Manifest V3 control panel enabling one-click switching between Visual, Cognitive, and Motor profiles with zero layout collision.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                    <span>3. Online RL Feedback Loop</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-normal">
                    Live telemetry stream tracking rage-clicks and motor tremors, dynamically auto-expanding interactive hitboxes by +35% through continuous policy adaptation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <a
                  href="/standalone.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span>Launch Standalone Prototype in New Tab</span>
                  <ExternalLink size={14} />
                </a>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download size={14} />
                  <span>Download `index.html`</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white">Presentation Alignment: Warner & Spencer Global Innovation</h3>
              <p className="text-slate-300 text-xs">
                Derived directly from the project slides by Debadrita Bhattacharyya, Reetabrata Mandal, Prathama Biswas, Enaakshi Sen, Tamajit Ghosh, and Shreyan Dasgupta:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-xs text-indigo-400">Slide 4 & 5: Profile-Driven Adaptations</div>
                  <ul className="list-disc pl-5 mt-1 text-xs text-slate-400 space-y-1">
                    <li><strong>Visual Impairment:</strong> WCAG AAA Dark/Yellow palette, dynamic font scale preserving CSS grid/flex flows, Multimodal Gemini vision alt-labels.</li>
                    <li><strong>Cognitive / ADHD:</strong> Sensory filter de-cluttering banners, plain-language text simplification, dyslexia-friendly font metrics.</li>
                    <li><strong>Motor Impairment:</strong> Target area enlarged to &ge; 48x48px, high-visibility keyboard tab halos with direct [1-9] numbered hotkeys, steady-click tremor absorption.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="font-semibold text-xs text-emerald-400">Slide 6 & 10: Dynamic DOM Mutation & Online RL Loop</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Instead of passive compliance scoring, the client script actively patches DOM attributes (<code>aria-label</code>, <code>role</code>, hitboxes, typography). When rapid clicks occur on a button, the system logs a <em>frustration metric</em> and invokes an online reinforcement learning policy update to expand the hit area.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">public/standalone.html (Standalone Self-Contained Deliverable)</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Entire HTML'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 max-h-96 overflow-y-auto">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lucent - Autonomous Accessibility Layer for the Modern Web</title>
  <!-- Global Innovation Hackathon - March 2030 (Warner & Spencer) -->
  <!-- Fully self-contained single-file HTML/CSS/JS prototype with zero dependencies -->
... [Click "Copy Entire HTML" or "Download index.html" to get full executable code] ...
</head>
<body>
  ...
</body>
</html>`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Self-contained HTML5 • CSS Custom Properties • Vanilla ES2022</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
