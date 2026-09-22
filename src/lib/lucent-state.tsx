import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AccessibilityProfile } from '../types';

export type VisualAdaptations = {
  fontSize: number;
  daltonize: boolean;
  highContrast: boolean;
  magnifier: boolean;
  boldText: boolean;
  crosshairs: boolean;
  textToSpeech: boolean;
  colorPatterns: boolean;
};

export type LucentSettings = {
  enabled: boolean;
  profile: AccessibilityProfile;
  cognitive: { declutter: boolean; dyslexia: boolean; readingGuide: boolean; calmMode: boolean; readingWidth: boolean };
  motor: { targets: boolean; focus: boolean; shortcuts: boolean; steadyClick: boolean; largeCursor: boolean };
  visual: VisualAdaptations;
};
export type LucentEvent = { id: string; at: string; site: string; action: string; feature: string; url?: string };
export type LucentUser = { name: string; email: string; guest?: boolean };

export type AuditResults = {
  smallTargets: number;
  unlabeledButtons: number;
  lowContrast: number;
  missingAlt: number;
  total: number;
};

export type AuditState = {
  scannedAt: string;
  pageTitle: string;
  pageUrl: string;
  results: AuditResults;
  remediated: boolean;
  aiSummary?: string;
  confidenceScore?: number;
};

const SETTINGS = 'lucentSettings';
const EVENTS = 'lucentEvents';
const USER = 'lucentUser';
const THEME = 'lucentTheme';
const AUDIT = 'lucentAudit';

export const defaults: LucentSettings = {
  enabled: false,
  profile: 'raw',
  cognitive: { declutter: false, dyslexia: false, readingGuide: false, calmMode: false, readingWidth: false },
  motor: { targets: false, focus: false, shortcuts: false, steadyClick: true, largeCursor: false },
  visual: { fontSize: 16, daltonize: false, highContrast: false, magnifier: false, boldText: false, crosshairs: false, textToSpeech: false, colorPatterns: false }
};
function parse<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } }
function normalized(value: Partial<LucentSettings>): LucentSettings {
  return {
    ...defaults,
    ...value,
    cognitive: { ...defaults.cognitive, ...value.cognitive },
    motor: { ...defaults.motor, ...value.motor },
    visual: { ...defaults.visual, ...value.visual }
  };
}
type Store = {
  settings: LucentSettings;
  events: LucentEvent[];
  user: LucentUser | null;
  theme: 'dark'|'light';
  update: (patch: Partial<LucentSettings>) => void;
  addEvent: (event: Omit<LucentEvent, 'id' | 'at'>) => void;
  signIn: (user: LucentUser) => void;
  signOut: () => void;
  setTheme: (theme: 'dark'|'light') => void;
  extensionAvailable: boolean;
  auditState: AuditState | null;
  setAuditState: (state: AuditState | null) => void;
};
const Context = createContext<Store | null>(null);
export function isExcludedActivitySite(site?: string): boolean {

  if (!site) return true;
  const s = site.toLowerCase().trim();
  if (s === 'localhost' || s.startsWith('localhost:') || s === '127.0.0.1' || s.startsWith('127.0.0.1:')) return true;
  if (typeof window !== 'undefined') {
    const host = window.location.host.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    if (s === host || s === hostname || s.includes(host) || s.includes(hostname)) return true;
  }
  return false;
}

