// Lucent's visual scanner lives below unchanged in spirit. Cognitive and motor
// adaptations are self-contained, reversible, and never alter a site's handlers.
const ROOT = document.documentElement;
const settingsKey = 'lucentSettings';
let settings = { enabled: false, profile: 'raw', cognitive: { declutter: false, dyslexia: false, readingGuide: false, calmMode: false, readingWidth: false }, motor: { targets: false, focus: false, shortcuts: false, steadyClick: false, largeCursor: false } };
let guide;
let shortcutNodes = [];
const recentActivations = new WeakMap();
let lucentWidget, lucentWidgetRoot, widgetProfile;
let widgetObserver;
let largeCursor;
const clutterSelector = 'aside, [role="banner"], [role="complementary"], [aria-label*="advert" i], [class*="advert" i], [class*="popup" i], [class*="modal" i], [class*="cookie" i]';

function applySettings(next) {
  settings = next;
  const c = settings.cognitive || {};
  const m = settings.motor || {};
  ROOT.classList.toggle('lucent-enabled', !!settings.enabled);
  ROOT.classList.toggle('lucent-declutter', !!settings.enabled && !!c.declutter);
  ROOT.classList.toggle('lucent-dyslexia', !!settings.enabled && !!c.dyslexia);
  ROOT.classList.toggle('lucent-calm', !!settings.enabled && !!c.calmMode);
  ROOT.classList.toggle('lucent-reading-width', !!settings.enabled && !!c.readingWidth);
  ROOT.classList.toggle('lucent-motor-targets', !!settings.enabled && !!m.targets);
  ROOT.classList.toggle('lucent-focus', !!settings.enabled && !!m.focus);
  ROOT.classList.toggle('lucent-large-cursor', !!settings.enabled && !!m.largeCursor);
  updateDeclutter(!!settings.enabled && !!c.declutter);
  if (settings.enabled && m.largeCursor) enableLargeCursor(); else disableLargeCursor();
  if (settings.enabled && c.readingGuide) enableGuide(); else disableGuide();
  if (settings.enabled && m.shortcuts) assignShortcuts(); else clearShortcuts();
  if (lucentWidgetRoot && widgetProfile !== settings.profile) rebuildWidgetOptions();
  renderWidget();
  report('settings updated', settings.profile === 'cognitive' ? 'Cognitive / ADHD' : settings.profile === 'motor' ? 'Motor assistance' : 'Baseline');
}

function updateDeclutter(enabled) {
  document.querySelectorAll('[data-lucent-declutter]').forEach(node => { node.hidden = false; delete node.dataset.lucentDeclutter; });
  if (!enabled) return;
  const selectors = '[aria-label*="advert" i],[id*="advert" i],[class*="advert" i],[id*="sponsor" i],[class*="sponsor" i],[id*="cookie" i],[class*="cookie" i],[id*="newsletter" i],[class*="newsletter" i],[class*="popup" i],[class*="promo" i]';
  document.querySelectorAll(selectors).forEach(node => {
    if (node.closest('#lucent-widget') || node.matches('main,article,[role="main"]')) return;
    const rect = node.getBoundingClientRect();
    if (rect.width > 40 && rect.height > 20) { node.hidden = true; node.dataset.lucentDeclutter = 'true'; }
  });
}

function enableLargeCursor() {
  if (largeCursor) return;
  largeCursor = document.createElement('div'); largeCursor.className = 'lucent-large-cursor-dot'; largeCursor.setAttribute('aria-hidden','true'); document.body.appendChild(largeCursor);
  document.addEventListener('pointermove', moveLargeCursor, { passive:true });
}
function moveLargeCursor(event) { if (largeCursor) largeCursor.style.transform = `translate(${event.clientX - 14}px,${event.clientY - 14}px)`; }
function disableLargeCursor() { document.removeEventListener('pointermove', moveLargeCursor); largeCursor?.remove(); largeCursor = undefined; }

