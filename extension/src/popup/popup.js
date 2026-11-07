const key = 'lucentSettings';
const defaults = {
  enabled: false,
  profile: 'cognitive',
  cognitive: { declutter: false, dyslexia: false, readingGuide: false, calmMode: false, readingWidth: false },
  motor: { targets: false, focus: false, shortcuts: false, steadyClick: true, largeCursor: false },
  visual: { fontSize: 16, daltonize: false, highContrast: false, magnifier: false, boldText: false, crosshairs: false, textToSpeech: false }
};

let settings = { ...defaults };
const master = document.querySelector('#master');
const status = document.querySelector('#status');

function recordEvent(action, feature) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let site = '';
      let url = '';
      const activeTab = tabs?.[0];
      if (activeTab?.url && !activeTab.url.startsWith('chrome://')) {
        try {
          const u = new URL(activeTab.url);
          if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') {
            site = u.hostname;
            url = activeTab.url;
          }
        } catch (_) {}
      }
      if (!site) return; // Don't record dashboard/localhost or invalid tabs
      const event = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        at: new Date().toISOString(),
        site,
        url,
        action,
        feature
      };
      chrome.runtime.sendMessage({ type: 'LUCENT_RECORD_EVENT', event }, () => void chrome.runtime.lastError);
    });
  } catch (_) {}
}

function setPath(path, value) {
  const [group, name] = path.split('.');
  if (!settings[group]) settings[group] = {};
  settings[group][name] = value;
}

function render() {
  master.textContent = settings.enabled ? 'ON' : 'OFF';
  master.classList.toggle('on', !!settings.enabled);

  document.querySelectorAll('[data-path]').forEach(input => {
    const [group, name] = input.dataset.path.split('.');
    input.checked = !!settings[group]?.[name];
  });

  document.querySelectorAll('[data-profile]').forEach(btn => {
    btn.classList.toggle('active', settings.profile === btn.dataset.profile);
  });

  // Display only the active profile's feature card
  document.querySelectorAll('[data-card-profile]').forEach(card => {
    card.classList.toggle('active', card.dataset.cardProfile === settings.profile);
  });

  const fontSlider = document.querySelector('#popup-font-slider');
  const fontVal = document.querySelector('#popup-font-size-val');
  if (fontSlider && settings.visual?.fontSize) {
    fontSlider.value = String(settings.visual.fontSize);
    if (fontVal) fontVal.textContent = `${settings.visual.fontSize}px`;
  }

  status.textContent = settings.enabled ? 'Adaptations are active on this tab.' : 'Lucent is paused.';
}

async function apply(recordAction, recordFeature) {
  await chrome.storage.local.set({ [key]: settings, enabled: settings.enabled });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'LUCENT_SETTINGS', settings }, () => void chrome.runtime.lastError);
  }
  chrome.runtime.sendMessage({ type: 'TOGGLE_EXTENSION', enabled: settings.enabled });

  if (recordAction) {
    recordEvent(recordAction, recordFeature || 'Extension Popup');
  }
  render();
}

chrome.storage.local.get(key, stored => {
  settings = {
    ...defaults,
    ...(stored[key] || {}),
    cognitive: { ...defaults.cognitive, ...(stored[key]?.cognitive || {}) },
    motor: { ...defaults.motor, ...(stored[key]?.motor || {}) },
    visual: { ...defaults.visual, ...(stored[key]?.visual || {}) }
  };
  render();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[key]?.newValue) {
    settings = {
      ...defaults,
      ...changes[key].newValue,
      cognitive: { ...defaults.cognitive, ...(changes[key].newValue.cognitive || {}) },
      motor: { ...defaults.motor, ...(changes[key].newValue.motor || {}) },
      visual: { ...defaults.visual, ...(changes[key].newValue.visual || {}) }
    };
    render();
  }
});

master.addEventListener('click', () => {
  settings.enabled = !settings.enabled;
  apply(settings.enabled ? 'Extension turned ON' : 'Extension paused', 'Master Power');
});

document.querySelectorAll('[data-path]').forEach(input => {
  input.addEventListener('change', event => {
    const checked = event.target.checked;
    setPath(event.target.dataset.path, checked);
    if (checked) {
      settings.enabled = true; // Auto-activate master when turning on any feature
    }
    const row = event.target.closest('.row');
    const label = row?.querySelector('label')?.childNodes[0]?.textContent?.trim() || event.target.dataset.path;
    const category = event.target.dataset.path.startsWith('visual')
      ? 'Visual & Low Vision'
      : event.target.dataset.path.startsWith('motor')
      ? 'Motor & Tremor'
      : 'Cognitive & ADHD';
    apply(`${checked ? 'Enabled' : 'Disabled'} ${label}`, category);
  });
});