export function LucentProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(() => normalized(parse(SETTINGS, defaults)));
  const [events, setEvents] = useState<LucentEvent[]>(() => 
    parse<LucentEvent[]>(EVENTS, []).filter(e => !isExcludedActivitySite(e.site))
  );
  const [user, setUser] = useState<LucentUser | null>(() => parse<LucentUser | null>(USER, null));
  const [theme, setThemeState] = useState<'dark'|'light'>(() => parse(THEME, 'dark'));
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const [auditState, setAuditState] = useState<AuditState | null>(() => parse<AuditState | null>(AUDIT, null));
  const lastBroadcastRef = React.useRef<string>(JSON.stringify(settings));

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.data?.source === 'lucent-extension') {
        setExtensionAvailable(true);
        if (event.data.type === 'HELLO') {
          window.postMessage({ source: 'lucent-dashboard', type: 'PING' }, '*');
        }
        if (event.data.type === 'STATE' && event.data.settings) {
          const incoming = normalized(event.data.settings);
          const incomingStr = JSON.stringify(incoming);
          setSettings(prev => {
            if (JSON.stringify(prev) === incomingStr) return prev;
            lastBroadcastRef.current = incomingStr;
            return incoming;
          });
        }
        if (event.data.type === 'EVENT' && event.data.event) {
          if (!isExcludedActivitySite(event.data.event.site)) {
            setEvents(previous => previous.some(item => item.id === event.data.event.id) ? previous : [event.data.event, ...previous].slice(0, 100));
          }
        }
        if (event.data.type === 'EVENTS' && Array.isArray(event.data.events)) {
          setEvents(event.data.events.filter(e => !isExcludedActivitySite(e.site)));
        }
        if (event.data.type === 'AUDIT_COMPLETE' && event.data.results) {
          const newAudit: AuditState = {
            scannedAt: new Date().toISOString(),
            pageTitle: event.data.results.title || 'Audited Webpage',
            pageUrl: event.data.results.url || 'https://web.page',
            results: {
              smallTargets: event.data.results.smallTargets || 0,
              unlabeledButtons: event.data.results.unlabeledButtons || 0,
              lowContrast: event.data.results.lowContrast || 0,
              missingAlt: event.data.results.missingAlt || 0,
              total: event.data.results.total || 0,
            },
            remediated: Boolean(event.data.remediations),
            aiSummary: event.data.remediations?.summary,
            confidenceScore: event.data.remediations?.confidenceScore,
          };
          setAuditState(newAudit);
          localStorage.setItem(AUDIT, JSON.stringify(newAudit));
        }
      }
    };
    window.addEventListener('message', receive);
    const ping = () => {
      window.postMessage({ source: 'lucent-dashboard', type: 'PING' }, '*');
      window.postMessage({ source: 'lucent-dashboard', type: 'CONFIG', apiUrl: window.location.origin }, '*');
    };
    ping();

    // Gently check every 4 seconds to maintain connection without spam
    const interval = setInterval(ping, 4000);
    window.addEventListener('focus', ping);

    return () => {
      window.removeEventListener('message', receive);
      window.removeEventListener('focus', ping);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(SETTINGS, serialized);
    if (lastBroadcastRef.current !== serialized) {
      lastBroadcastRef.current = serialized;
      window.postMessage({ source: 'lucent-dashboard', type: 'SETTINGS', settings }, '*');
    }
  }, [settings]);
  useEffect(() => { localStorage.setItem(EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { if (user) localStorage.setItem(USER, JSON.stringify(user)); else localStorage.removeItem(USER); }, [user]);
  useEffect(() => { localStorage.setItem(THEME, JSON.stringify(theme)); document.documentElement.dataset.lucentTheme = theme; }, [theme]);
  useEffect(() => {
    if (auditState) {
      localStorage.setItem(AUDIT, JSON.stringify(auditState));
    }
  }, [auditState]);

  const value = useMemo(() => ({
    settings,
    events,
    user,
    theme,
    extensionAvailable,
    auditState,
    setAuditState,
    update: (patch: Partial<LucentSettings>) => setSettings(current => normalized({ ...current, ...patch })),
    addEvent: (event: Omit<LucentEvent, 'id' | 'at'>) => {
      if (isExcludedActivitySite(event.site)) return;
      setEvents(current => [{ ...event, id: crypto.randomUUID(), at: new Date().toISOString() }, ...current].slice(0, 100));
    },
    signIn: (nextUser: LucentUser) => setUser(nextUser),
    signOut: () => { setUser(null); setSettings(defaults); },
    setTheme: setThemeState
  }), [settings, events, user, theme, extensionAvailable, auditState]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLucent() { const state = useContext(Context); if (!state) throw new Error('useLucent must be used inside LucentProvider'); return state; }

