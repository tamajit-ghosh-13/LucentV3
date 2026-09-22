const key = 'lucentSettings';
const defaults = { enabled: false, cognitive: { declutter: false, dyslexia: false, readingGuide: false, calmMode: false }, motor: { targets: false, focus: false, shortcuts: false, steadyClick: true } };
let settings;
const master = document.querySelector('#master'); const status = document.querySelector('#status');
function setPath(path, value) { const [group, name] = path.split('.'); settings[group][name] = value; }
function render() { master.textContent = settings.enabled ? 'ON' : 'OFF'; master.classList.toggle('on', settings.enabled); document.querySelectorAll('[data-path]').forEach(input => { const [group,name]=input.dataset.path.split('.'); input.checked=!!settings[group][name]; input.disabled=!settings.enabled; }); }
async function apply() { await chrome.storage.local.set({ [key]: settings }); const [tab] = await chrome.tabs.query({ active:true,currentWindow:true }); if (tab?.id) chrome.tabs.sendMessage(tab.id,{type:'LUCENT_SETTINGS',settings},()=>void chrome.runtime.lastError); chrome.runtime.sendMessage({type:'TOGGLE_EXTENSION',enabled:settings.enabled}); status.textContent=settings.enabled?'Adaptations are active on this tab.':'Lucent is paused.'; render(); }
chrome.storage.local.get(key, stored => { settings = { ...defaults, ...(stored[key] || {}), cognitive:{...defaults.cognitive,...(stored[key]?.cognitive || {})}, motor:{...defaults.motor,...(stored[key]?.motor || {})} }; render(); });
master.addEventListener('click',()=>{settings.enabled=!settings.enabled;apply();});
document.querySelectorAll('[data-path]').forEach(input=>input.addEventListener('change',event=>{setPath(event.target.dataset.path,event.target.checked);apply();}));
document.querySelector('#btn-scan').addEventListener('click',async event=>{const [tab]=await chrome.tabs.query({active:true,currentWindow:true}); chrome.tabs.sendMessage(tab.id,{type:'SCAN_ACCESSIBILITY'},response=>{event.target.textContent=response?.results?`${response.results.total} issues found`:'Scan unavailable';});});
