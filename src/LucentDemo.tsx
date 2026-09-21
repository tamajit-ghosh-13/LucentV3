/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Routes, Route } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AccessibilityProfile, 
  VisualSettings, 
  CognitiveSettings, 
  MotorSettings, 
  TelemetryLog, 
  MutationStats 
} from './types';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserBar } from './components/BrowserBar';
import { TargetPortal } from './components/TargetPortal';
import { ExtensionHud } from './components/ExtensionHud';
import { ArtifactModal } from './components/ArtifactModal';
import { HackathonBanner } from './components/HackathonBanner';

export default function LucentDemo() {
  const [viewMode, setViewMode] = useState<'overlay' | 'split'>('overlay');
  const [currentProfile, setCurrentProfile] = useState<AccessibilityProfile>('raw');
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [rageCount, setRageCount] = useState(0);

  // Profile Settings States
  const [visual, setVisual] = useState<VisualSettings>({
    highContrast: false,
    contrastTheme: 'yellow-black',
    fontScale: 100,
    aiVisionLabelsEnabled: false,
    magnifierEnabled: false
  });

  const [cognitive, setCognitive] = useState<CognitiveSettings>({
    declutter: false,
    simplifyText: false,
    dyslexiaFont: false,
    readingGuide: false,
    readingMask: false
  });

  const [motor, setMotor] = useState<MotorSettings>({
    hitboxExpansion: false,
    hitboxSize: 48,
    focusNavigation: false,
    stickyTargets: false,
    rageClickAdaptation: true,
    doubleClickDebounce: true,
    steadyClick: true
  });

  // Telemetry stream
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      category: 'WCAG_AUDIT',
      message: 'Detected 4 unlabelled icon buttons & 2 low contrast zones (<3:1)',
      badgeType: 'rose'
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      category: 'DOM_PATCH',
      message: 'Lucent Content Script injected into https://portal.civic.gov/forms/rebate-104b',
      badgeType: 'blue'
    }
  ]);

  const addTelemetryLog = useCallback((
    category: TelemetryLog['category'],
    message: string,
    badgeType: TelemetryLog['badgeType'] = 'blue'
  ) => {
    const newLog: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      category,
      message,
      badgeType
    };
    setTelemetryLogs(prev => [newLog, ...prev.slice(0, 29)]);
  }, []);

  // Compute active mutation stats
  const stats: MutationStats = {
    ariaTagsInjected: visual.aiVisionLabelsEnabled ? 4 : 0,
    hitboxesEnlarged: motor.hitboxExpansion ? 8 : 0,
    textBlocksSimplified: cognitive.simplifyText ? 1 : 0,
    contrastPatchesApplied: visual.highContrast ? 14 : 0,
    distractionsSuppressed: cognitive.declutter ? 1 : 0,
    shortcutsAssigned: motor.focusNavigation ? 9 : 0
  };

  const totalActiveMutations = 
    stats.ariaTagsInjected + 
    stats.hitboxesEnlarged + 
    stats.textBlocksSimplified + 
    stats.contrastPatchesApplied + 
    stats.distractionsSuppressed;

  // Profile Selector Logic
  const handleSelectProfile = (profile: AccessibilityProfile) => {
    setCurrentProfile(profile);

    if (profile === 'raw') {
      setVisual({
        highContrast: false,
        contrastTheme: 'yellow-black',
        fontScale: 100,
        aiVisionLabelsEnabled: false,
        magnifierEnabled: false
      });
      setCognitive({
        declutter: false,
        simplifyText: false,
        dyslexiaFont: false,
        readingGuide: false,
        readingMask: false
      });
      setMotor({
        hitboxExpansion: false,
        hitboxSize: 48,
        focusNavigation: false,
        stickyTargets: false,
        rageClickAdaptation: true,
        doubleClickDebounce: true,
        steadyClick: true
      });
      addTelemetryLog('DOM_PATCH', 'Reverted all dynamic DOM patches. Unprotected baseline exposed.', 'rose');
    } else if (profile === 'visual') {
      setVisual({
        highContrast: true,
        contrastTheme: 'yellow-black',
        fontScale: 125,
        aiVisionLabelsEnabled: true,
        magnifierEnabled: false
      });
      setCognitive(prev => ({ ...prev, declutter: false, simplifyText: false }));
      setMotor(prev => ({ ...prev, hitboxExpansion: false, focusNavigation: false }));
      addTelemetryLog('AI_GEMINI', 'Activated Visual Impairment Suite: WCAG AAA Contrast + 125% Font Reflow + AI Vision scan', 'purple');
    } else if (profile === 'cognitive') {
      setCognitive({
        declutter: true,
        simplifyText: true,
        dyslexiaFont: true,
        readingGuide: false,
        readingMask: false
      });
      setVisual(prev => ({ ...prev, highContrast: false, fontScale: 110 }));
      setMotor(prev => ({ ...prev, hitboxExpansion: false, focusNavigation: false }));
      addTelemetryLog('AI_GEMINI', 'Activated Cognitive & ADHD Suite: Sensory de-clutter + AI text simplification + Dyslexia typography', 'purple');
    } else if (profile === 'motor') {
      setMotor({
        hitboxExpansion: true,
        hitboxSize: 48,
        focusNavigation: true,
        stickyTargets: true,
        rageClickAdaptation: true,
        doubleClickDebounce: true,
        steadyClick: true
      });
      setVisual(prev => ({ ...prev, highContrast: false }));
      setCognitive(prev => ({ ...prev, declutter: false, simplifyText: false }));
      addTelemetryLog('RL_AGENT', 'Activated Motor Impairment Suite: Targets enlarged to >=48px + [1-9] keyboard shortcuts + tremor filter', 'amber');
    }
  };

  // Keyboard shortcut listener for motor visual navigation
  useEffect(() => {
    if (!motor.focusNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        const targetElement = document.querySelector(`[data-shortcut="${e.key}"]`) as HTMLElement;
        if (targetElement) {
          e.preventDefault();
          targetElement.focus();
          targetElement.click();
          addTelemetryLog('USER_TELEMETRY', `Executed direct numbered hotkey [${e.key}] -> Clicked target node`, 'emerald');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [motor.focusNavigation, addTelemetryLog]);

  // Simulated Rage Click (Slide 10: Online RL Feedback loop)
  const handleTriggerRageClickSim = () => {
    addTelemetryLog('USER_TELEMETRY', 'Simulating rapid repeated clicks on Submit button (#btn-submit)...', 'rose');
    setRageCount(prev => prev + 1);

    setTimeout(() => {
      setRageCount(prev => prev + 2);
    }, 150);

    setTimeout(() => {
      setRageCount(prev => prev + 3);
      addTelemetryLog('RL_AGENT', 'Rage-click threshold exceeded (6 clicks in 350ms)! Triggering Online RL Policy...', 'rose');
      
      setTimeout(() => {
        setMotor(prev => ({ ...prev, hitboxExpansion: true }));
        addTelemetryLog('RL_AGENT', 'Online RL policy adapted: Expanded touch hitbox target to >= 48px + 20% safety margin', 'emerald');
        setRageCount(0);
      }, 400);
    }, 350);
  };

  // Simulated Gemini Multimodal Vision Scan
  const handleTriggerGeminiScanSim = () => {
    setIsScanningAi(true);
    addTelemetryLog('AI_GEMINI', 'Capturing DOM viewport snapshot -> Sending to Gemini 1.5/2.0 Vision API...', 'purple');

    setTimeout(() => {
      setVisual(prev => ({ ...prev, aiVisionLabelsEnabled: true }));
      setIsScanningAi(false);
      addTelemetryLog('AI_GEMINI', 'Gemini Vision parsed 4 unlabelled icons: injected descriptive aria-label & tooltips (98.4% mean confidence)', 'emerald');
    }, 900);
  };

  const handlePortalReset = () => {
    handleSelectProfile('raw');
    addTelemetryLog('DOM_PATCH', 'Target portal reset to initial raw state.', 'blue');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Hackathon Context Header */}
      <HackathonBanner />

      {/* Simulated Browser Bar */}
      <BrowserBar
        url="portal.civic.gov/forms/rebate-104b?applicant=resident_verified"
        activeMutationsCount={totalActiveMutations}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenArtifactModal={() => setIsArtifactModalOpen(true)}
        onResetPortal={handlePortalReset}
        extensionActive={totalActiveMutations > 0}
      />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Full: Target Portal Webpage */}
        <motion.div 
          layout
          initial={false}
          className={`overflow-y-auto ${viewMode === 'split' ? 'w-full lg:w-3/5 border-r border-slate-800' : 'w-full'}`}
        >
          <TargetPortal
            visual={visual}
            cognitive={cognitive}
            motor={motor}
            onSimulateRageClick={handleTriggerRageClickSim}
            onElementAction={(action) => addTelemetryLog('USER_TELEMETRY', `User interaction: ${action}`, 'blue')}
            rageCount={rageCount}
          />
        </motion.div>

        {/* Right Pane (in Split View) or Floating HUD (in Overlay View) */}
        <AnimatePresence mode="popLayout">
          {viewMode === 'split' ? (
            <motion.div 
              key="split-view"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="hidden lg:block w-2/5 bg-slate-900 overflow-y-auto border-l border-slate-800 relative"
            >
              <div className="p-4">
                <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span>Injected Chrome Extension Inspector Pane</span>
                </div>
                <ExtensionHud
                  currentProfile={currentProfile}
                  onSelectProfile={handleSelectProfile}
                  visual={visual}
                  onUpdateVisual={(up) => {
                    setVisual(prev => ({ ...prev, ...up }));
                    addTelemetryLog('DOM_PATCH', `Updated visual parameters`, 'blue');
                  }}
                  cognitive={cognitive}
                  onUpdateCognitive={(up) => {
                    setCognitive(prev => ({ ...prev, ...up }));
                    addTelemetryLog('DOM_PATCH', `Updated cognitive parameters`, 'blue');
                  }}
                  motor={motor}
                  onUpdateMotor={(up) => {
                    setMotor(prev => ({ ...prev, ...up }));
                    addTelemetryLog('DOM_PATCH', `Updated motor parameters`, 'blue');
                  }}
                  stats={stats}
                  telemetryLogs={telemetryLogs}
                  onTriggerRageClickSim={handleTriggerRageClickSim}
                  onTriggerGeminiScanSim={handleTriggerGeminiScanSim}
                  isScanningAi={isScanningAi}
                />
              </div>
            </motion.div>
          ) : (
            /* Overlay Mode: Draggable Floating Extension HUD */
            <motion.div
              key="overlay-view"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-end items-end"
            >
              <div className="pointer-events-auto">
                <ExtensionHud
                  currentProfile={currentProfile}
                  onSelectProfile={handleSelectProfile}
                  visual={visual}
                  onUpdateVisual={(up) => {
                    setVisual(prev => ({ ...prev, ...up }));
                    addTelemetryLog('DOM_PATCH', `Updated visual parameters`, 'blue');
                  }}
                  cognitive={cognitive}
                  onUpdateCognitive={(up) => {
                    setCognitive(prev => ({ ...prev, ...up }));
                    addTelemetryLog('DOM_PATCH', `Updated cognitive parameters`, 'blue');
                  }}
                  motor={motor}
                  onUpdateMotor={(up) => {
                    setMotor(prev => ({ ...prev, ...up }));
                    addTelemetryLog('DOM_PATCH', `Updated motor parameters`, 'blue');
                  }}
                  stats={stats}
                  telemetryLogs={telemetryLogs}
                  onTriggerRageClickSim={handleTriggerRageClickSim}
                  onTriggerGeminiScanSim={handleTriggerGeminiScanSim}
                  isScanningAi={isScanningAi}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Artifact Code & Standalone Download Modal */}
      <ArtifactModal
        isOpen={isArtifactModalOpen}
        onClose={() => setIsArtifactModalOpen(false)}
      />
    </div>
  );
}
