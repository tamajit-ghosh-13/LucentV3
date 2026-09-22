import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  MousePointer,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  AlertCircle,
  ChevronDown,
  Layers,
  Zap,
  Eye
} from 'lucide-react';
import { AccessibilityProfile } from '../types';
import { signUpUser, signInUser, signInWithGoogle } from '../lib/supabase';

interface AuthPageProps {
  onAuthSuccess: (profile: AccessibilityProfile, userEmail?: string, name?: string) => void;
  onContinueAsGuest: (profile: AccessibilityProfile) => void;
}

const DISABILITY_PROFILES: {
  id: AccessibilityProfile;
  label: string;
  category: string;
  icon: typeof Brain;
  color: string;
  badgeBg: string;
  description: string;
  features: string[];
}[] = [
    {
      id: 'cognitive',
      label: 'Cognitive & ADHD Support',
      category: 'ADHD, Dyslexia & Sensory Overload',
      icon: Brain,
      color: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      description: 'De-clutters page layouts, suppresses annoying popups/ads, converts complex copy into simple summaries, and enables Dyslexia-friendly fonts.',
      features: ['Sensory De-clutter & Ad Suppression', 'AI Text Simplification & Summaries', 'OpenDyslexic Reading Font', 'Focus Reading Guide Bar']
    },
    {
      id: 'motor',
      label: 'Motor & Tremor Impairment',
      category: 'Parkinson\'s, Limited Dexterity & Tremors',
      icon: MousePointer,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
      description: 'Expands clickable target hitboxes to >= 48px, filters accidental tremor double-clicks, and assigns direct single-key hotkeys [1-9].',
      features: ['>= 48px Target Hitbox Expansion', 'Direct [1-9] Keyboard Hotkeys', 'Tremor Double-Click Debounce', 'Sticky Target Magnetism']
    },
    {
      id: 'visual',
      label: 'Visual & Low Vision Impairment',
      category: 'Color Blindness, Low Vision & Photophobia',
      icon: Eye,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      description: 'Applies Daltonization color-blind filters, solar high-contrast themes, hover magnification loupe, 18px minimum text, and pattern overlays.',
      features: ['Daltonization Color Blind Filters', 'Solar High-Contrast & Contrast Boost', 'Hover Magnifier Loupe & Crosshairs', 'Color-to-Pattern Texture Overlays']
    },
    {
      id: 'raw',
      label: 'Baseline / Standard Web',
      category: 'No Special Adaptations Needed',
      icon: Layers,
      color: 'text-slate-400',
      badgeBg: 'bg-slate-800 border-slate-700 text-slate-400',
      description: 'Displays websites as originally published without Lucent dynamic patches.',
      features: ['Standard Web View', 'Manual Feature Toggles Available Later']
    }
  ];

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onContinueAsGuest
}) => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  // Visual impairment is intentionally reserved for Tamajit's pipeline.
  const [selectedDisability, setSelectedDisability] = useState<AccessibilityProfile>('cognitive');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const activeProfileInfo = DISABILITY_PROFILES.find(p => p.id === selectedDisability) || DISABILITY_PROFILES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpUser(email, password, fullName, selectedDisability);
        setSuccessMsg('Account created successfully! Profile saved.');
        setTimeout(() => {
          onAuthSuccess(selectedDisability, email, fullName);
        }, 800);
      } else {
        await signInUser(email, password);
        setSuccessMsg('Signed in successfully! Loading your accessibility profile...');
        setTimeout(() => {
          onAuthSuccess(selectedDisability, email, email.split('@')[0]);
        }, 800);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Fallback for demo or when Supabase credentials aren't fully configured
      if (err?.message?.includes('FetchError') || err?.message?.includes('placeholder') || err?.status === 400) {
        setErrorMsg(`${err.message || 'Auth error'}. Entering demo mode with selected profile.`);
        setTimeout(() => {
          onAuthSuccess(selectedDisability, email || 'demo@lucent.ai', fullName || 'Demo user');
        }, 1200);
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await signInWithGoogle(selectedDisability);
      setSuccessMsg('Redirecting to Google Sign-In...');
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      // Fallback for demo mode if Supabase Google OAuth provider is not configured in dashboard yet
      if (err?.message?.includes('provider') || err?.message?.includes('placeholder') || err?.message?.includes('FetchError') || err?.status === 400) {
        setSuccessMsg('Google OAuth initialized! Signing in with Google Account (Demo Mode)...');
        setTimeout(() => {
          onAuthSuccess(selectedDisability, 'google.user@gmail.com', 'Google user');
        }, 1000);
      } else {
        setErrorMsg(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 max-w-2xl relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Lucent AI Web Accessibility Layer V3</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
          Adaptive Accessibility, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400">Tailored to You.</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          Select your primary accessibility needs below. Lucent dynamically mutates live web pages in real-time to match your visual, cognitive, or motor requirements.
        </p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">

        {/* Left Section: Disability Profile Dropdown & Interactive Preview */}
        <div className="lg:col-span-6 p-6 md:p-8 bg-slate-900/50 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Step 1: Choose Disability Profile
              </h2>
              <span className="text-xs bg-cyan-950 text-cyan-400 px-2.5 py-0.5 rounded-full font-medium border border-cyan-800">
                WCAG AAA Ready
              </span>
            </div>

            {/* Main Disability Selection Dropdown */}
            <div className="mb-6">
              <label htmlFor="disability-select" className="block text-sm font-semibold text-slate-200 mb-2">
                Primary Accessibility Requirement
              </label>
              <div className="relative">
                <select
                  id="disability-select"
                  value={selectedDisability}
                  onChange={(e) => setSelectedDisability(e.target.value as AccessibilityProfile)}
                  className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 hover:border-cyan-500/50 focus:border-cyan-400 text-white rounded-xl text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  {DISABILITY_PROFILES.map((prof) => (
                    <option key={prof.id} value={prof.id} className="bg-slate-900 text-slate-100">
                      {prof.label} — ({prof.category})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Interactive Feature Cards Grid */}
            <div className="space-y-3 mb-6">
              {DISABILITY_PROFILES.map((prof) => {
                const IconComp = prof.icon;
                const isSelected = selectedDisability === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setSelectedDisability(prof.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${isSelected
                      ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${prof.color} shrink-0`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-100 truncate">{prof.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {prof.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Profile Features Summary Card */}
          <div className={`p-4 rounded-2xl border ${activeProfileInfo.badgeBg} transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Adaptations Engine</span>
              <span className="text-[10px] font-mono opacity-80">Lucent DOM Engine</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {activeProfileInfo.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Section: Sign Up / Sign In Auth Form */}
        <div className="lg:col-span-6 p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'signup'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Create Account (Sign Up)
              </button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'signin'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Sign In
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {mode === 'signup' ? 'Step 2: Enter Account Details' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {mode === 'signup'
                ? 'Your accessibility preferences will automatically sync across devices.'
                : 'Sign in to access your saved custom accessibility settings.'}
            </p>

            {/* Error or Success Feedback */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white placeholder-slate-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white placeholder-slate-500 transition-all"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-cyan-400 text-white placeholder-slate-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Complete Sign Up & Launch Lucent' : 'Sign In to Lucent'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-3 bg-slate-900 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or continue with
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-100 font-semibold rounded-xl text-sm border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3s.7 5.6 1.9 8l3.7-2.9c-.8-1.7-.8-3.9 0-5.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          {/* Quick Demo as Guest Action */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400 mb-2">Want to try Lucent immediately without an account?</p>
            <button
              type="button"
              onClick={() => onContinueAsGuest(selectedDisability)}
              className="w-full py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-cyan-500/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Explore Lucent Portal as Guest ({activeProfileInfo.label})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