function createWidget() {
  if (lucentWidget || !document.body) return;
  // Shadow DOM protects this UI from every host website's CSS and JavaScript.
  lucentWidget = document.createElement('section'); lucentWidget.id = 'lucent-widget'; lucentWidget.setAttribute('aria-label', 'Lucent accessibility controls'); lucentWidgetRoot = lucentWidget.attachShadow({ mode: 'closed' });
  lucentWidgetRoot.innerHTML = `<style>:host{all:initial;position:fixed;right:20px;bottom:20px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;color:#ecfff3;line-height:1.25;text-align:left}.fab{border:1px solid #5b6b62;background:#38463d;color:#f1fff5;border-radius:999px;padding:11px 15px;display:flex;align-items:center;gap:8px;font:700 14px system-ui;box-shadow:0 12px 30px rgba(0,0,0,.3);cursor:pointer}.on .fab{background:#22c55e;border-color:#86efac;color:#073618;box-shadow:0 0 0 4px rgba(34,197,94,.22),0 12px 30px rgba(0,0,0,.3)}.menu{position:absolute;right:0;bottom:55px;width:270px;padding:14px;background:#0c1b12;border:1px solid #42664e;border-radius:15px;box-shadow:0 18px 45px rgba(0,0,0,.45)}.header{display:flex;align-items:center;justify-content:space-between;font-size:14px}.hint{color:#accab6;font-size:12px;margin:6px 0 10px}.master{border:0;border-radius:999px;background:#46554c;color:#fff;padding:6px 10px;font-weight:800;cursor:pointer}.master.on{background:#22c55e;color:#073618}.options{border-top:1px solid #294334;padding-top:5px}.options label{display:flex;justify-content:space-between;align-items:center;padding:8px 1px;color:#e5f5e9;font-size:13px;cursor:pointer}.options input{accent-color:#22c55e;width:16px;height:16px}</style><button class="fab" aria-expanded="false" aria-label="Open Lucent accessibility controls"><span>✦</span><b>Lucent</b></button><div class="menu" hidden><div class="header"><strong>Accessibility tools</strong><button class="master" type="button"></button></div><p class="hint">Choose what helps on this website.</p><div class="options"></div></div>`;
  document.body.appendChild(lucentWidget);
  watchWidget();
  const fab = lucentWidgetRoot.querySelector('.fab'); const menu = lucentWidgetRoot.querySelector('.menu');
  fab.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; fab.setAttribute('aria-expanded', String(open)); });
  lucentWidgetRoot.querySelector('.master').addEventListener('click', () => persistSettings({ ...settings, enabled: !settings.enabled }));
  rebuildWidgetOptions();
  renderWidget();
}
function watchWidget() {
  if (widgetObserver) return;
  // SPAs often replace their body after navigation. Reinsert the controller without user action.
  widgetObserver = new MutationObserver(() => {
    if (!document.body) return;
    if (!lucentWidget?.isConnected) { lucentWidget = undefined; lucentWidgetRoot = undefined; widgetProfile = undefined; createWidget(); applySettings(settings); }
  });
  widgetObserver.observe(document.documentElement, { childList: true, subtree: true });
}
function rebuildWidgetOptions() {
  if (!lucentWidgetRoot) return;
  widgetProfile = settings.profile;
  const options = settings.profile === 'motor'
    ? [['motor.targets','48 px targets'],['motor.focus','Focus halo'],['motor.shortcuts','Number shortcuts'],['motor.steadyClick','Steady click'],['motor.largeCursor','Large cursor']]
    : [['cognitive.declutter','De-clutter'],['cognitive.readingGuide','Reading guide'],['cognitive.dyslexia','Dyslexia-friendly text'],['cognitive.calmMode','Calm mode'],['cognitive.readingWidth','Comfortable reading width']];
  lucentWidgetRoot.querySelector('.options').innerHTML = options.map(([path,label]) => `<label><span>${label}</span><input type="checkbox" data-path="${path}"></label>`).join('');
  lucentWidgetRoot.querySelectorAll('input[data-path]').forEach(input => input.addEventListener('change', (event) => { const [group, name] = event.target.dataset.path.split('.'); persistSettings({ ...settings, [group]: { ...settings[group], [name]: event.target.checked } }); }));
  renderWidget();
}
function persistSettings(next) { chrome.storage.local.set({ [settingsKey]: next }); }
function renderWidget() {
  if (!lucentWidgetRoot) return;
  const panel = lucentWidgetRoot.querySelector('.fab').parentElement; panel.classList.toggle('on', !!settings.enabled);
  const master = lucentWidgetRoot.querySelector('.master'); master.textContent = settings.enabled ? 'On' : 'Off'; master.classList.toggle('on', !!settings.enabled);
  lucentWidgetRoot.querySelectorAll('input[data-path]').forEach(input => { const [group,name] = input.dataset.path.split('.'); input.checked = !!settings[group]?.[name]; input.disabled = !settings.enabled; });
}