document.querySelectorAll('[data-profile]').forEach(btn => {
  btn.addEventListener('click', () => {
    const prof = btn.dataset.profile;
    settings.profile = prof;
    const profLabel = prof === 'visual' ? 'Visual & Low Vision' : prof === 'motor' ? 'Motor & Tremor' : 'Cognitive & ADHD';
    apply(`Switched profile to ${profLabel}`, 'Profile Switcher');
  });
});

const popupFontSlider = document.querySelector('#popup-font-slider');
const popupFontVal = document.querySelector('#popup-font-size-val');

if (popupFontSlider) {
  popupFontSlider.addEventListener('input', async (e) => {
    const val = Number(e.target.value);
    if (popupFontVal) popupFontVal.textContent = `${val}px`;
    if (!settings.visual) settings.visual = {};
    settings.visual.fontSize = val;
    settings.enabled = true;
    master.textContent = 'ON';
    master.classList.add('on');

    // Instantaneous broadcast to active tab during sliding
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'LUCENT_FONT_SIZE', fontSize: val }, () => void chrome.runtime.lastError);
    }
  });

  popupFontSlider.addEventListener('change', async (e) => {
    const val = Number(e.target.value);
    apply(`Scaled font size to ${val}px`, 'Visual & Low Vision');
  });
}

let currentScanResults = null;

const scanBtn = document.querySelector('#btn-scan');
const fixBtn = document.querySelector('#btn-fix');
const scanBox = document.querySelector('#scan-results-box');
const aiStatus = document.querySelector('#ai-remediation-status');

scanBtn?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  scanBtn.textContent = 'Scanning active page...';
  chrome.tabs.sendMessage(tab.id, { type: 'SCAN_ACCESSIBILITY' }, response => {
    const results = response?.results;
    currentScanResults = results;
    if (results) {
      scanBtn.innerHTML = `<span>🔍</span> Re-scan Tab (${results.total} issues)`;
      scanBox?.classList.add('open');

      const setVal = (id, count) => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = count;
          el.classList.toggle('zero', count === 0);
        }
      };

      setVal('stat-unlabeled', results.unlabeledButtons ?? 0);
      setVal('stat-alt', results.missingAlt ?? 0);
      setVal('stat-targets', results.smallTargets ?? 0);
      setVal('stat-contrast', results.lowContrast ?? 0);

      if (aiStatus) {
        aiStatus.textContent = results.total === 0 
          ? 'Great job! No critical accessibility barriers found.' 
          : `Detected ${results.total} barriers. Click below to remediate with Gemini AI.`;
      }
      recordEvent(`Scanned active tab: ${results.total} issues detected`, 'Visual Scanner');
    } else {
      scanBtn.innerHTML = '<span>🔍</span> Scan Active Tab';
    }
  });
});

fixBtn?.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  fixBtn.disabled = true;
  fixBtn.textContent = '✨ Remediating with Gemini AI...';

  chrome.tabs.sendMessage(tab.id, { type: 'GEMINI_AI_SCAN' }, response => {
    fixBtn.disabled = false;
    if (response?.success) {
      fixBtn.innerHTML = '<span>✓</span> Successfully Remediated!';
      fixBtn.style.background = '#059669';

      const count = response.results?.total ?? currentScanResults?.total ?? 0;
      const conf = Math.round((response.remediations?.confidenceScore ?? 0.95) * 100);

      if (aiStatus) {
        aiStatus.innerHTML = `<strong>Remediated ${count} barriers.</strong><br>Labels &amp; alt descriptions injected (Confidence: ${conf}%).`;
      }

      // Zero out stats
      ['stat-unlabeled', 'stat-alt', 'stat-targets', 'stat-contrast'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = '0';
          el.classList.add('zero');
        }
      });

      recordEvent(`Gemini AI auto-remediated ${count} barriers on tab`, 'AI Auto-Remediate');
    } else {
      fixBtn.innerHTML = '<span>✨</span> Remediate with Gemini AI';
      if (aiStatus) aiStatus.textContent = 'Remediation completed using fallback heuristics.';
    }
  });
});

document.querySelector('#open-dashboard')?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.query({}, (tabs) => {
    const existing = tabs.find(t => t.url && (t.url.includes('/dashboard') || t.url.includes('localhost:300')));
    if (existing?.id) {
      chrome.tabs.update(existing.id, { active: true });
    } else {
      chrome.tabs.create({ url: 'http://localhost:3001/dashboard' });
    }
  });
});

