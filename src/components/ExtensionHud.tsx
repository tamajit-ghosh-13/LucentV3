import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AccessibilityProfile, 
  VisualSettings, 
  CognitiveSettings, 
  MotorSettings, 
  TelemetryLog, 
  MutationStats 
} from '../types';
import { 
  Eye, 
  Brain, 
  MousePointer, 
  Zap, 
  Minimize2, 
  Maximize2, 
  Sliders, 
  Activity, 
  Sparkles, 
  Check, 
  AlertCircle,
  Keyboard,
  Shield,
  RefreshCw,
  Cpu,
  Timer,
  Magnet,
  ShieldAlert,
  Wand2
} from 'lucide-react';

interface ExtensionHudProps {
  currentProfile: AccessibilityProfile;
  onSelectProfile: (profile: AccessibilityProfile) => void;
  visual: VisualSettings;
  onUpdateVisual: (updated: Partial<VisualSettings>) => void;
  cognitive: CognitiveSettings;
  onUpdateCognitive: (updated: Partial<CognitiveSettings>) => void;
  motor: MotorSettings;
  onUpdateMotor: (updated: Partial<MotorSettings>) => void;
  stats: MutationStats;
  telemetryLogs: TelemetryLog[];
  onTriggerRageClickSim: () => void;
  onTriggerGeminiScanSim: () => void;
  isScanningAi: boolean;
  onTriggerMotorAutopilot?: () => void;
  isAutopilotRunning?: boolean;
}

