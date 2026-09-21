import { Navigate, Route, Routes } from 'react-router-dom';

import Dashboard from './dashboard/pages/Dashboard';
import Activity from './dashboard/pages/Activity';
import Features from './dashboard/pages/Features';
import Analytics from './dashboard/pages/Analytics';
import Settings from './dashboard/pages/Settings';

import DashboardLayout from './dashboard/layouts/DashboardLayout';
import LucentDemo from './LucentDemo';
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
import { AuthPage } from './signuppage/AuthPage';
import { signOutUser } from './lib/supabase';

export default function App() {
  // Check persisted session on startup
  const savedSessionStr = typeof window !== 'undefined' ? localStorage.getItem('lucent_user_session') : null;
  const initialSession = savedSessionStr ? JSON.parse(savedSessionStr) : null;

  const [showAuthPage, setShowAuthPage] = useState<boolean>(!initialSession);
  const [userEmail, setUserEmail] = useState<string | undefined>(initialSession?.email);
  const [viewMode, setViewMode] = useState<'overlay' | 'split'>('overlay');
  const [currentProfile, setCurrentProfile] = useState<AccessibilityProfile>(initialSession?.profile || 'raw');
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

export default function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route element={<DashboardLayout />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/dashboard/features"
          element={<Features />}
        />

        <Route
          path="/activity"
          element={<Activity />}
        />

        <Route
          path="/dashboard/analytics"
          element={<Analytics />}
        />

        <Route
          path="/dashboard/settings"
          element={<Settings />}
        />

      </Route>


      <Route
        path="/demo"
        element={<LucentDemo />}
  const handleAuthComplete = (selectedProfile: AccessibilityProfile, email?: string) => {
    const activeEmail = email || 'Guest Demo';
    setUserEmail(activeEmail);
    handleSelectProfile(selectedProfile);
    setShowAuthPage(false);

    // Save session permanently until explicit log out
    localStorage.setItem(
      'lucent_user_session', 
      JSON.stringify({ email: activeEmail, profile: selectedProfile })
    );

    addTelemetryLog(
      'USER_TELEMETRY', 
      `User logged in (${activeEmail}). Session saved permanently. Activated profile: [${selectedProfile.toUpperCase()}]`, 
      'emerald'
    );
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    localStorage.removeItem('lucent_user_session');
    setUserEmail(undefined);
    setShowAuthPage(true);
    handleSelectProfile('raw');
    addTelemetryLog('USER_TELEMETRY', 'User explicitly signed out. Returned to login page.', 'rose');
  };

  if (showAuthPage) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthComplete}
        onContinueAsGuest={(prof) => handleAuthComplete(prof, 'Guest Demo')}
      />
    );
  }

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
        userEmail={userEmail}
        activeProfileLabel={currentProfile.toUpperCase()}
        onSwitchProfileOrAuth={() => setShowAuthPage(true)}
        onSignOut={handleSignOut}
      />

    </Routes>
  );
}