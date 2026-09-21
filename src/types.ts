export type AccessibilityProfile = 'raw' | 'visual' | 'cognitive' | 'motor';

export interface VisualSettings {
  highContrast: boolean;
  contrastTheme: 'yellow-black' | 'dark-slate' | 'high-light';
  fontScale: number; // 100 to 200%
  aiVisionLabelsEnabled: boolean;
  magnifierEnabled: boolean;
}

export interface CognitiveSettings {
  declutter: boolean;
  simplifyText: boolean;
  dyslexiaFont: boolean;
  readingGuide: boolean;
  readingMask: boolean;
}

export interface MotorSettings {
  hitboxExpansion: boolean;
  hitboxSize: number; // e.g. 48px, 56px, 64px
  focusNavigation: boolean;
  stickyTargets: boolean;
  rageClickAdaptation: boolean;
  doubleClickDebounce: boolean;
  steadyClick: boolean;
  dwellClick: boolean;
  dwellDelay: number; // in ms, e.g. 750
  magneticGravity: boolean;
  holdToConfirm: boolean;
  motorAutopilotActive: boolean;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  category: 'DOM_PATCH' | 'RL_AGENT' | 'AI_GEMINI' | 'USER_TELEMETRY' | 'WCAG_AUDIT';
  message: string;
  badgeType: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose';
}

export interface MutationStats {
  ariaTagsInjected: number;
  hitboxesEnlarged: number;
  textBlocksSimplified: number;
  contrastPatchesApplied: number;
  distractionsSuppressed: number;
  shortcutsAssigned: number;
  dwellClicksTriggered?: number;
  gravitySnapsApplied?: number;
}