export const ExtensionHud: React.FC<ExtensionHudProps> = ({
  currentProfile,
  onSelectProfile,
  visual,
  onUpdateVisual,
  cognitive,
  onUpdateCognitive,
  motor,
  onUpdateMotor,
  stats,
  telemetryLogs,
  onTriggerRageClickSim,
  onTriggerGeminiScanSim,
  isScanningAi,
  onTriggerMotorAutopilot,
  isAutopilotRunning
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(true);

  if (isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => setIsMinimized(false)}
        className="absolute bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-violet-700 text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-indigo-400/40 text-xs font-semibold select-none group"
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
        </span>
        <Sparkles size={14} className="text-cyan-300" />
        <span>Lucent HUD</span>
        <span className="bg-indigo-900/80 px-1.5 py-0.5 rounded text-[10px] text-indigo-200">
          {currentProfile.toUpperCase()}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.aside 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      aria-label="Lucent Extension HUD"
      className="w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 overflow-hidden cursor-move mx-auto"
    >
      {/* HUD Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-inner">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-xs tracking-tight text-white">Lucent</span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                ACTIVE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 leading-none">Autonomous DOM Adaptation</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded transition-colors"
            title="Minimize HUD"
          >
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* Main HUD Body */}
      <div className="p-4 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
        
        {/* Profile Mode Switcher (Slide 4: Visual, Cognitive, Motor Profiles) */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
            <span>USER ACCESSIBILITY PROFILE</span>
            <span className="text-indigo-400 font-mono">Dynamic Mode</span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {/* Raw / Unfixed */}
            <button
              type="button"
              onClick={() => onSelectProfile('raw')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 font-semibold transition-all ${
                currentProfile === 'raw'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap size={14} />
              <span className="text-[10px]">Raw</span>
            </button>

            {/* Visual Impairment */}
            <button
              type="button"
              onClick={() => onSelectProfile('visual')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 font-semibold transition-all ${
                currentProfile === 'visual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Eye size={14} />
              <span className="text-[10px]">Visual</span>
            </button>

            {/* Cognitive / ADHD */}
            <button
              type="button"
              onClick={() => onSelectProfile('cognitive')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 font-semibold transition-all ${
                currentProfile === 'cognitive'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Brain size={14} />
              <span className="text-[10px]">Cognitive</span>
            </button>

            {/* Motor Impairment */}
            <button
              type="button"
              onClick={() => onSelectProfile('motor')}
              className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 font-semibold transition-all ${
                currentProfile === 'motor'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MousePointer size={14} />
              <span className="text-[10px]">Motor</span>
            </button>
          </div>
        </div>

        {/* =============================================================== */}
        {/* PROFILE-SPECIFIC FEATURE CONTROLS                               */}
        {/* =============================================================== */}
        
        {/* 1. Visual Impairment Controls */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-indigo-400 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <Eye size={13} />
              <span>Visual Impairment Mode</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">WCAG AAA ENGINE</span>
          </div>

          <div className="space-y-1.5 py-1 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300 block font-medium">High-Contrast Color Engine</span>
                <span className="text-[10px] text-slate-500">WCAG AAA compliant dark palette</span>
              </div>
              <input
                type="checkbox"
                checked={visual.highContrast}
                onChange={(e) => onUpdateVisual({ highContrast: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
            </div>
            {visual.highContrast && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Palette:</span>
                <button
                  type="button"
                  onClick={() => onUpdateVisual({ contrastTheme: 'yellow-black' })}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                    visual.contrastTheme === 'yellow-black'
                      ? 'bg-yellow-400 text-black font-bold ring-1 ring-yellow-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Yellow / Black
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateVisual({ contrastTheme: 'dark-slate' })}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                    visual.contrastTheme === 'dark-slate'
                      ? 'bg-cyan-400 text-black font-bold ring-1 ring-cyan-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cyan / Deep Dark
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium">AI Vision Scan (Multimodal)</span>
              <span className="text-[10px] text-slate-500">Hover unlabelled icons for AI descriptive tooltips</span>
            </div>
            <input
              type="checkbox"
              checked={visual.aiVisionLabelsEnabled}
              onChange={(e) => onUpdateVisual({ aiVisionLabelsEnabled: e.target.checked })}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="py-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-slate-300 block font-medium">Font Scale Slider</span>
                <span className="text-[10px] text-slate-500">Dynamically adjust size while preserving layout</span>
              </div>
              <span className="text-indigo-400 font-bold font-mono text-xs">{visual.fontScale}%</span>
            </div>
            <input
              type="range"
              min={100}
              max={200}
              step={5}
              value={visual.fontScale}
              onChange={(e) => onUpdateVisual({ fontScale: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
              <span>100% (Baseline)</span>
              <span>150%</span>
              <span>200% (Maximum)</span>
            </div>
          </div>
        </div>

        {/* 2. Cognitive / ADHD Controls */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-violet-400 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <Brain size={13} />
              <span>Cognitive / ADHD Impairment Mode</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">FOCUS SUITE</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium">De-clutter Toggle</span>
              <span className="text-[10px] text-slate-500">Remove banners & promotional content, highlight main reading area</span>
            </div>
            <input
              type="checkbox"
              checked={cognitive.declutter}
              onChange={(e) => onUpdateCognitive({ declutter: e.target.checked })}
              className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium">AI Simplify & Summarize</span>
              <span className="text-[10px] text-slate-500">Transforms dense text blocks into plain-language bullets with improved line spacing</span>
            </div>
            <input
              type="checkbox"
              checked={cognitive.simplifyText}
              onChange={(e) => onUpdateCognitive({ simplifyText: e.target.checked })}
              className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-slate-300 block font-medium">Dyslexia-Friendly Typography</span>
              <span className="text-[10px] text-slate-500">Specialized font metrics with increased tracking and line height</span>
            </div>
            <input
              type="checkbox"
              checked={cognitive.dyslexiaFont}
              onChange={(e) => onUpdateCognitive({ dyslexiaFont: e.target.checked })}
              className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Motor Impairment Controls */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
            <span className="flex items-center gap-1.5">
              <MousePointer size={13} />
              <span>Motor Impairment Mode</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">PRECISION SUITE</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium">Hitbox Expansion (&ge; 48x48px)</span>
              <span className="text-[10px] text-slate-500">Expands clickable area of buttons and links to &ge;48x48px with visual cues</span>
            </div>
            <input
              type="checkbox"
              checked={motor.hitboxExpansion}
              onChange={(e) => onUpdateMotor({ hitboxExpansion: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium">High-Visibility Tab Halo & Numbered Shortcuts</span>
              <span className="text-[10px] text-slate-500">Displays numbered shortcut badges [1-9] for focused navigation</span>
            </div>
            <input
              type="checkbox"
              checked={motor.focusNavigation}
              onChange={(e) => onUpdateMotor({ focusNavigation: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium">Steady Click Feature</span>
              <span className="text-[10px] text-slate-500">Debounce & tremor filter to reduce accidental clicks and precision requirements</span>
            </div>
            <input
              type="checkbox"
              checked={motor.steadyClick}
              onChange={(e) => onUpdateMotor({ steadyClick: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Virtual Dwell-Click (Zero-Click Navigation) */}
          <div className="py-1 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300 block font-medium flex items-center gap-1.5">
                  <Timer size={12} className="text-amber-400" />
                  <span>Virtual Dwell-Click</span>
                </span>
                <span className="text-[10px] text-slate-500">Zero physical click force (ALS / Eye-Gaze / Head-Pointer)</span>
              </div>
              <input
                type="checkbox"
                checked={motor.dwellClick}
                onChange={(e) => onUpdateMotor({ dwellClick: e.target.checked })}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
            </div>
            {motor.dwellClick && (
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded">
                <span>Countdown Delay:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateMotor({ dwellDelay: 500 })}
                    className={`px-1.5 py-0.5 rounded ${motor.dwellDelay === 500 ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    500ms
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMotor({ dwellDelay: 750 })}
                    className={`px-1.5 py-0.5 rounded ${motor.dwellDelay === 750 ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    750ms
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMotor({ dwellDelay: 1000 })}
                    className={`px-1.5 py-0.5 rounded ${motor.dwellDelay === 1000 ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}
                  >
                    1000ms
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Magnetic Target Gravity */}
          <div className="flex items-center justify-between py-1 border-b border-slate-800/50">
            <div>
              <span className="text-slate-300 block font-medium flex items-center gap-1.5">
                <Magnet size={12} className="text-amber-400" />
                <span>Target Gravity & Snapping</span>
              </span>
              <span className="text-[10px] text-slate-500">Dynamic magnetic field pulls cursor to nearest button (Tremor stabilizer)</span>
            </div>
            <input
              type="checkbox"
              checked={motor.magneticGravity}
              onChange={(e) => onUpdateMotor({ magneticGravity: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Hold-to-Confirm Spasm Protection */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-slate-300 block font-medium flex items-center gap-1.5">
                <ShieldAlert size={12} className="text-amber-400" />
                <span>Hold-to-Confirm (Spasm Shield)</span>
              </span>
              <span className="text-[10px] text-slate-500">Requires 600ms hold on destructive actions to prevent accidental spasm triggers</span>
            </div>
            <input
              type="checkbox"
              checked={motor.holdToConfirm}
              onChange={(e) => onUpdateMotor({ holdToConfirm: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Interactive Triggers for Judges & Evaluators */}
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
            Judge Simulation Triggers (Slide 10)
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onTriggerRageClickSim}
              className="p-2 rounded-lg bg-rose-950/60 border border-rose-700/60 hover:bg-rose-900/60 text-rose-200 font-semibold text-[10px] flex flex-col items-center justify-center gap-1 text-center transition-colors shadow-sm"
              title="Simulates user repeatedly missing target to trigger Reinforcement Learning adaptation"
            >
              <Zap size={13} className="text-rose-400" />
              <span>Rage-Click (RL)</span>
            </button>

            <button
              type="button"
              disabled={isScanningAi}
              onClick={onTriggerGeminiScanSim}
              className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/60 hover:bg-cyan-900/60 text-cyan-200 font-semibold text-[10px] flex flex-col items-center justify-center gap-1 text-center transition-colors shadow-sm disabled:opacity-50"
              title="Simulates Gemini 1.5/2.0 multimodal visual analysis of unlabelled DOM nodes"
            >
              <Cpu size={13} className={isScanningAi ? "animate-spin text-cyan-400" : "text-cyan-400"} />
              <span>{isScanningAi ? "Scanning..." : "Vision Scan"}</span>
            </button>

            <button
              type="button"
              disabled={isAutopilotRunning}
              onClick={onTriggerMotorAutopilot}
              className="p-2 rounded-lg bg-amber-950/60 border border-amber-600/60 hover:bg-amber-900/60 text-amber-200 font-semibold text-[10px] flex flex-col items-center justify-center gap-1 text-center transition-colors shadow-sm disabled:opacity-50"
              title="Simulates Gemini 2.0 Flash Form Intent Synthesis to auto-fill form in 1 macro action"
            >
              <Wand2 size={13} className={isAutopilotRunning ? "animate-spin text-amber-400" : "text-amber-400"} />
              <span>{isAutopilotRunning ? "Synthesizing..." : "Motor AI"}</span>
            </button>
          </div>
        </div>

        {/* User Convenience: Big Collapse Button */}
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="w-full mt-4 py-2.5 bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-indigo-500 shadow-sm"
        >
          <Minimize2 size={14} />
          <span>Save & Hide Panel</span>
        </button>

      </div>

      {/* Real-time Telemetry & RL Feedback Drawer (Slide 10) */}
      <div className="border-t border-slate-800 bg-slate-950 p-3 text-[11px]">
        <button
          type="button"
          onClick={() => setShowTelemetryDrawer(!showTelemetryDrawer)}
          className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 font-semibold mb-2"
        >
          <span className="flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-400" />
            <span>Online RL & DOM Telemetry Stream</span>
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
            {showTelemetryDrawer ? 'Collapse' : 'Expand'}
          </span>
        </button>

        {showTelemetryDrawer && (
          <div className="space-y-2">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <div className="text-sm font-bold text-indigo-400 font-mono">{stats.ariaTagsInjected}</div>
                <div className="text-[9px] text-slate-400 uppercase">ARIA Fixed</div>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <div className="text-sm font-bold text-amber-400 font-mono">{stats.hitboxesEnlarged}</div>
                <div className="text-[9px] text-slate-400 uppercase">Hitboxes &ge;48</div>
              </div>
              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                <div className="text-sm font-bold text-cyan-400 font-mono">{stats.contrastPatchesApplied}</div>
                <div className="text-[9px] text-slate-400 uppercase">Contrast Patched</div>
              </div>
            </div>

            {/* Live Event Stream */}
            <div className="h-24 overflow-y-auto bg-black/70 p-2 rounded-lg border border-slate-800/80 font-mono text-[10px] space-y-1">
              {telemetryLogs.map((log) => (
                <div key={log.id} className="leading-snug flex items-start gap-1 text-slate-300">
                  <span className="text-slate-400 shrink-0">[{log.timestamp}]</span>
                  <span className={`font-bold shrink-0 ${
                    log.badgeType === 'rose' ? 'text-rose-400' :
                    log.badgeType === 'amber' ? 'text-amber-400' :
                    log.badgeType === 'purple' ? 'text-purple-400' :
                    log.badgeType === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    [{log.category}]
                  </span>
                  <span className="truncate">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </motion.aside>
  );
};
