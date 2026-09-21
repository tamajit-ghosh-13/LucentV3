import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AccessibilityProfile } from '../types';

export type LucentSettings = {
  enabled: boolean;
  profile: Exclude<AccessibilityProfile, 'visual'> | 'raw';
  cognitive: { declutter: boolean; dyslexia: boolean; readingGuide: boolean; calmMode: boolean; readingWidth: boolean };
  motor: { targets: boolean; focus: boolean; shortcuts: boolean; steadyClick: boolean; largeCursor: boolean };
};
export type LucentEvent = { id: string; at: string; site: string; action: string; feature: string };
export type LucentUser = { name: string; email: string; guest?: boolean };
const SETTINGS = 'lucentSettings'; const EVENTS = 'lucentEvents'; const USER = 'lucentUser'; const THEME = 'lucentTheme';
export const defaults: LucentSettings = { enabled: false, profile: 'raw', cognitive: { declutter: false, dyslexia: false, readingGuide: false, calmMode: false, readingWidth: false }, motor: { targets: false, focus: false, shortcuts: false, steadyClick: true, largeCursor: false } };
function parse<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } }
function normalized(value: Partial<LucentSettings>): LucentSettings { return { ...defaults, ...value, cognitive: { ...defaults.cognitive, ...value.cognitive }, motor: { ...defaults.motor, ...value.motor } }; }
type Store = { settings: LucentSettings; events: LucentEvent[]; user: LucentUser | null; theme: 'dark'|'light'; update: (patch: Partial<LucentSettings>) => void; addEvent: (event: Omit<LucentEvent, 'id' | 'at'>) => void; signIn: (user: LucentUser) => void; signOut: () => void; setTheme: (theme: 'dark'|'light') => void; extensionAvailable: boolean };
const Context = createContext<Store | null>(null);
export function LucentProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(() => normalized(parse(SETTINGS, defaults)));
  const [events, setEvents] = useState<LucentEvent[]>(() => parse(EVENTS, []));
  const [user, setUser] = useState<LucentUser | null>(() => parse<LucentUser | null>(USER, null));
  const [theme, setThemeState] = useState<'dark'|'light'>(() => parse(THEME, 'dark'));
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  useEffect(() => {
    const receive = (event: MessageEvent) => { if (event.data?.source === 'lucent-extension') { setExtensionAvailable(true); if (event.data.type === 'STATE') setSettings(normalized(event.data.settings)); if (event.data.type === 'EVENT') setEvents(previous => previous.some(item => item.id === event.data.event.id) ? previous : [event.data.event, ...previous].slice(0, 100)); if (event.data.type === 'EVENTS') setEvents(event.data.events || []); } };
    window.addEventListener('message', receive); window.postMessage({ source: 'lucent-dashboard', type: 'PING' }, window.location.origin);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => { localStorage.setItem(SETTINGS, JSON.stringify(settings)); window.postMessage({ source: 'lucent-dashboard', type: 'SETTINGS', settings }, window.location.origin); }, [settings]);
  useEffect(() => { localStorage.setItem(EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { if (user) localStorage.setItem(USER, JSON.stringify(user)); else localStorage.removeItem(USER); }, [user]);
  useEffect(() => { localStorage.setItem(THEME, JSON.stringify(theme)); document.documentElement.dataset.lucentTheme = theme; }, [theme]);
  const value = useMemo(() => ({ settings, events, user, theme, extensionAvailable, update: (patch: Partial<LucentSettings>) => setSettings(current => normalized({ ...current, ...patch })), addEvent: (event: Omit<LucentEvent, 'id' | 'at'>) => setEvents(current => [{ ...event, id: crypto.randomUUID(), at: new Date().toISOString() }, ...current].slice(0, 100)), signIn: (nextUser: LucentUser) => setUser(nextUser), signOut: () => { setUser(null); setSettings(defaults); }, setTheme: setThemeState }), [settings, events, user, theme, extensionAvailable]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLucent() { const state = useContext(Context); if (!state) throw new Error('useLucent must be used inside LucentProvider'); return state; }