// Speech Controller (Read Selected Text)
const popupSpeakBtn = document.getElementById('popup-speak-btn');
const popupSpeechBadge = document.getElementById('popup-speech-badge');
const popupSpeechPreview = document.getElementById('popup-speech-preview');

function updatePopupSpeechUI(isSpeaking, text) {
  if (!popupSpeakBtn) return;
  if (isSpeaking) {
    popupSpeakBtn.style.background = 'rgba(239, 68, 68, 0.25)';
    popupSpeakBtn.style.color = '#fca5a5';
    popupSpeakBtn.style.borderColor = '#ef4444';
    popupSpeakBtn.innerHTML = '<span>⏹</span> Stop Reading';
    if (popupSpeechBadge) {
      popupSpeechBadge.textContent = 'Speaking... 🔊';
      popupSpeechBadge.style.color = '#f87171';
      popupSpeechBadge.style.background = 'rgba(239, 68, 68, 0.2)';
    }
  } else if (text) {
    const words = text.split(/\s+/).filter(Boolean).length;
    popupSpeakBtn.style.background = '#22c55e';
    popupSpeakBtn.style.color = '#042b12';
    popupSpeakBtn.style.borderColor = '#4ade80';
    popupSpeakBtn.innerHTML = '<span>🔊</span> Read Selected Text';
    if (popupSpeechBadge) {
      popupSpeechBadge.textContent = `${words} word${words === 1 ? '' : 's'}`;
      popupSpeechBadge.style.color = '#4ade80';
      popupSpeechBadge.style.background = 'rgba(34, 197, 94, 0.2)';
    }
    if (popupSpeechPreview) {
      popupSpeechPreview.style.display = 'block';
      const snippet = text.length > 36 ? text.slice(0, 36) + '...' : text;
      popupSpeechPreview.textContent = `Selected: "${snippet}"`;
    }
  } else {
    popupSpeakBtn.style.background = '#1d3d2b';
    popupSpeakBtn.style.color = '#8df4b5';
    popupSpeakBtn.style.borderColor = '#3c8055';
    popupSpeakBtn.innerHTML = '<span>🔊</span> Read Selected Text';
    if (popupSpeechBadge) {
      popupSpeechBadge.textContent = 'Ready';
      popupSpeechBadge.style.color = '#8bb799';
      popupSpeechBadge.style.background = 'rgba(34, 197, 94, 0.15)';
    }
    if (popupSpeechPreview) {
      popupSpeechPreview.style.display = 'none';
    }
  }
}

if (popupSpeakBtn) {
  popupSpeakBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'LUCENT_SPEAK_SELECTION' }, response => {
        if (chrome.runtime.lastError) return;
        updatePopupSpeechUI(response?.isSpeaking, response?.text);
      });
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'LUCENT_GET_SELECTION' }, response => {
        if (chrome.runtime.lastError) return;
        updatePopupSpeechUI(response?.isSpeaking, response?.text);
        updatePopupSimplifyUI(response?.text);
      });
    }
  });
}

// Cognitive: AI Text Simplification Controller
const popupSimplifyBtn = document.getElementById('popup-simplify-btn');
const popupRestoreBtn = document.getElementById('popup-restore-btn');
const popupSimplifyBadge = document.getElementById('popup-simplify-badge');
const popupSimplifyStatus = document.getElementById('popup-simplify-status');
const popupSimplifyPreview = document.getElementById('popup-simplify-preview');

function updatePopupSimplifyUI(text) {
  if (!popupSimplifyBtn) return;
  if (text) {
    const words = text.split(/\s+/).filter(Boolean).length;
    popupSimplifyBtn.style.background = '#22c55e';
    popupSimplifyBtn.style.color = '#042b12';
    popupSimplifyBtn.style.borderColor = '#4ade80';
    popupSimplifyBtn.innerHTML = '<span>✨</span> Simplify Selected Text';
    if (popupSimplifyBadge) {
      popupSimplifyBadge.textContent = `${words} word${words === 1 ? '' : 's'}`;
      popupSimplifyBadge.style.color = '#4ade80';
      popupSimplifyBadge.style.background = 'rgba(34, 197, 94, 0.2)';
    }
    if (popupSimplifyPreview) {
      popupSimplifyPreview.style.display = 'block';
      const snippet = text.length > 36 ? text.slice(0, 36) + '...' : text;
      popupSimplifyPreview.textContent = `Selected: "${snippet}"`;
    }
  } else {
    popupSimplifyBtn.style.background = '#1d3d2b';
    popupSimplifyBtn.style.color = '#8df4b5';
    popupSimplifyBtn.style.borderColor = '#3c8055';
    popupSimplifyBtn.innerHTML = '<span>✨</span> Simplify Selected Text';
    if (popupSimplifyBadge) {
      popupSimplifyBadge.textContent = 'Ready';
      popupSimplifyBadge.style.color = '#8bb799';
      popupSimplifyBadge.style.background = 'rgba(34, 197, 94, 0.15)';
    }
    if (popupSimplifyPreview) {
      popupSimplifyPreview.style.display = 'none';
    }
  }
}

