import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  VisualSettings, 
  CognitiveSettings, 
  MotorSettings 
} from '../types';
import { PORTAL_DATA } from '../data/portalData';
import { 
  HelpCircle, 
  Save, 
  FileSearch, 
  Trash2, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Edit3, 
  Check,
  ShieldCheck,
  MousePointer2,
  Timer,
  Magnet
} from 'lucide-react';

interface TargetPortalProps {
  visual: VisualSettings;
  cognitive: CognitiveSettings;
  motor: MotorSettings;
  onSimulateRageClick: () => void;
  onElementAction: (actionName: string) => void;
  rageCount: number;
}

export const TargetPortal: React.FC<TargetPortalProps> = ({
  visual,
  cognitive,
  motor,
  onSimulateRageClick,
  onElementAction,
  rageCount
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [steadyIndicator, setSteadyIndicator] = useState<{ x: number; y: number; active: boolean } | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Advanced Motor State: Dwell-Click, Hold-to-Confirm, and Target Gravity
  const [dwellState, setDwellState] = useState<{ id: string; progress: number; x: number; y: number } | null>(null);
  const dwellTimerRef = useRef<number | null>(null);

  const [holdingTarget, setHoldingTarget] = useState<{ id: string; progress: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const [magneticTargetId, setMagneticTargetId] = useState<string | null>(null);

  const [dependents, setDependents] = useState([
    { id: 1, name: "Marcus Vance", relation: "Spouse", dob: "1988-04-12" },
    { id: 2, name: "Maya Vance", relation: "Child / Dependent", dob: "2018-09-23" }
  ]);

  const removeDependent = (id: number) => {
    setDependents(dependents.filter(d => d.id !== id));
    onElementAction(`Removed Dependent #${id}`);
  };

  // Steady Click Interceptor: Filters tremors, accidental rapid double clicks & absorbs jitter
  const handleProtectedClick = (
    e: React.MouseEvent<HTMLElement>,
    actionName: string,
    callback: () => void
  ) => {
    const now = Date.now();
    const timeSinceLast = now - lastClickTimeRef.current;

    if (motor.steadyClick && timeSinceLast < 450) {
      // Absorb accidental bounce/tremor double click
      e.preventDefault();
      e.stopPropagation();
      onElementAction(`Steady Click absorbed accidental bounce click (${timeSinceLast}ms gap)`);
      return;
    }

    lastClickTimeRef.current = now;

    // Show visual stabilization feedback if steadyClick is active
    if (motor.steadyClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSteadyIndicator({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        active: true
      });
      setTimeout(() => setSteadyIndicator(null), 400);
    }

    callback();
  };

  // Virtual Dwell-Click (Zero-Click Navigation for Quadriplegia/ALS/Eye-gaze)
  const handleDwellEnter = (
    id: string, 
    actionName: string, 
    callback: () => void, 
    e: React.MouseEvent<HTMLElement>
  ) => {
    if (!motor.dwellClick) return;
    if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    const startTime = Date.now();
    const delay = motor.dwellDelay || 750;

    setDwellState({ id, progress: 0, x: rect.left + rect.width / 2, y: rect.top - 14 });

    dwellTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(100, (elapsed / delay) * 100);
      setDwellState(prev => prev ? { ...prev, progress: prog } : null);

      if (elapsed >= delay) {
        if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
        dwellTimerRef.current = null;
        setDwellState(null);
        onElementAction(`Zero-Click Dwell triggered [${actionName}] after ${delay}ms hover`);
        callback();
      }
    }, 25);
  };

  const handleDwellLeave = () => {
    if (dwellTimerRef.current) {
      clearInterval(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    setDwellState(null);
  };

  // Hold-to-Confirm for Destructive Actions (Spasm & Involuntary Jerk Protection)
  const handleHoldStart = (id: string, actionName: string, callback: () => void) => {
    if (!motor.holdToConfirm) {
      callback();
      return;
    }
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);

    const startTime = Date.now();
    const requiredHoldMs = 600;
    setHoldingTarget({ id, progress: 0 });

    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(100, (elapsed / requiredHoldMs) * 100);
      setHoldingTarget({ id, progress: prog });

      if (elapsed >= requiredHoldMs) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        setHoldingTarget(null);
        onElementAction(`Hold-to-Confirm verified (sustained ${requiredHoldMs}ms): executed [${actionName}]`);
        callback();
      }
    }, 20);
  };

  const handleHoldEnd = (id: string, actionName: string) => {
    if (!motor.holdToConfirm) return;
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
      setHoldingTarget(null);
      onElementAction(`Spasm Filter: absorbed premature trigger on [${actionName}] (<600ms hold)`);
    }
  };

  // Magnetic Target Gravity Proximity Detection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!motor.magneticGravity) {
      if (magneticTargetId) setMagneticTargetId(null);
      return;
    }

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const targets = document.querySelectorAll<HTMLElement>('[data-magnetic="true"]');
    let closestId: string | null = null;
    let minDistance = 50;

    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(mouseX - centerX, mouseY - centerY);

      if (dist < minDistance) {
        minDistance = dist;
        closestId = el.id || el.getAttribute('data-shortcut') || null;
      }
    });

    if (closestId !== magneticTargetId) {
      setMagneticTargetId(closestId);
    }
  };

  // Base typography & contrast classes based on active profile settings
  const isHighContrast = visual.highContrast;
  const isDarkSlate = isHighContrast && visual.contrastTheme === 'dark-slate';
  const isDyslexic = cognitive.dyslexiaFont;
  const isHitboxExpanded = motor.hitboxExpansion;
  const isFocusNav = motor.focusNavigation;

  // Compute CSS styles based on settings
  const containerStyle: React.CSSProperties = {
    fontSize: `${visual.fontScale}%`,
    lineHeight: isDyslexic ? 1.85 : 1.5,
    letterSpacing: isDyslexic ? '0.08em' : 'normal',
    wordSpacing: isDyslexic ? '0.12em' : 'normal'
  };

  // High-contrast color mappings
  const bgMain = isHighContrast 
    ? (isDarkSlate ? 'bg-slate-950 text-cyan-300' : 'bg-black text-yellow-300') 
    : 'bg-slate-50 text-slate-900';

  const cardBg = isHighContrast
    ? (isDarkSlate ? 'bg-slate-900 border-2 border-cyan-400 shadow-cyan-500/10' : 'bg-neutral-950 border-2 border-yellow-400 shadow-yellow-500/10')
    : 'bg-white border border-slate-200';

  const primaryAccentText = isHighContrast
    ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300')
    : 'text-blue-600';

  const headerBorder = isHighContrast
    ? (isDarkSlate ? 'border-cyan-400/40' : 'border-yellow-400/40')
    : 'border-slate-100';

  // Common high-visibility keyboard tab halo class
  const tabHaloClass = isFocusNav ? 'tab-halo-active focus:outline-none' : '';

  return (
    <div 
      onMouseMove={handleMouseMove}
      className={`min-h-full transition-colors duration-300 p-4 sm:p-8 ${bgMain} ${isDyslexic ? 'font-dyslexic' : 'font-sans'} relative`}
      style={containerStyle}
    >
      {/* Steady Click Visual Stabilization Ripple Effect */}
      <AnimatePresence>
        {steadyIndicator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: steadyIndicator.x, top: steadyIndicator.y }}
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-400/20 absolute" 
            />
            <div className="absolute text-[10px] font-bold text-amber-300 bg-black/80 px-1.5 py-0.5 rounded shadow whitespace-nowrap">
              Steady Click ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual Dwell-Click Radial Countdown Overlay (Zero-Click Navigation) */}
      <AnimatePresence>
        {dwellState && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.15 }}
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full flex flex-col items-center"
            style={{ left: dwellState.x, top: dwellState.y }}
          >
            <div className="relative w-9 h-9 flex items-center justify-center filter drop-shadow-md">
              <svg className="w-9 h-9 -rotate-90">
                <circle cx="18" cy="18" r="14" className="stroke-slate-900 fill-black/80" strokeWidth="3" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="14" 
                  className="stroke-amber-400 fill-none transition-all duration-75" 
                  strokeWidth="3.5" 
                  strokeDasharray={87.96} 
                  strokeDashoffset={87.96 - (87.96 * dwellState.progress / 100)} 
                />
              </svg>
              <span className="absolute text-[9px] font-black text-amber-300 font-mono">
                {Math.round(dwellState.progress)}%
              </span>
            </div>
            <div className="text-[9px] font-bold text-amber-300 bg-black/90 border border-amber-500/50 px-1.5 py-0.5 rounded shadow whitespace-nowrap mt-0.5">
              Dwell Triggering...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ================================================================= */}
        {/* INTENTIONAL WCAG FAILURE 1: Distracting, Flashing High-Noise Banner */}
        {/* (Suppressed when Cognitive De-clutter is active)                   */}
        {/* ================================================================= */}
        {!cognitive.declutter ? (
          <div 
            id="portal-distraction-banner"
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-3.5 shadow-lg border-2 border-yellow-400 animate-pulse"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black tracking-wide">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-300 animate-bounce" />
                <span>
                  CRITICAL STATUTORY NOTICE: 12 HOURS REMAINING! FAST-TRACK YOUR AUDIT CLEARANCE (COMMERCIAL PARTNER ADVERTISEMENT)
                </span>
              </div>
              <button 
                type="button" 
                onClick={(e) => handleProtectedClick(e, 'Dismissed Banner', () => onElementAction('Dismissed Flash Banner'))}
                className="shrink-0 text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded font-bold uppercase tracking-wider"
              >
                Dismiss [✕]
              </button>
            </div>
            <div className="text-[10px] text-yellow-200 mt-1 flex items-center gap-1 font-mono">
              <span>WCAG Failure: Guideline 2.2.2 Pause, Stop, Hide & 2.3.1 Flashing Distraction</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl p-2.5 px-4 text-xs text-emerald-300 flex items-center justify-between shadow-sm animate-fade-in">
            <span className="flex items-center gap-2 font-medium">
              <Sparkles size={15} className="text-emerald-400" />
              <span>
                <strong>De-clutter Active:</strong> Suppressed promotional banners and flashing animations. Main reading area highlighted below.
              </span>
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
              WCAG 2.2.2 PASS
            </span>
          </div>
        )}

        {/* ================================================================= */}
        {/* MAIN PORTAL CARD (Highlighted when De-clutter is active)         */}
        {/* ================================================================= */}
        <main 
          id="main-reading-area"
          aria-label="Main Application Reading Area"
          className={`rounded-2xl transition-all duration-300 p-6 sm:p-8 shadow-sm relative ${cardBg} ${
            cognitive.declutter && !isHighContrast
              ? 'ring-4 ring-indigo-400/40 ring-offset-4 ring-offset-slate-100 shadow-xl'
              : cognitive.declutter && isHighContrast
              ? 'ring-4 ring-yellow-400/60 ring-offset-4 ring-offset-black shadow-2xl'
              : ''
          }`}
        >
          {/* De-clutter badge indicator on reading area */}
          {cognitive.declutter && (
            <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles size={11} />
              <span>Focused Reading Area</span>
            </div>
          )}

          {/* Portal Header */}
          <div className={`pb-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b ${headerBorder}`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isHighContrast 
                    ? (isDarkSlate ? 'bg-cyan-400 text-black font-extrabold' : 'bg-yellow-400 text-black font-extrabold') 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  Official Form 104-B
                </span>
                <span className={`text-xs ${isHighContrast ? (isDarkSlate ? 'text-cyan-200' : 'text-yellow-200') : 'text-slate-400'}`}>
                  Fiscal Year 2030
                </span>
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold mt-1 tracking-tight ${
                isHighContrast ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300') : 'text-slate-900'
              }`}>
                {PORTAL_DATA.documentTitle}
              </h1>

              {/* INTENTIONAL WCAG FAILURE 2: Low-contrast text (<3:1) patched in Visual Impairment Mode */}
              <p className={`text-xs sm:text-sm mt-1 transition-colors ${
                isHighContrast 
                  ? (isDarkSlate ? 'text-cyan-100 font-semibold' : 'text-yellow-100 font-semibold')
                  : 'text-slate-400' // Deliberately failing contrast on white background (~2.5:1)
              }`}>
                {PORTAL_DATA.subheading}
              </p>
            </div>

            {/* ============================================================= */}
            {/* INTENTIONAL WCAG FAILURE 3: Unlabelled Icon-only buttons       */}
            {/* (Simulated AI Vision Scan displays descriptive tooltips on    */}
            {/*  hover and injects accessible ARIA labels)                    */}
            {/* ============================================================= */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[10px] text-slate-400 font-mono hidden xl:block mr-1">
                {visual.aiVisionLabelsEnabled ? '✨ AI Vision Scan Active' : '⚠️ Missing ARIA'}
              </div>

              {/* Icon 1: Help (Shortcut: 1) */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-portal-help"
                  data-shortcut="1"
                  data-magnetic="true"
                  aria-label={visual.aiVisionLabelsEnabled ? PORTAL_DATA.unlabelledIcons[0].aiLabel : undefined}
                  onMouseEnter={(e) => {
                    visual.aiVisionLabelsEnabled && setActiveTooltip('help');
                    handleDwellEnter('btn-portal-help', 'Help Icon', () => onElementAction('Clicked Help Icon (Section 42-A)'), e);
                  }}
                  onMouseLeave={() => {
                    setActiveTooltip(null);
                    handleDwellLeave();
                  }}
                  onClick={(e) => handleProtectedClick(e, 'Clicked Help Icon', () => onElementAction('Clicked Help Icon (Section 42-A)'))}
                  className={`transition-all duration-200 flex items-center justify-center relative ${
                    isHitboxExpanded 
                      ? 'min-w-[48px] min-h-[48px] p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800' 
                      : 'w-6 h-6 p-1 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200'
                  } ${isHighContrast ? (isDarkSlate ? 'bg-black text-cyan-300 border-cyan-400' : 'bg-black text-yellow-300 border-yellow-400') : 'text-slate-600'} ${
                    visual.aiVisionLabelsEnabled ? 'ring-2 ring-indigo-400/50' : ''
                  } ${magneticTargetId === 'btn-portal-help' || magneticTargetId === '1' ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-400/30 scale-110' : ''} ${tabHaloClass}`}
                >
                  <HelpCircle size={isHitboxExpanded ? 20 : 13} />
                  {isHitboxExpanded && (
                    <span className="sr-only">Help</span>
                  )}
                  {isFocusNav && (
                    <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                      1
                    </span>
                  )}
                </button>
                {activeTooltip === 'help' && (
                  <div className="absolute right-0 top-full mt-2 z-40 w-72 p-3 rounded-xl bg-slate-950 text-slate-100 border-2 border-indigo-500 text-xs shadow-2xl pointer-events-none animate-fade-in">
                    <div className="flex items-center justify-between font-bold text-indigo-300 mb-1 border-b border-indigo-900/60 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-cyan-400" />
                        <span>Gemini Vision Scan</span>
                      </span>
                      <span className="text-[10px] bg-indigo-900/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                        99.2% Conf
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-200">{PORTAL_DATA.unlabelledIcons[0].aiLabel}</p>
                    <div className="mt-1 text-[9px] text-slate-400 font-mono">Injected: aria-label="Open contextual help guide..."</div>
                  </div>
                )}
              </div>

              {/* Icon 2: Save Draft (Shortcut: 2) */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-portal-save"
                  data-shortcut="2"
                  data-magnetic="true"
                  aria-label={visual.aiVisionLabelsEnabled ? PORTAL_DATA.unlabelledIcons[1].aiLabel : undefined}
                  onMouseEnter={(e) => {
                    visual.aiVisionLabelsEnabled && setActiveTooltip('save');
                    handleDwellEnter('btn-portal-save', 'Save Draft', () => onElementAction('Saved Draft to Cloud'), e);
                  }}
                  onMouseLeave={() => {
                    setActiveTooltip(null);
                    handleDwellLeave();
                  }}
                  onClick={(e) => handleProtectedClick(e, 'Saved Draft', () => onElementAction('Saved Draft to Cloud'))}
                  className={`transition-all duration-200 flex items-center justify-center relative ${
                    isHitboxExpanded 
                      ? 'min-w-[48px] min-h-[48px] p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100' 
                      : 'w-6 h-6 p-1 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200'
                  } ${isHighContrast ? (isDarkSlate ? 'bg-black text-cyan-300 border-cyan-400' : 'bg-black text-yellow-300 border-yellow-400') : 'text-slate-600'} ${
                    visual.aiVisionLabelsEnabled ? 'ring-2 ring-indigo-400/50' : ''
                  } ${magneticTargetId === 'btn-portal-save' || magneticTargetId === '2' ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-400/30 scale-110' : ''} ${tabHaloClass}`}
                >
                  <Save size={isHitboxExpanded ? 20 : 13} />
                  {isFocusNav && (
                    <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                      2
                    </span>
                  )}
                </button>
                {activeTooltip === 'save' && (
                  <div className="absolute right-0 top-full mt-2 z-40 w-72 p-3 rounded-xl bg-slate-950 text-slate-100 border-2 border-indigo-500 text-xs shadow-2xl pointer-events-none animate-fade-in">
                    <div className="flex items-center justify-between font-bold text-indigo-300 mb-1 border-b border-indigo-900/60 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-cyan-400" />
                        <span>Gemini Vision Scan</span>
                      </span>
                      <span className="text-[10px] bg-indigo-900/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                        98.7% Conf
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-200">{PORTAL_DATA.unlabelledIcons[1].aiLabel}</p>
                    <div className="mt-1 text-[9px] text-slate-400 font-mono">Injected: aria-label="Save current form progress..."</div>
                  </div>
                )}
              </div>

              {/* Icon 3: Worksheet Inspect (Shortcut: 3) */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-portal-inspect"
                  data-shortcut="3"
                  data-magnetic="true"
                  aria-label={visual.aiVisionLabelsEnabled ? PORTAL_DATA.unlabelledIcons[2].aiLabel : undefined}
                  onMouseEnter={(e) => {
                    visual.aiVisionLabelsEnabled && setActiveTooltip('inspect');
                    handleDwellEnter('btn-portal-inspect', 'Inspect Worksheet', () => onElementAction('Previewed Tax Worksheet'), e);
                  }}
                  onMouseLeave={() => {
                    setActiveTooltip(null);
                    handleDwellLeave();
                  }}
                  onClick={(e) => handleProtectedClick(e, 'Previewed Worksheet', () => onElementAction('Previewed Tax Worksheet'))}
                  className={`transition-all duration-200 flex items-center justify-center relative ${
                    isHitboxExpanded 
                      ? 'min-w-[48px] min-h-[48px] p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100' 
                      : 'w-6 h-6 p-1 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200'
                  } ${isHighContrast ? (isDarkSlate ? 'bg-black text-cyan-300 border-cyan-400' : 'bg-black text-yellow-300 border-yellow-400') : 'text-slate-600'} ${
                    visual.aiVisionLabelsEnabled ? 'ring-2 ring-indigo-400/50' : ''
                  } ${magneticTargetId === 'btn-portal-inspect' || magneticTargetId === '3' ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-400/30 scale-110' : ''} ${tabHaloClass}`}
                >
                  <FileSearch size={isHitboxExpanded ? 20 : 13} />
                  {isFocusNav && (
                    <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                      3
                    </span>
                  )}
                </button>
                {activeTooltip === 'inspect' && (
                  <div className="absolute right-0 top-full mt-2 z-40 w-72 p-3 rounded-xl bg-slate-950 text-slate-100 border-2 border-indigo-500 text-xs shadow-2xl pointer-events-none animate-fade-in">
                    <div className="flex items-center justify-between font-bold text-indigo-300 mb-1 border-b border-indigo-900/60 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-cyan-400" />
                        <span>Gemini Vision Scan</span>
                      </span>
                      <span className="text-[10px] bg-indigo-900/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                        97.4% Conf
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-200">{PORTAL_DATA.unlabelledIcons[2].aiLabel}</p>
                    <div className="mt-1 text-[9px] text-slate-400 font-mono">Injected: aria-label="Preview calculation worksheet..."</div>
                  </div>
                )}
              </div>

              {/* Icon 4: Signature Verification (Shortcut: 4) */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-portal-shield"
                  data-shortcut="4"
                  data-magnetic="true"
                  aria-label={visual.aiVisionLabelsEnabled ? PORTAL_DATA.unlabelledIcons[4].aiLabel : undefined}
                  onMouseEnter={(e) => {
                    visual.aiVisionLabelsEnabled && setActiveTooltip('shield');
                    handleDwellEnter('btn-portal-shield', 'Verify Signature', () => onElementAction('Checked Cryptographic Signature'), e);
                  }}
                  onMouseLeave={() => {
                    setActiveTooltip(null);
                    handleDwellLeave();
                  }}
                  onClick={(e) => handleProtectedClick(e, 'Checked Cryptographic Signature', () => onElementAction('Checked Cryptographic Signature'))}
                  className={`transition-all duration-200 flex items-center justify-center relative ${
                    isHitboxExpanded 
                      ? 'min-w-[48px] min-h-[48px] p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-100' 
                      : 'w-6 h-6 p-1 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200'
                  } ${isHighContrast ? (isDarkSlate ? 'bg-black text-cyan-300 border-cyan-400' : 'bg-black text-yellow-300 border-yellow-400') : 'text-slate-600'} ${
                    visual.aiVisionLabelsEnabled ? 'ring-2 ring-indigo-400/50' : ''
                  } ${magneticTargetId === 'btn-portal-shield' || magneticTargetId === '4' ? 'ring-4 ring-amber-400 shadow-lg shadow-amber-400/30 scale-110' : ''} ${tabHaloClass}`}
                >
                  <ShieldAlert size={isHitboxExpanded ? 20 : 13} />
                  {isFocusNav && (
                    <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                      4
                    </span>
                  )}
                </button>
                {activeTooltip === 'shield' && (
                  <div className="absolute right-0 top-full mt-2 z-40 w-72 p-3 rounded-xl bg-slate-950 text-slate-100 border-2 border-indigo-500 text-xs shadow-2xl pointer-events-none animate-fade-in">
                    <div className="flex items-center justify-between font-bold text-indigo-300 mb-1 border-b border-indigo-900/60 pb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-cyan-400" />
                        <span>Gemini Vision Scan</span>
                      </span>
                      <span className="text-[10px] bg-indigo-900/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                        96.8% Conf
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-slate-200">{PORTAL_DATA.unlabelledIcons[4].aiLabel}</p>
                    <div className="mt-1 text-[9px] text-slate-400 font-mono">Injected: aria-label="Verify tax integrity signature..."</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* INTENTIONAL WCAG FAILURE 4: Dense Jargon Wall of Legalese Text   */}
          {/* (AI Simplify & Summarize transforms into plain language bullets   */}
          {/*  with improved line spacing and readability)                     */}
          {/* =============================================================== */}
          <div className="my-6">
            {!cognitive.simplifyText ? (
              <div 
                id="portal-dense-legalese"
                className={`p-4 rounded-lg text-xs leading-relaxed border-l-4 transition-colors ${
                  isHighContrast 
                    ? (isDarkSlate ? 'bg-slate-900 border-cyan-400 text-cyan-200' : 'bg-neutral-900 border-yellow-400 text-yellow-200')
                    : 'bg-slate-50 border-slate-300 text-slate-500 font-sans'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                    Statutory Filing Compliance Notice (WCAG 3.1.5 Reading Level Barrier)
                  </span>
                  <span className="text-[10px] text-rose-500 font-mono bg-rose-50 px-2 py-0.5 rounded">
                    Complexity: Grade 16+
                  </span>
                </div>
                <p className="text-justify leading-5">{PORTAL_DATA.denseLegalText}</p>
              </div>
            ) : (
              <div 
                id="portal-simplified-block"
                className={`p-6 rounded-2xl border-2 transition-all duration-300 shadow-md ${
                  isHighContrast 
                    ? (isDarkSlate ? 'bg-slate-950 border-cyan-400 text-cyan-100' : 'bg-neutral-950 border-yellow-400 text-yellow-300')
                    : 'bg-blue-50/90 border-blue-400 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-3 border-b pb-2 border-blue-200/60 dark:border-blue-900/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
                    <h3 className="font-bold text-sm tracking-tight text-blue-900 dark:text-cyan-200">
                      AI Simplified Instructions (Plain Language Standard)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2.5 py-0.5 rounded-full font-mono">
                    WCAG AAA Grade 6
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm pl-1 leading-relaxed">
                  {PORTAL_DATA.simplifiedSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-blue-600 dark:text-cyan-400 font-bold shrink-0 mt-0.5 text-base leading-none">•</span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-2 border-t border-blue-200/40 text-[11px] text-blue-800/80 dark:text-cyan-300/80 flex items-center justify-between">
                  <span>✓ Text complexity reduced from Grade 16+ to Grade 6 • Line height expanded to 1.75</span>
                  <span className="font-mono text-[10px]">WCAG 3.1.5 PASS</span>
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* GEMINI MOTOR AUTOPILOT STATUS BANNER (1-Click Form Synthesis)   */}
          {/* =============================================================== */}
          <AnimatePresence>
            {motor.motorAutopilotActive && (
              <motion.div 
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="my-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/80 shadow-lg text-xs text-emerald-300 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-200 block text-xs">Gemini Motor Autopilot Active</span>
                    <span className="text-[11px] text-emerald-300/80">Synthesized and populated verified declarations — eliminated 15 repetitive fine-motor clicks and typing actions.</span>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                  15 ACTIONS ➔ 1
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =============================================================== */}
          {/* FORM INPUTS WITH SUB-24px CLICK TARGETS                          */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="input-resident-id"
                  className={`block text-xs font-semibold ${
                    isHighContrast ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300') : 'text-slate-700'
                  }`}
                >
                  National Resident Registry ID
                </label>
                {motor.motorAutopilotActive && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                    <Sparkles size={11} />
                    <span>Autopilot Verified</span>
                  </span>
                )}
              </div>
              <input
                id="input-resident-id"
                type="text"
                defaultValue="RES-8821-CIVIC-90"
                value={motor.motorAutopilotActive ? "RES-8821-CIVIC-90 [VERIFIED]" : undefined}
                readOnly={motor.motorAutopilotActive}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border transition-all ${
                  motor.motorAutopilotActive
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-950/20 text-emerald-200'
                    : isHighContrast 
                    ? (isDarkSlate ? 'bg-black text-cyan-300 border-cyan-400 focus:ring-2 focus:ring-cyan-400' : 'bg-black text-yellow-300 border-yellow-400 focus:ring-2 focus:ring-yellow-400')
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500'
                } ${tabHaloClass}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="input-household-income"
                  className={`block text-xs font-semibold ${
                    isHighContrast ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300') : 'text-slate-700'
                  }`}
                >
                  Annualized Imputed Income ($)
                </label>
                {motor.motorAutopilotActive && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                    <Sparkles size={11} />
                    <span>IRS Telefile Synced</span>
                  </span>
                )}
              </div>
              <input
                id="input-household-income"
                type="text"
                defaultValue="52,400.00"
                value={motor.motorAutopilotActive ? "52,400.00 [IRS AUDIT SYNCED]" : undefined}
                readOnly={motor.motorAutopilotActive}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border transition-all ${
                  motor.motorAutopilotActive
                    ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-950/20 text-emerald-200'
                    : isHighContrast 
                    ? (isDarkSlate ? 'bg-black text-cyan-300 border-cyan-400 focus:ring-2 focus:ring-cyan-400' : 'bg-black text-yellow-300 border-yellow-400 focus:ring-2 focus:ring-yellow-400')
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500'
                } ${tabHaloClass}`}
              />
            </div>
          </div>

          {/* =============================================================== */}
          {/* DEPENDENTS SECTION WITH INTENTIONAL SUB-24px BUTTONS             */}
          {/* (Enlarged to >= 48x48px in Motor Impairment Mode with cues)      */}
          {/* =============================================================== */}
          <div className="my-6">
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${
                isHighContrast ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300') : 'text-slate-700'
              }`}>
                Claimed Dependents (Healthcare Parity Allocation)
              </label>
              <span className={`text-[11px] font-mono flex items-center gap-1 ${
                isHitboxExpanded ? 'text-emerald-500 font-bold' : 'text-rose-500'
              }`}>
                {isHitboxExpanded ? (
                  <>
                    <ShieldCheck size={13} />
                    <span>Target Size &ge; 48x48px (Visual Cue Active)</span>
                  </>
                ) : (
                  <span>⚠️ Sub-24px Target Hazard</span>
                )}
              </span>
            </div>

            <div className={`rounded-xl border overflow-hidden transition-colors ${
              isHighContrast 
                ? (isDarkSlate ? 'border-cyan-400/50 bg-black' : 'border-yellow-400/50 bg-black') 
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <AnimatePresence>
                {dependents.map((dep, idx) => (
                  <motion.div 
                    key={dep.id} 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                    className={`p-3.5 sm:px-4 flex items-center justify-between border-b last:border-b-0 transition-colors ${
                      isHighContrast 
                        ? (isDarkSlate ? 'border-cyan-400/30 hover:bg-slate-900' : 'border-yellow-400/30 hover:bg-neutral-900') 
                        : 'border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <div>
                      <div className={`font-semibold text-xs sm:text-sm ${
                        isHighContrast ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300') : 'text-slate-800'
                      }`}>
                        {dep.name}
                      </div>
                      <div className={`text-[11px] ${
                        isHighContrast ? (isDarkSlate ? 'text-cyan-200/80' : 'text-yellow-200/80') : 'text-slate-400'
                      }`}>
                        {dep.relation} • D.O.B: {dep.dob}
                      </div>
                    </div>

                    {/* Sub-24px Actions vs Enlarged 48x48px Targets with Visual Cues */}
                    <div className="flex items-center gap-2">
                      {/* Edit Dependent Button (Shortcut: 5, 7) */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        data-shortcut={String(5 + idx * 2)}
                        data-magnetic="true"
                        onMouseEnter={(e) => handleDwellEnter(`dep-edit-${dep.id}`, `Editing ${dep.name}`, () => onElementAction(`Editing ${dep.name}`), e)}
                        onMouseLeave={handleDwellLeave}
                        onClick={(e) => handleProtectedClick(e, `Editing ${dep.name}`, () => onElementAction(`Editing ${dep.name}`))}
                        className={`transition-all duration-200 flex items-center justify-center font-medium relative ${
                          isHitboxExpanded 
                            ? 'min-w-[48px] min-h-[48px] px-3.5 py-2.5 rounded-xl text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-md border-2 border-blue-400 ring-2 ring-blue-300/40' 
                            : 'h-5 px-1.5 text-[10px] rounded bg-slate-200 text-slate-700 hover:bg-slate-300'
                        } ${isHighContrast ? (isDarkSlate ? 'bg-black text-cyan-300 border-2 border-cyan-400' : 'bg-black text-yellow-300 border-2 border-yellow-400') : ''} ${
                          magneticTargetId === String(5 + idx * 2) ? 'ring-4 ring-amber-400 shadow-lg scale-105' : ''
                        } ${tabHaloClass}`}
                      >
                        <Edit3 size={isHitboxExpanded ? 16 : 10} className={isHitboxExpanded ? "mr-1.5" : "mr-1"} />
                        <span>Edit</span>
                        {isFocusNav && (
                          <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                            {5 + idx * 2}
                          </span>
                        )}
                      </motion.button>

                      {/* Delete Dependent Button (Shortcut: 6, 8) - PROTECTED WITH HOLD-TO-CONFIRM */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        data-shortcut={String(6 + idx * 2)}
                        data-magnetic="true"
                        onMouseEnter={(e) => handleDwellEnter(`dep-del-${dep.id}`, `Remove ${dep.name}`, () => removeDependent(dep.id), e)}
                        onMouseDown={() => handleHoldStart(`dep-del-${dep.id}`, `Remove ${dep.name}`, () => removeDependent(dep.id))}
                        onMouseUp={() => handleHoldEnd(`dep-del-${dep.id}`, `Remove ${dep.name}`)}
                        onMouseLeave={() => {
                          handleHoldEnd(`dep-del-${dep.id}`, `Remove ${dep.name}`);
                          handleDwellLeave();
                        }}
                        onClick={(e) => {
                          if (motor.holdToConfirm) {
                            e.preventDefault();
                            onElementAction(`Spasm Guard: Hold button for 600ms to remove ${dep.name}`);
                          } else {
                            handleProtectedClick(e, `Remove ${dep.name}`, () => removeDependent(dep.id));
                          }
                        }}
                        className={`transition-all duration-200 flex items-center justify-center font-medium relative overflow-hidden ${
                          isHitboxExpanded 
                            ? 'min-w-[48px] min-h-[48px] px-3.5 py-2.5 rounded-xl text-xs bg-rose-600 text-white hover:bg-rose-700 shadow-md border-2 border-rose-400 ring-2 ring-rose-300/40' 
                            : 'h-5 px-1.5 text-[10px] rounded bg-slate-200 text-rose-700 hover:bg-rose-100'
                        } ${isHighContrast ? (isDarkSlate ? 'bg-black text-rose-300 border-2 border-rose-400' : 'bg-black text-yellow-300 border-2 border-yellow-400') : ''} ${
                          magneticTargetId === String(6 + idx * 2) ? 'ring-4 ring-amber-400 shadow-lg scale-105' : ''
                        } ${tabHaloClass}`}
                      >
                        {/* Spasm Hold Progress Fill */}
                        {holdingTarget?.id === `dep-del-${dep.id}` && (
                          <div 
                            className="absolute inset-0 bg-rose-950/80 transition-all duration-75"
                            style={{ width: `${holdingTarget.progress}%` }}
                          />
                        )}
                        <Trash2 size={isHitboxExpanded ? 16 : 10} className={`${isHitboxExpanded ? "mr-1.5" : "mr-1"} relative z-10`} />
                        <span className="relative z-10">
                          {holdingTarget?.id === `dep-del-${dep.id}` ? `Hold ${Math.round(holdingTarget.progress)}%` : 'Remove'}
                        </span>
                        {isFocusNav && (
                          <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                            {6 + idx * 2}
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* =============================================================== */}
          {/* PRIMARY FORM SUBMISSION BAR & RAGE-CLICK DEMO AREA               */}
          {/* =============================================================== */}
          <div className={`mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t ${headerBorder}`}>
            {/* Discard Button with Hold-to-Confirm Spasm Protection */}
            <div className="relative">
              <button
                type="button"
                id="btn-portal-cancel"
                data-shortcut="0"
                data-magnetic="true"
                onMouseEnter={(e) => handleDwellEnter('btn-portal-cancel', 'Discard Declaration', () => onElementAction('Cancelled Draft'), e)}
                onMouseDown={() => handleHoldStart('btn-portal-cancel', 'Discard Declaration', () => onElementAction('Cancelled Draft'))}
                onMouseUp={() => handleHoldEnd('btn-portal-cancel', 'Discard Declaration')}
                onMouseLeave={() => {
                  handleHoldEnd('btn-portal-cancel', 'Discard Declaration');
                  handleDwellLeave();
                }}
                onClick={(e) => {
                  if (motor.holdToConfirm) {
                    e.preventDefault();
                    onElementAction('Spasm Shield: Hold for 600ms to confirm discard');
                  } else {
                    handleProtectedClick(e, 'Cancelled Draft', () => onElementAction('Cancelled Draft'));
                  }
                }}
                className={`transition-all text-xs font-semibold relative overflow-hidden ${
                  isHitboxExpanded 
                    ? 'min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-slate-300 hover:bg-slate-100' 
                    : 'text-slate-400 hover:text-slate-600'
                } ${isHighContrast ? (isDarkSlate ? 'text-cyan-300 hover:text-cyan-100 border-cyan-400' : 'text-yellow-300 hover:text-yellow-100 border-yellow-400') : ''} ${
                  magneticTargetId === 'btn-portal-cancel' || magneticTargetId === '0' ? 'ring-4 ring-amber-400 shadow-md scale-105' : ''
                } ${tabHaloClass}`}
              >
                {/* Hold Progress Bar */}
                {holdingTarget?.id === 'btn-portal-cancel' && (
                  <div 
                    className="absolute inset-0 bg-rose-500/25 transition-all duration-75"
                    style={{ width: `${holdingTarget.progress}%` }}
                  />
                )}
                <span className="relative z-10">
                  {holdingTarget?.id === 'btn-portal-cancel' 
                    ? `Holding ${Math.round(holdingTarget.progress)}%...` 
                    : motor.holdToConfirm 
                    ? 'Discard (Hold 600ms)' 
                    : 'Discard Declaration'}
                </span>
                {isFocusNav && (
                  <span className="absolute -top-2.5 -right-2 bg-amber-400 text-black font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black z-30">
                    0
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              <div className="text-right hidden sm:block">
                <div className={`text-xs font-medium ${isHighContrast ? (isDarkSlate ? 'text-cyan-200' : 'text-yellow-200') : 'text-slate-400'}`}>
                  Estimated Rebate Due
                </div>
                <div className={`text-base font-extrabold ${isHighContrast ? (isDarkSlate ? 'text-cyan-300' : 'text-yellow-300') : 'text-slate-900'}`}>
                  $1,480.00 USD
                </div>
              </div>

              {/* Submit Button (Target of Rage-Click Simulation & Shortcut: 9 & Dwell Click) */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  animate={
                    rageCount > 0
                      ? { x: [-2, 2, -2, 2, 0], transition: { duration: 0.2 } }
                      : {}
                  }
                  type="button"
                  id="btn-portal-submit"
                  data-shortcut="9"
                  data-magnetic="true"
                  onMouseEnter={(e) => handleDwellEnter('btn-portal-submit', 'Submit Form 104-B', () => {
                    setFormSubmitted(true);
                    onElementAction('Submitted Form 104-B via Dwell Click');
                  }, e)}
                  onMouseLeave={handleDwellLeave}
                  onClick={(e) => handleProtectedClick(e, 'Submitted Form 104-B', () => {
                    setFormSubmitted(true);
                    onElementAction('Submitted Form 104-B');
                  })}
                  className={`transition-colors duration-200 flex items-center justify-center gap-2 font-bold shadow-md relative ${
                    isHitboxExpanded 
                      ? 'min-w-[190px] min-h-[52px] px-6 py-3 text-sm rounded-xl border-2 border-blue-400 ring-4 ring-blue-300/30' 
                      : 'px-4 py-2 text-xs rounded-lg'
                  } ${
                    isHighContrast 
                      ? (isDarkSlate ? 'bg-cyan-400 hover:bg-cyan-300 text-black font-black border-2 border-cyan-200' : 'bg-yellow-400 hover:bg-yellow-300 text-black font-black border-2 border-yellow-200') 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } ${
                    magneticTargetId === 'btn-portal-submit' || magneticTargetId === '9' ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-400/50 scale-105' : ''
                  } ${tabHaloClass}`}
                >
                  <CheckCircle2 size={isHitboxExpanded ? 18 : 14} />
                  <span>Submit Verified Rebate</span>
                  {isFocusNav && (
                    <span className="absolute -top-3 -right-3 bg-amber-400 text-black font-black text-[12px] w-6 h-6 rounded-full flex items-center justify-center shadow-xl border-2 border-black z-30">
                      9
                    </span>
                  )}
                </motion.button>

                {/* Rage Click Trigger Badge if clicks detected */}
                <AnimatePresence>
                  {rageCount > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: -10 }}
                      className="absolute -top-3 -left-3 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow pointer-events-none"
                    >
                      {rageCount} clicks!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {formSubmitted && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0.2 }}
                className="mt-4 p-3 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between"
              >
                <span className="font-semibold flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-700" />
                  <span>Declaration transmitted successfully! Tracking ID: #CIVIC-2030-88192</span>
                </span>
                <button 
                  type="button" 
                  onClick={() => setFormSubmitted(false)}
                  className="text-emerald-700 hover:text-emerald-950 font-bold"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </main>

        {/* Footer info note */}
        <div className="text-center text-xs text-slate-400 font-mono pt-4 flex flex-wrap items-center justify-center gap-2">
          <span>Target Site Sandbox: Simulating 3rd-party civic webpage loaded in Chrome Tab.</span>
          {motor.steadyClick && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <MousePointer2 size={11} />
              <span>Steady Click Active</span>
            </span>
          )}
          {motor.dwellClick && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <Timer size={11} />
              <span>Dwell-Click Active ({motor.dwellDelay || 750}ms)</span>
            </span>
          )}
          {motor.magneticGravity && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <Magnet size={11} />
              <span>Target Gravity Snapping Active</span>
            </span>
          )}
          {motor.holdToConfirm && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>Spasm Hold Guard Active</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