function report(action, feature) {
  const event = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: new Date().toISOString(), site: location.hostname, action, feature };
  // The worker serialises writes so simultaneous tabs cannot overwrite each other's history.
  chrome.runtime.sendMessage({ type: 'LUCENT_RECORD_EVENT', event }, () => void chrome.runtime.lastError);
  // The dashboard page receives this only when this content script is injected there.
  if (location.origin === 'http://localhost:3000') window.postMessage({ source: 'lucent-extension', type: 'EVENT', event }, location.origin);
}

function enableGuide() {
  if (guide) return;
  guide = document.createElement('div'); guide.className = 'lucent-reading-guide'; guide.setAttribute('aria-hidden', 'true');
  document.body.appendChild(guide);
  document.addEventListener('pointermove', moveGuide, { passive: true });
}
function moveGuide(event) { if (guide) guide.style.transform = `translateY(${event.clientY - 34}px)`; }
function disableGuide() { document.removeEventListener('pointermove', moveGuide); guide?.remove(); guide = undefined; }

function assignShortcuts() {
  clearShortcuts();
  shortcutNodes = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')]
    .filter((node) => { const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !node.closest('[aria-hidden="true"]'); })
    .slice(0, 9);
  shortcutNodes.forEach((node, index) => { node.dataset.lucentShortcut = String(index + 1); });
}
function clearShortcuts() { shortcutNodes.forEach((node) => delete node.dataset.lucentShortcut); shortcutNodes = []; }

document.addEventListener('keydown', (event) => {
  if (!settings.enabled || !settings.motor?.shortcuts || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && shortcutNodes[index]) { event.preventDefault(); shortcutNodes[index].focus(); shortcutNodes[index].click(); }
}, true);

// Filters accidental duplicate activations without blocking normal clicks.
function blockRepeatActivation(event) {
  if (!settings.enabled || !settings.motor?.steadyClick) return;
  const target = event.target.closest?.('button, a, input, select, [role="button"]'); if (!target) return;
  const now = Date.now(); const last = recentActivations.get(target) || 0;
  if (now - last < 550) { event.preventDefault(); event.stopImmediatePropagation(); report('Blocked accidental repeat activation', 'Steady click'); return; }
  recentActivations.set(target, now);
}
document.addEventListener('click', blockRepeatActivation, true);

chrome.storage.local.get(settingsKey, (stored) => {
  createWidget(); applySettings({ ...settings, ...(stored[settingsKey] || {}) });
  if (settings.enabled && location.origin !== 'http://localhost:3000') report(`Visited ${document.title || location.pathname}`, settings.profile === 'motor' ? 'Motor assistance' : 'Cognitive / ADHD');
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  // Replace the complete profile state so every existing tab immediately reflects a profile switch.
  if (changes[settingsKey]) applySettings(changes[settingsKey].newValue);
  if (location.origin === 'http://localhost:3000' && changes.lucentEvents?.newValue?.[0]) window.postMessage({ source: 'lucent-extension', type: 'EVENT', event: changes.lucentEvents.newValue[0] }, location.origin);
});