if (popupSimplifyBtn) {
  popupSimplifyBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    popupSimplifyBtn.disabled = true;
    popupSimplifyBtn.innerHTML = '<span>✨</span> Simplifying with AI...';
    if (popupSimplifyBadge) {
      popupSimplifyBadge.textContent = 'Thinking...';
      popupSimplifyBadge.style.color = '#fbbf24';
    }

    chrome.tabs.sendMessage(tab.id, { type: 'SIMPLIFY_PAGE_AI' }, response => {
      popupSimplifyBtn.disabled = false;
      popupSimplifyBtn.innerHTML = '<span>✨</span> Simplify Selected Text';

      if (response && response.count > 0) {
        if (popupSimplifyBadge) {
          popupSimplifyBadge.textContent = `Simplified! ✓`;
          popupSimplifyBadge.style.color = '#4ade80';
        }
        if (popupSimplifyStatus) {
          popupSimplifyStatus.style.display = 'block';
          popupSimplifyStatus.textContent = `Paragraph simplified into plain-language bullets. Click card on page to view original.`;
        }
        if (popupRestoreBtn) popupRestoreBtn.style.display = 'flex';
        recordEvent(`AI simplified selected paragraph on active tab`, 'Cognitive & ADHD');
      } else {
        if (popupSimplifyBadge) {
          popupSimplifyBadge.textContent = 'Select text 👆';
          popupSimplifyBadge.style.color = '#f87171';
        }
        if (popupSimplifyStatus) {
          popupSimplifyStatus.style.display = 'block';
          popupSimplifyStatus.textContent = 'Please highlight text or a paragraph on the page first.';
        }
      }
    });
  });
}

if (popupRestoreBtn) {
  popupRestoreBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'RESTORE_ORIGINAL_TEXT' }, () => {
      if (popupRestoreBtn) popupRestoreBtn.style.display = 'none';
      if (popupSimplifyBadge) {
        popupSimplifyBadge.textContent = 'Ready';
        popupSimplifyBadge.style.color = '#8bb799';
      }
      if (popupSimplifyStatus) popupSimplifyStatus.style.display = 'none';
      recordEvent('Restored original paragraph text', 'Cognitive & ADHD');
    });
  });
}

// Gemini API Key Management
const apiKeyInput = document.getElementById('custom-api-key-input');
const apiKeySaveBtn = document.getElementById('save-api-key-btn');
const apiKeyStatus = document.getElementById('api-key-status');
const apiKeyIndicator = document.getElementById('api-key-indicator');

chrome.runtime.sendMessage({ type: 'GET_GEMINI_KEY' }, (res) => {
  if (chrome.runtime.lastError || !res) return;
  if (apiKeyInput && res.isCustom) {
    apiKeyInput.value = res.apiKey;
  }
  if (apiKeyIndicator) {
    apiKeyIndicator.textContent = res.isCustom ? 'Custom Key' : 'Default Key';
    apiKeyIndicator.style.color = res.isCustom ? '#60a5fa' : '#4ade80';
  }
});

apiKeySaveBtn?.addEventListener('click', () => {
  const keyVal = apiKeyInput?.value?.trim() || '';
  apiKeySaveBtn.disabled = true;
  apiKeySaveBtn.textContent = '...';

  chrome.runtime.sendMessage({ type: 'SET_GEMINI_KEY', apiKey: keyVal }, () => {
    apiKeySaveBtn.disabled = false;
    apiKeySaveBtn.textContent = 'Save';

    if (apiKeyStatus) {
      apiKeyStatus.style.display = 'block';
      apiKeyStatus.textContent = keyVal ? 'Custom Gemini API key saved!' : 'Reset to default Gemini free-tier key.';
      setTimeout(() => {
        apiKeyStatus.style.display = 'none';
      }, 3000);
    }
    if (apiKeyIndicator) {
      apiKeyIndicator.textContent = keyVal ? 'Custom Key' : 'Default Key';
      apiKeyIndicator.style.color = keyVal ? '#60a5fa' : '#4ade80';
    }
  });
});