// Safe bridge for the local dashboard. No privileged APIs are exposed to webpages.
if (location.origin === 'http://localhost:3000') {
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== location.origin || event.data?.source !== 'lucent-dashboard') return;
    if (event.data.type === 'PING') chrome.storage.local.get('lucentEvents', (stored) => {
      window.postMessage({ source: 'lucent-extension', type: 'STATE', settings }, location.origin);
      window.postMessage({ source: 'lucent-extension', type: 'EVENTS', events: stored.lucentEvents || [] }, location.origin);
    });
    if (event.data.type === 'SETTINGS' && event.data.settings) chrome.storage.local.set({ [settingsKey]: event.data.settings });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LUCENT_EVENT_RECORDED' && location.origin === 'http://localhost:3000') { window.postMessage({ source:'lucent-extension', type:'EVENT', event:message.event }, location.origin); return; }
  if (message.type === 'LUCENT_SETTINGS') { applySettings(message.settings); sendResponse({ success: true }); return; }
  if (message.type === 'LUCENT_STATUS') { sendResponse({ settings, activeShortcuts: shortcutNodes.length }); return; }
  if (message.type === 'SCAN_ACCESSIBILITY') { const results = scanAccessibility(); sendResponse({ results }); return; }
  if (message.type === 'REINFORCE_ACCESSIBILITY') { reinforceAccessibility(); removeHighlights(); sendResponse({ success: true }); }
});

let highlightedElements = [];
function getLuminance(r, g, b) { const a = [r,g,b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return a[0] * .2126 + a[1] * .7152 + a[2] * .0722; }
function parseColor(value) { const rgb = value.match(/\d+/g); return rgb?.length >= 3 ? { r:+rgb[0], g:+rgb[1], b:+rgb[2] } : null; }
function checkContrast(el) { const s = getComputedStyle(el); if (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') return true; const bg = parseColor(s.backgroundColor), fg = parseColor(s.color); if (!bg || !fg) return true; const a=getLuminance(bg.r,bg.g,bg.b), b=getLuminance(fg.r,fg.g,fg.b); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05) >= 4.5; }
function highlightElement(el, issue) { el.dataset.lucentOriginalOutline=el.style.outline; el.dataset.accessibilityIssue=issue; el.style.outline='3px dashed #f87171'; el.style.outlineOffset='2px'; highlightedElements.push(el); }
function removeHighlights() { highlightedElements.forEach(el => { el.style.outline=el.dataset.lucentOriginalOutline || ''; el.style.outlineOffset=''; delete el.dataset.lucentOriginalOutline; delete el.dataset.accessibilityIssue; }); highlightedElements=[]; }
function scanAccessibility() { removeHighlights(); let smallTargets=0, unlabeledButtons=0, lowContrast=0, missingAlt=0; const controls=document.querySelectorAll('button,a,[role="button"]'); controls.forEach(el => { if (!el.textContent.trim()&&!el.getAttribute('aria-label')) { unlabeledButtons++; highlightElement(el,'unlabeled'); } const r=el.getBoundingClientRect(); if(r.width&&r.height&&(r.width<44||r.height<44)){smallTargets++;highlightElement(el,'small-target');} }); document.querySelectorAll('img').forEach(img=>{if((!img.hasAttribute('alt')||img.alt==='')&&img.getAttribute('role')!=='presentation'){missingAlt++;highlightElement(img,'missing-alt');}}); [...document.querySelectorAll('p,span,h1,h2,h3,h4,h5,h6')].slice(0,100).forEach(el=>{if(el.textContent.trim()&&!checkContrast(el)){lowContrast++;highlightElement(el,'low-contrast');}}); return {smallTargets,unlabeledButtons,lowContrast,missingAlt,total:smallTargets+unlabeledButtons+lowContrast+missingAlt}; }
function reinforceAccessibility() { ROOT.dataset.accessibilityEnabled='true'; document.querySelectorAll('button:not([aria-label]),a:not([aria-label]),[role="button"]:not([aria-label])').forEach(el=>{if(!el.textContent.trim())el.setAttribute('aria-label',`Action ${el.id || 'control'}`);}); document.querySelectorAll('img:not([alt]),img[alt=""]').forEach(img=>img.setAttribute('alt','Image description provided by Lucent')); }
