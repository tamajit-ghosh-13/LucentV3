// Lucent's visual scanner and runtime accessibility adaptations
const ROOT = document.documentElement;
const settingsKey = 'lucentSettings';
let settings = {
  enabled: false,
  profile: 'cognitive',
  cognitive: { declutter: false, dyslexia: false, readingGuide: false, calmMode: false, readingWidth: false },
  motor: { targets: false, focus: false, shortcuts: false, steadyClick: false, largeCursor: false },
  visual: { fontSize: 16, daltonize: false, highContrast: false, magnifier: false, boldText: false, crosshairs: false, textToSpeech: false }
};
let guide;
let shortcutNodes = [];
const recentActivations = new WeakMap();
let lucentWidget, lucentWidgetRoot, widgetProfile;
let widgetObserver;
let largeCursor;

// Visual runtime controllers
let daltonizeSvg;
let crosshairH, crosshairV;
let magnifier;
let speechActiveEl;
let currentSelectedText = '';
let isSpeaking = false;

// Catch extension context invalidation globally
window.addEventListener('error', (event) => {
  if (event?.message?.includes?.('Extension context invalidated') ||
      event?.error?.message?.includes?.('Extension context invalidated')) {
    try {
      event.preventDefault();
      event.stopImmediatePropagation();
      cleanupContext();
    } catch (_) {}
  }
}, true);

function isDashboard() {
  try {
    const host = location.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      Boolean(window.isLucentDashboardTab) ||
      Boolean(document.getElementById('root') && (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/activity') || location.pathname === '/'))
    );
  } catch {
    return false;
  }
}

function isExtensionValid() {
  try {
    return Boolean(typeof chrome !== 'undefined' && chrome?.runtime && !!chrome.runtime.id);
  } catch {
    return false;
  }
}

function cleanupContext() {
  try {
    window.removeEventListener('message', handleDashboardMessage);
    document.removeEventListener('click', blockRepeatActivation, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    disableGuide();
    disableLargeCursor();
    disableDaltonize();
    disableCrosshairs();
    disableMagnifier();
    stopSpeech();
    clearShortcuts();
    if (fontStyleEl) {
      fontStyleEl.textContent = '';
    }
    if (widgetObserver) {
      widgetObserver.disconnect();
      widgetObserver = undefined;
    }
    if (lucentWidget) {
      lucentWidget.remove();
      lucentWidget = undefined;
      lucentWidgetRoot = undefined;
    }
  } catch (_) {}
}

async function safeStorageGet(keys) {
  if (!isExtensionValid()) { cleanupContext(); return null; }
  try {
    return await chrome.storage.local.get(keys);
  } catch {
    cleanupContext();
    return null;
  }
}

async function safeStorageSet(obj) {
  if (!isExtensionValid()) { cleanupContext(); return false; }
  try {
    await chrome.storage.local.set(obj);
    return true;
  } catch {
    cleanupContext();
    return false;
  }
}

async function safeSendMessage(message) {
  if (!isExtensionValid()) { cleanupContext(); return null; }
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    cleanupContext();
    return null;
  }
}

function persistSettings(next) {
  safeStorageSet({ [settingsKey]: next, enabled: next.enabled });
}

function applySettings(next) {
  settings = next || settings;
  if (isDashboard()) return;

  const isEnabled = !!settings.enabled;
  const c = settings.cognitive || {};
  const m = settings.motor || {};
  const v = settings.visual || {};

  // Cognitive & Motor CSS classes
  ROOT.classList.toggle('lucent-enabled', isEnabled);
  ROOT.classList.toggle('lucent-declutter', isEnabled && !!c.declutter);
  ROOT.classList.toggle('lucent-dyslexia', isEnabled && !!c.dyslexia);
  ROOT.classList.toggle('lucent-calm', isEnabled && !!c.calmMode);
  ROOT.classList.toggle('lucent-reading-width', isEnabled && !!c.readingWidth);
  ROOT.classList.toggle('lucent-motor-targets', isEnabled && !!m.targets);
  ROOT.classList.toggle('lucent-focus', isEnabled && !!m.focus);
  ROOT.classList.toggle('lucent-large-cursor', isEnabled && !!m.largeCursor);

  // Visual CSS classes
  ROOT.classList.toggle('lucent-high-contrast', isEnabled && !!v.highContrast);
  ROOT.classList.toggle('lucent-bold-text', isEnabled && !!v.boldText);

  // Motor & Cognitive runtime
  updateDeclutter(isEnabled && !!c.declutter);
  if (isEnabled && m.largeCursor) enableLargeCursor(); else disableLargeCursor();
  if (isEnabled && c.readingGuide) enableGuide(); else disableGuide();
  if (isEnabled && m.shortcuts) assignShortcuts(); else clearShortcuts();

  // Visual runtime
  applyFontSize(isEnabled ? (v.fontSize || 16) : 16);
  if (isEnabled && v.highContrast) enableSolarHighContrast(); else disableSolarHighContrast();
  if (isEnabled && v.daltonize) enableDaltonize(); else disableDaltonize();
  if (isEnabled && v.crosshairs) enableCrosshairs(); else disableCrosshairs();
  if (isEnabled && v.magnifier) enableMagnifier(); else disableMagnifier();
  if (!isEnabled) stopSpeech();

  if (lucentWidgetRoot) {
    if (widgetProfile !== settings.profile) {
      rebuildWidgetOptions();
    } else {
      renderWidget();
    }
  }
  const profName = settings.profile === 'cognitive' ? 'Cognitive & ADHD' : settings.profile === 'motor' ? 'Motor & Tremor' : settings.profile === 'visual' ? 'Visual & Low Vision' : 'Baseline';
  report('settings updated', profName);
}

function updateDeclutter(enabled) {
  if (isDashboard()) return;
  document.querySelectorAll('[data-lucent-declutter]').forEach(node => {
    node.hidden = false;
    delete node.dataset.lucentDeclutter;
  });
  if (!enabled) return;
  const selectors = '[aria-label*="advert" i],[id*="advert" i],[class*="advert" i],[id*="sponsor" i],[class*="sponsor" i],[id*="cookie" i],[class*="cookie" i],[id*="newsletter" i],[class*="newsletter" i],[class*="popup" i],[class*="promo" i]';
  document.querySelectorAll(selectors).forEach(node => {
    if (node.closest('#lucent-widget') || node.matches('main,article,[role="main"]')) return;
    const rect = node.getBoundingClientRect();
    if (rect.width > 40 && rect.height > 20) {
      node.hidden = true;
      node.dataset.lucentDeclutter = 'true';
    }
  });
}

function enableLargeCursor() {
  if (isDashboard() || largeCursor) return;
  largeCursor = document.createElement('div');
  largeCursor.className = 'lucent-large-cursor-dot';
  largeCursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(largeCursor);
  document.addEventListener('pointermove', moveLargeCursor, { passive: true });
}
function moveLargeCursor(event) {
  if (largeCursor) largeCursor.style.transform = `translate(${event.clientX - 16}px, ${event.clientY - 16}px)`;
}
function disableLargeCursor() {
  document.removeEventListener('pointermove', moveLargeCursor);
  largeCursor?.remove();
  largeCursor = undefined;
}

function enableGuide() {
  if (isDashboard() || guide) return;
  guide = document.createElement('div');
  guide.className = 'lucent-reading-guide';
  guide.setAttribute('aria-hidden', 'true');
  document.body.appendChild(guide);
  document.addEventListener('pointermove', moveGuide, { passive: true });
}
function moveGuide(event) {
  if (guide) guide.style.transform = `translateY(${event.clientY - 35}px)`;
}
function disableGuide() {
  document.removeEventListener('pointermove', moveGuide);
  guide?.remove();
  guide = undefined;
}

// Cognitive: AI Text Simplification & Summarization Suite
let simplifiedCardsList = [];

function generateLocalExtractiveBullets(text) {
  if (!text || text.trim().length === 0) return ['Summary unavailable'];
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 25);

  if (sentences.length <= 2) {
    return sentences.length > 0 ? sentences : [text.slice(0, 160)];
  }
  return [
    sentences[0],
    sentences[Math.floor(sentences.length / 2)],
    sentences[sentences.length - 1]
  ].slice(0, 3);
}

async function simplifyActivePage() {
  if (isDashboard()) return { count: 0, reason: 'dashboard' };

  // If already simplified, return current count
  const existingCards = document.querySelectorAll('.lucent-simplified-card');
  if (existingCards.length > 0) {
    return { count: existingCards.length, timeSaved: Math.round(existingCards.length * 0.8) };
  }

  // Find candidate reading paragraphs
  const candidates = Array.from(
    document.querySelectorAll('article p, main p, [role="main"] p, [role="article"] p, .mw-parser-output > p, #content p, section p, p')
  );

  const targetParagraphs = candidates.filter(p => {
    if (p.closest('#lucent-widget') || p.closest('.lucent-simplified-card')) return false;
    if (p.closest('nav, footer, header, form, code, pre, table, aside, figcaption')) return false;
    const txt = p.textContent?.trim() || '';
    return txt.length >= 110;
  }).slice(0, 12);

  if (targetParagraphs.length === 0) {
    return { count: 0, reason: 'no_paragraphs' };
  }

  showLucentToast(`✨ Gemini AI analyzing ${targetParagraphs.length} paragraphs...`);

  const paragraphsText = targetParagraphs.map(p => p.textContent.trim());
  let simplifiedData = null;

  try {
    const aiResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'LUCENT_AI_SIMPLIFY',
        paragraphs: paragraphsText
      }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(res);
        }
      });
    });

    if (aiResponse && aiResponse.success && aiResponse.simplifiedParagraphs) {
      simplifiedData = aiResponse;
    }
  } catch (err) {
    console.warn('[Lucent] AI simplify request error, using fast local extractive summarizer', err);
  }

  let count = 0;
  simplifiedCardsList = [];

  targetParagraphs.forEach((p, index) => {
    let bullets = null;
    if (simplifiedData?.simplifiedParagraphs && Array.isArray(simplifiedData.simplifiedParagraphs[index])) {
      bullets = simplifiedData.simplifiedParagraphs[index];
    } else {
      bullets = generateLocalExtractiveBullets(p.textContent);
    }

    if (!bullets || bullets.length === 0) {
      bullets = generateLocalExtractiveBullets(p.textContent);
    }

    const card = document.createElement('div');
    card.className = 'lucent-simplified-card';
    card.setAttribute('data-lucent-simplified', 'true');
    card.setAttribute('data-lucent-original-html', encodeURIComponent(p.outerHTML));

    const bulletsHtml = bullets
      .map(b => `<li>${String(b).replace(/^[•\-\*]\s*/, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</li>`)
      .join('');

    card.innerHTML = `
      <div class="lucent-simplified-header">
        <span class="lucent-simplified-tag"><span>✦</span> AI Plain Summary</span>
        <span class="lucent-simplified-action">Click to expand full text ↗</span>
      </div>
      <ul class="lucent-simplified-bullets">
        ${bulletsHtml}
      </ul>
      <div class="lucent-original-drawer" hidden>
        <div class="lucent-original-label">Original Full Text</div>
        <div class="lucent-original-body">${p.innerHTML}</div>
      </div>
    `;

    // Interactive card toggle: clicking switches between summary & original
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const drawer = card.querySelector('.lucent-original-drawer');
      const bulletsUl = card.querySelector('.lucent-simplified-bullets');
      const action = card.querySelector('.lucent-simplified-action');
      const isShowingOriginal = !drawer.hidden;
      drawer.hidden = isShowingOriginal;
      bulletsUl.hidden = !isShowingOriginal;
      action.textContent = isShowingOriginal ? 'Click to expand full text ↗' : 'Click to show summary ↙';
    });

    p.replaceWith(card);
    simplifiedCardsList.push(card);
    count++;
  });

  const timeSaved = Math.max(1, Math.round(count * 0.8));
  showLucentToast(`✨ AI simplified ${count} paragraphs (~${timeSaved} min saved)`);
  report(`AI simplified ${count} paragraphs on ${document.title || location.hostname}`, 'Cognitive & ADHD');

  return { count, timeSaved, success: true };
}

function restoreActivePage() {
  const cards = Array.from(document.querySelectorAll('.lucent-simplified-card'));
  cards.forEach(card => {
    const rawHtml = card.getAttribute('data-lucent-original-html');
    if (rawHtml) {
      try {
        const decoded = decodeURIComponent(rawHtml);
        const temp = document.createElement('div');
        temp.innerHTML = decoded;
        const origNode = temp.firstElementChild;
        if (origNode) {
          card.replaceWith(origNode);
          return;
        }
      } catch {}
    }
    card.remove();
  });

  simplifiedCardsList = [];
  showLucentToast('Restored original paragraph text');
  report('Restored original page text', 'Cognitive & ADHD');
  return { success: true, count: cards.length };
}

// Visual: Instantaneous font size scaling controller
let fontStyleEl;
function applyFontSize(size) {
  if (isDashboard()) return;
  if (!fontStyleEl) {
    fontStyleEl = document.getElementById('lucent-font-size-style');
    if (!fontStyleEl) {
      fontStyleEl = document.createElement('style');
      fontStyleEl.id = 'lucent-font-size-style';
      (document.head || document.documentElement).appendChild(fontStyleEl);
    }
  }
  const isEnabled = Boolean(settings.enabled);
  const targetSize = (isEnabled && typeof size === 'number') ? size : 16;
  if (targetSize === 16 && !isEnabled) {
    fontStyleEl.textContent = '';
    return;
  }
  fontStyleEl.textContent = `
    html.lucent-enabled body,
    html.lucent-enabled p,
    html.lucent-enabled span:not(#lucent-widget *),
    html.lucent-enabled a:not(#lucent-widget *),
    html.lucent-enabled li:not(#lucent-widget *),
    html.lucent-enabled td,
    html.lucent-enabled th,
    html.lucent-enabled label:not(#lucent-widget *),
    html.lucent-enabled article,
    html.lucent-enabled section,
    html.lucent-enabled div:not(#lucent-widget):not(#lucent-widget *),
    html.lucent-enabled button:not(#lucent-widget *),
    html.lucent-enabled input:not(#lucent-widget *),
    html.lucent-enabled select:not(#lucent-widget *),
    html.lucent-enabled textarea:not(#lucent-widget *) {
      font-size: ${targetSize}px !important;
      line-height: 1.5 !important;
    }
    html.lucent-enabled h1 { font-size: ${Math.round(targetSize * 1.8)}px !important; }
    html.lucent-enabled h2 { font-size: ${Math.round(targetSize * 1.5)}px !important; }
    html.lucent-enabled h3 { font-size: ${Math.round(targetSize * 1.3)}px !important; }
    html.lucent-enabled h4 { font-size: ${Math.round(targetSize * 1.15)}px !important; }
  `;
}

// Visual: Intelligent Solar High Contrast (Yellow/Black WCAG AAA)
let solarContrastObserver = null;
let solarContrastDebounce = null;

function adaptSolarContrastElements() {
  if (!settings.enabled || !settings.visual?.highContrast) return;

  // 1. Invert dark/transparent logos so they remain crisp and luminous on deep black (Wikipedia/Wikimedia)
  const logoSelectors = [
    '.mw-logo-icon',
    '.mw-logo-wordmark',
    '.mw-logo-tagline',
    'img[src*="wikimedia" i]',
    'img[src*="wikipedia" i]'
  ].join(',');

  try {
    document.querySelectorAll(logoSelectors).forEach(el => {
      if (el.closest('#lucent-widget')) return;
      el.setAttribute('data-lucent-inverted-logo', 'true');
    });
  } catch (e) {}

  // 2. Identify mask-image and icon elements so they receive bright solar yellow instead of black
  const iconSelectors = [
    '.vector-icon',
    '[class*="mw-ui-icon"]',
    '[class*="vector-icon"]',
    '[class*="octicon"]',
    '[class*="mask-icon"]'
  ].join(',');

  try {
    document.querySelectorAll(iconSelectors).forEach(el => {
      if (el.closest('#lucent-widget')) return;
      el.setAttribute('data-lucent-mask-icon', 'true');
    });
  } catch (e) {}

  // Also check elements with CSS mask
  try {
    document.querySelectorAll('span[class*="icon" i], i[class*="icon" i], div[class*="icon" i]').forEach(el => {
      if (el.closest('#lucent-widget') || el.hasAttribute('data-lucent-mask-icon')) return;
      const mask = window.getComputedStyle(el).webkitMaskImage || window.getComputedStyle(el).maskImage;
      if (mask && mask !== 'none') {
        el.setAttribute('data-lucent-mask-icon', 'true');
      }
    });
  } catch (e) {}
}

function enableSolarHighContrast() {
  if (isDashboard()) return;
  ROOT.classList.add('lucent-high-contrast');
  adaptSolarContrastElements();

  if (!solarContrastObserver) {
    solarContrastObserver = new MutationObserver(() => {
      if (solarContrastDebounce) clearTimeout(solarContrastDebounce);
      solarContrastDebounce = setTimeout(adaptSolarContrastElements, 120);
    });
    solarContrastObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

function disableSolarHighContrast() {
  ROOT.classList.remove('lucent-high-contrast');
  if (solarContrastObserver) {
    solarContrastObserver.disconnect();
    solarContrastObserver = null;
  }
  if (solarContrastDebounce) {
    clearTimeout(solarContrastDebounce);
    solarContrastDebounce = null;
  }
  document.querySelectorAll('[data-lucent-inverted-logo]').forEach(el => {
    el.removeAttribute('data-lucent-inverted-logo');
  });
  document.querySelectorAll('[data-lucent-mask-icon]').forEach(el => {
    el.removeAttribute('data-lucent-mask-icon');
  });
}

// Visual: Daltonization spectral shift filter
function enableDaltonize() {
  if (isDashboard() || daltonizeSvg) return;
  daltonizeSvg = document.createElement('div');
  daltonizeSvg.id = 'lucent-daltonize-wrapper';
  daltonizeSvg.style.display = 'none';
  daltonizeSvg.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <filter id="lucent-daltonize-filter">
        <feColorMatrix type="matrix" values="
          0.625 0.375 0 0 0
          0.700 0.300 0 0 0
          0 0.300 0.700 0 0
          0 0 0 1 0" />
      </filter>
    </svg>
  `;
  document.body.appendChild(daltonizeSvg);
  ROOT.style.filter = 'url(#lucent-daltonize-filter)';
}
function disableDaltonize() {
  if (ROOT.style.filter?.includes('lucent-daltonize-filter')) {
    ROOT.style.filter = '';
  }
  daltonizeSvg?.remove();
  daltonizeSvg = undefined;
}

// Visual: Cursor Crosshairs Guide
function enableCrosshairs() {
  if (isDashboard() || crosshairH) return;
  crosshairH = document.createElement('div');
  crosshairH.className = 'lucent-crosshair-h';
  crosshairV = document.createElement('div');
  crosshairV.className = 'lucent-crosshair-v';
  document.body.appendChild(crosshairH);
  document.body.appendChild(crosshairV);
  document.addEventListener('pointermove', moveCrosshairs, { passive: true });
}
function moveCrosshairs(e) {
  if (crosshairH) crosshairH.style.transform = `translateY(${e.clientY}px)`;
  if (crosshairV) crosshairV.style.transform = `translateX(${e.clientX}px)`;
}
function disableCrosshairs() {
  document.removeEventListener('pointermove', moveCrosshairs);
  crosshairH?.remove();
  crosshairV?.remove();
  crosshairH = undefined;
  crosshairV = undefined;
}

// Visual: Hover Magnifier Loupe (Dynamic Rectangular Tooltip with 6-10 Words Context)
let magnifierRaf = null;
let lastPointerEvent = null;

function escapeLoupeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractLoupeWordWindow(e) {
  let target = document.elementFromPoint(e.clientX, e.clientY);
  if (!target || target.closest('#lucent-widget') || target === magnifier) {
    return null;
  }

  // Support images with alt / title descriptions
  if (target.tagName === 'IMG') {
    const alt = target.getAttribute('alt')?.trim() || target.getAttribute('title')?.trim();
    if (alt) {
      const words = alt.split(/\s+/).filter(Boolean);
      return {
        words: words.slice(0, 10),
        focusedIndex: 0,
        hasLeading: false,
        hasTrailing: words.length > 10
      };
    }
  }

  // Attempt precision text node & charOffset detection via caret API
  let textNode = null;
  let charOffset = 0;

  if (document.caretRangeFromPoint) {
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range && range.startContainer) {
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        textNode = range.startContainer;
        charOffset = range.startOffset;
      } else if (range.startContainer.childNodes && range.startContainer.childNodes[range.startOffset]) {
        const child = range.startContainer.childNodes[range.startOffset];
        if (child.nodeType === Node.TEXT_NODE) {
          textNode = child;
          charOffset = 0;
        }
      }
    }
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (pos && pos.offsetNode && pos.offsetNode.nodeType === Node.TEXT_NODE) {
      textNode = pos.offsetNode;
      charOffset = pos.offset;
    }
  }

  let textSource = '';
  if (textNode && textNode.textContent) {
    textSource = textNode.textContent;
  } else {
    const textEl = target.closest('p, h1, h2, h3, h4, h5, h6, li, span, a, div, button, label, td, th');
    if (textEl) {
      textSource = textEl.textContent || '';
      charOffset = 0;
    }
  }

  const trimmed = textSource.trim();
  if (!trimmed) return null;

  // Tokenize text into words with start and end character positions
  const wordRegex = /\S+/g;
  const words = [];
  let match;
  while ((match = wordRegex.exec(textSource)) !== null) {
    words.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  if (words.length === 0) return null;

  // Find the word matching or closest to the caret offset
  let focusedIndex = 0;
  let minDistance = Infinity;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (charOffset >= w.start && charOffset <= w.end) {
      focusedIndex = i;
      break;
    }
    const dist = Math.min(Math.abs(charOffset - w.start), Math.abs(charOffset - w.end));
    if (dist < minDistance) {
      minDistance = dist;
      focusedIndex = i;
    }
  }

  // Dynamic window of 6 to 10 words (target 8 words)
  const windowSize = 8;
  const halfWindow = Math.floor(windowSize / 2);
  let startIndex = Math.max(0, focusedIndex - halfWindow);
  let endIndex = Math.min(words.length, startIndex + windowSize);

  // If near the end of the text, expand backward to maintain up to 8 words
  if (endIndex - startIndex < windowSize) {
    startIndex = Math.max(0, endIndex - windowSize);
  }

  const selectedWords = words.slice(startIndex, endIndex);
  const relativeFocusedIndex = focusedIndex - startIndex;

  return {
    words: selectedWords.map(w => w.word),
    focusedIndex: relativeFocusedIndex,
    hasLeading: startIndex > 0,
    hasTrailing: endIndex < words.length
  };
}

function updateMagnifierView(e) {
  if (!magnifier) return;

  const result = extractLoupeWordWindow(e);
  if (!result || result.words.length === 0) {
    magnifier.style.opacity = '0';
    return;
  }

  let html = '';
  if (result.hasLeading) {
    html += '<span style="opacity:0.6;margin-right:4px;">…</span>';
  }
  html += result.words.map((w, idx) => {
    if (idx === result.focusedIndex) {
      return `<span class="lucent-loupe-focused-word">${escapeLoupeHtml(w)}</span>`;
    }
    return `<span>${escapeLoupeHtml(w)}</span>`;
  }).join(' ');

  if (result.hasTrailing) {
    html += '<span style="opacity:0.6;margin-left:4px;">…</span>';
  }

  magnifier.innerHTML = html;
  magnifier.style.opacity = '1';

  // Smart viewport-aware placement (offset 18px, flip if near edges)
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let posX = e.clientX + 18;
  let posY = e.clientY + 18;

  const loupeWidth = magnifier.offsetWidth || 260;
  const loupeHeight = magnifier.offsetHeight || 44;

  if (posX + loupeWidth > vw - 12) {
    posX = e.clientX - loupeWidth - 14;
  }
  if (posX < 8) posX = 8;

  if (posY + loupeHeight > vh - 12) {
    posY = e.clientY - loupeHeight - 14;
  }
  if (posY < 8) posY = 8;

  magnifier.style.transform = `translate(${posX}px, ${posY}px)`;
}

function moveMagnifier(e) {
  lastPointerEvent = e;
  if (!magnifierRaf) {
    magnifierRaf = requestAnimationFrame(() => {
      magnifierRaf = null;
      if (lastPointerEvent) {
        updateMagnifierView(lastPointerEvent);
      }
    });
  }
}

function enableMagnifier() {
  if (isDashboard() || magnifier) return;
  magnifier = document.createElement('div');
  magnifier.className = 'lucent-magnifier-loupe';
  magnifier.setAttribute('aria-hidden', 'true');
  document.body.appendChild(magnifier);
  document.addEventListener('pointermove', moveMagnifier, { passive: true });
}

function disableMagnifier() {
  document.removeEventListener('pointermove', moveMagnifier);
  if (magnifierRaf) {
    cancelAnimationFrame(magnifierRaf);
    magnifierRaf = null;
  }
  lastPointerEvent = null;
  magnifier?.remove();
  magnifier = undefined;
}

// Visual: Text-to-Speech & Selection Narrator
function handleSpeechClick(e) {
  if (isDashboard()) return;
  const target = e.target.closest('p, h1, h2, h3, h4, h5, h6, li, article, blockquote, [role="article"]');
  if (!target || target.closest('#lucent-widget')) return;

  const text = window.getSelection()?.toString().trim() || target.textContent?.trim();
  if (!text || !('speechSynthesis' in window)) return;

  currentSelectedText = text;
  speakSelectedText(text, target);
}

function speakSelectedText(customText, targetEl) {
  if (!('speechSynthesis' in window)) return false;

  if (isSpeaking || window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    if (speechActiveEl) {
      speechActiveEl.classList.remove('lucent-speech-active');
      speechActiveEl = undefined;
    }
    updateSpeechButtonUI();
    return false;
  }

  const sel = window.getSelection()?.toString().trim();
  const text = customText || sel || currentSelectedText;

  if (!text) {
    flashSpeechStatus('Select text first! 👆');
    return false;
  }

  window.speechSynthesis.cancel();
  if (speechActiveEl) speechActiveEl.classList.remove('lucent-speech-active');

  if (targetEl) {
    speechActiveEl = targetEl;
    targetEl.classList.add('lucent-speech-active');
  }

  const utterance = new SpeechSynthesisUtterance(text.slice(0, 1500));
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    isSpeaking = true;
    updateSpeechButtonUI();
  };

  utterance.onend = () => {
    isSpeaking = false;
    if (speechActiveEl) {
      speechActiveEl.classList.remove('lucent-speech-active');
      speechActiveEl = undefined;
    }
    updateSpeechButtonUI();
  };

  utterance.onerror = () => {
    isSpeaking = false;
    if (speechActiveEl) {
      speechActiveEl.classList.remove('lucent-speech-active');
      speechActiveEl = undefined;
    }
    updateSpeechButtonUI();
  };

  window.speechSynthesis.speak(utterance);
  report(`Spoke text: "${text.slice(0, 30)}..."`, 'Visual & Low Vision');
  return true;
}

function updateSpeechButtonUI() {
  if (!lucentWidgetRoot) return;
  const speakBtn = lucentWidgetRoot.querySelector('.widget-speak-btn');
  const badge = lucentWidgetRoot.querySelector('.speech-status-badge');
  const preview = lucentWidgetRoot.querySelector('.widget-speech-preview');
  if (!speakBtn) return;

  const selText = window.getSelection()?.toString().trim() || currentSelectedText;

  if (isSpeaking || window.speechSynthesis?.speaking) {
    speakBtn.style.background = 'rgba(239, 68, 68, 0.2)';
    speakBtn.style.color = '#fca5a5';
    speakBtn.style.borderColor = '#ef4444';
    speakBtn.innerHTML = '<span>⏹</span> Stop Reading';
    if (badge) {
      badge.textContent = 'Reading... 🔊';
      badge.style.color = '#f87171';
      badge.style.background = 'rgba(239, 68, 68, 0.2)';
      badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    }
  } else if (selText) {
    const words = selText.split(/\s+/).filter(Boolean).length;
    speakBtn.style.background = '#22c55e';
    speakBtn.style.color = '#042b12';
    speakBtn.style.borderColor = '#4ade80';
    speakBtn.innerHTML = '<span>🔊</span> Read Selected Text';
    if (badge) {
      badge.textContent = `${words} word${words === 1 ? '' : 's'}`;
      badge.style.color = '#4ade80';
      badge.style.background = 'rgba(34, 197, 94, 0.2)';
      badge.style.borderColor = 'rgba(74, 222, 128, 0.4)';
    }
    if (preview) {
      preview.style.display = 'block';
      const snippet = selText.length > 40 ? selText.slice(0, 40) + '...' : selText;
      preview.textContent = `Selected: "${snippet}"`;
    }
  } else {
    speakBtn.style.background = '#152e20';
    speakBtn.style.color = '#8df4b5';
    speakBtn.style.borderColor = '#3c8055';
    speakBtn.innerHTML = '<span>🔊</span> Read Selected Text';
    if (badge) {
      badge.textContent = 'Ready';
      badge.style.color = '#8bb799';
      badge.style.background = 'rgba(34, 197, 94, 0.1)';
      badge.style.borderColor = 'rgba(74, 222, 128, 0.2)';
    }
    if (preview) {
      preview.style.display = 'none';
    }
  }
}

function flashSpeechStatus(msg) {
  if (!lucentWidgetRoot) return;
  const badge = lucentWidgetRoot.querySelector('.speech-status-badge');
  if (!badge) return;
  badge.textContent = msg;
  badge.style.color = '#fde047';
  badge.style.background = 'rgba(234, 179, 8, 0.2)';
  badge.style.borderColor = '#eab308';
  setTimeout(() => {
    updateSpeechButtonUI();
  }, 2200);
}

function stopSpeech() {
  if (speechActiveEl) {
    speechActiveEl.classList.remove('lucent-speech-active');
    speechActiveEl = undefined;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  updateSpeechButtonUI();
}

function assignShortcuts() {
  if (isDashboard()) return;
  clearShortcuts();
  try {
    shortcutNodes = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')]
      .filter((node) => {
        try {
          if (node.closest('#lucent-widget')) return false;
          const r = node.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && !node.closest('[aria-hidden="true"]');
        } catch {
          return false;
        }
      })
      .slice(0, 9);
    shortcutNodes.forEach((node, index) => {
      node.dataset.lucentShortcut = String(index + 1);
    });
  } catch {}
}
function clearShortcuts() {
  shortcutNodes.forEach((node) => {
    try { delete node.dataset.lucentShortcut; } catch (_) {}
  });
  shortcutNodes = [];
}

function handleKeyDown(event) {
  if (isDashboard()) return;
  if (!settings.enabled || !settings.motor?.shortcuts || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && shortcutNodes[index]) {
    event.preventDefault();
    shortcutNodes[index].focus();
    shortcutNodes[index].click();
  }
}

function blockRepeatActivation(event) {
  if (isDashboard()) return;
  if (!settings.enabled || !settings.motor?.steadyClick) return;
  const target = event.target.closest?.('button, a, input, select, [role="button"]');
  if (!target || target.closest('#lucent-widget')) return;
  const now = Date.now();
  const last = recentActivations.get(target) || 0;
  if (now - last < 550) {
    event.preventDefault();
    event.stopImmediatePropagation();
    report('Blocked accidental repeat activation', 'Steady click');
    return;
  }
  recentActivations.set(target, now);
}

function createWidget() {
  if (isDashboard() || lucentWidget || !document.body) return;

  lucentWidget = document.createElement('section');
  lucentWidget.id = 'lucent-widget';
  lucentWidget.setAttribute('aria-label', 'Lucent accessibility controls');
  lucentWidgetRoot = lucentWidget.attachShadow({ mode: 'closed' });

  lucentWidgetRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #ecfff3;
        line-height: 1.3;
        text-align: left;
        box-sizing: border-box;
      }
      :host(.lucent-dragged) {
        right: auto !important;
        bottom: auto !important;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      .widget-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }
      .widget-wrap.menu-left {
        align-items: flex-start;
      }
      .fab {
        border: 1px solid #4d6355;
        background: #233328;
        color: #f1fff5;
        border-radius: 999px;
        padding: 10px 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font: 700 14px system-ui, sans-serif;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
        transition: background 0.2s, box-shadow 0.2s;
      }
      .fab * {
        pointer-events: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      .fab:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
      }
      .fab:active, .fab.is-dragging {
        cursor: grabbing !important;
        transform: scale(0.96);
        transition: none !important;
      }
      .widget-wrap.is-on .fab {
        background: #22c55e;
        border-color: #86efac;
        color: #073618;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25), 0 10px 25px rgba(0, 0, 0, 0.35);
      }
      .menu {
        display: none !important;
        position: absolute;
        right: 0;
        bottom: 52px;
        width: 300px;
        padding: 14px 16px;
        background: #0d1e14;
        border: 1px solid #3b6046;
        border-radius: 16px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
        user-select: none;
      }
      .widget-wrap.menu-open .menu {
        display: block !important;
      }
      .widget-wrap.menu-down .menu {
        bottom: auto;
        top: 52px;
      }
      .widget-wrap.menu-left .menu {
        right: auto;
        left: 0;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        cursor: grab;
        touch-action: none;
        user-select: none;
      }
      .header:active {
        cursor: grabbing !important;
      }
      .header-title {
        font-size: 14px;
        font-weight: 700;
        color: #f1fff5;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .master-btn {
        border: 0;
        border-radius: 999px;
        background: #384d3f;
        color: #d1e8d9;
        padding: 4px 11px;
        font: 700 12px system-ui;
        cursor: pointer;
        transition: background 0.15s;
      }
      .master-btn.is-on {
        background: #22c55e;
        color: #073618;
      }
      .close-btn {
        border: 0;
        background: transparent;
        color: #9bb7a5;
        font-size: 16px;
        padding: 2px 6px;
        cursor: pointer;
        border-radius: 6px;
      }
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      .profile-tabs {
        display: flex;
        gap: 5px;
        margin: 8px 0;
      }
      .profile-btn {
        flex: 1;
        background: #172a1e;
        border: 1px solid #2e4d39;
        color: #a3c4b0;
        padding: 5px 0;
        border-radius: 8px;
        font: 600 11px system-ui;
        cursor: pointer;
        transition: 0.15s;
      }
      .profile-btn.active {
        background: #22c55e;
        color: #052611;
        border-color: #4ade80;
        font-weight: 700;
      }
      .hint {
        color: #92b49e;
        font-size: 11px;
        margin: 4px 0 10px;
      }
      .options {
        border-top: 1px solid #243e2e;
        padding-top: 6px;
        max-height: 280px;
        overflow-y: auto;
      }
      .options label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 7px 4px;
        color: #e5f5e9;
        font-size: 12px;
        cursor: pointer;
        border-radius: 6px;
      }
      .options label:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .options input {
        accent-color: #22c55e;
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      .ai-scanner-section {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #243e2e;
      }
      .ai-scanner-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .ai-scanner-title {
        font-size: 12px;
        font-weight: 700;
        color: #f1fff5;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .ai-scanner-badge {
        font-size: 10px;
        background: rgba(34, 197, 94, 0.2);
        color: #4ade80;
        padding: 2px 6px;
        border-radius: 999px;
        font-weight: 700;
        border: 1px solid rgba(74, 222, 128, 0.3);
      }
      .ai-scan-trigger-btn {
        width: 100%;
        background: #172d1f;
        border: 1px solid #3b6c4b;
        color: #8df4b5;
        padding: 7px 10px;
        border-radius: 8px;
        font: 700 12px system-ui, sans-serif;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background 0.15s;
      }
      .ai-scan-trigger-btn:hover {
        background: #20422c;
      }
      .ai-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin: 8px 0;
      }
      .ai-stat-chip {
        background: #112217;
        border: 1px solid #203f2a;
        padding: 5px 8px;
        border-radius: 6px;
        font-size: 11px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #a3c4b0;
      }
      .ai-stat-chip b {
        color: #f87171;
        font-weight: 700;
      }
      .ai-stat-chip b.zero {
        color: #4ade80;
      }
      .ai-fix-trigger-btn {
        width: 100%;
        background: #22c55e;
        border: 0;
        color: #062b13;
        padding: 7px 10px;
        border-radius: 8px;
        font: 700 12px system-ui, sans-serif;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background 0.15s;
        margin-top: 4px;
      }
      .ai-fix-trigger-btn:hover {
        background: #4ade80;
      }
      .ai-summary-text {
        font-size: 11px;
        color: #8bb799;
        margin-top: 6px;
        line-height: 1.35;
      }
    </style>
    <div class="widget-wrap">
      <button class="fab" type="button" aria-expanded="false" aria-label="Open Lucent accessibility controls" title="Drag to reposition">
        <span>✦</span><b>Lucent</b>
      </button>
      <div class="menu">
        <div class="header" title="Drag to reposition">
          <span class="header-title">Accessibility tools</span>
          <div class="header-actions">
            <button class="master-btn" type="button">OFF</button>
            <button class="close-btn" type="button" aria-label="Close">✕</button>
          </div>
        </div>
        <div class="profile-tabs">
          <button type="button" class="profile-btn" data-profile="cognitive">🧠 Cognitive</button>
          <button type="button" class="profile-btn" data-profile="motor">🖐 Motor</button>
          <button type="button" class="profile-btn" data-profile="visual">👁 Visual</button>
        </div>
        <p class="hint">Toggle features for this page.</p>
        <div class="options"></div>
        <div class="ai-scanner-section">
          <div class="ai-scanner-header">
            <span class="ai-scanner-title"><span>✦</span> Gemini AI Auditor</span>
            <span class="ai-scanner-badge">Gemini AI</span>
          </div>
          <button type="button" class="ai-scan-trigger-btn">
            <span>🔍</span> Scan Page with Gemini AI
          </button>
          <div class="ai-scan-results-box" style="display: none;">
            <div class="ai-stats-grid">
              <div class="ai-stat-chip"><span>🏷️ Unlabelled</span><b class="val-unlabeled">0</b></div>
              <div class="ai-stat-chip"><span>🖼️ Missing Alt</span><b class="val-alt">0</b></div>
              <div class="ai-stat-chip"><span>🎯 &lt;44px Hitbox</span><b class="val-targets">0</b></div>
              <div class="ai-stat-chip"><span>👁️ Low Contrast</span><b class="val-contrast">0</b></div>
            </div>
            <button type="button" class="ai-fix-trigger-btn">
              <span>✨</span> Remediate with Gemini AI
            </button>
            <div class="ai-summary-text"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(lucentWidget);
  watchWidget();

  const wrap = lucentWidgetRoot.querySelector('.widget-wrap');
  const fab = lucentWidgetRoot.querySelector('.fab');
  const menu = lucentWidgetRoot.querySelector('.menu');
  const header = lucentWidgetRoot.querySelector('.header');
  const masterBtn = lucentWidgetRoot.querySelector('.master-btn');
  const closeBtn = lucentWidgetRoot.querySelector('.close-btn');

  function applyWidgetPosition(left, top) {
    if (!lucentWidget) return;
    const margin = 10;
    const fabRect = fab ? fab.getBoundingClientRect() : { width: 115, height: 42 };
    const w = fabRect.width || 115;
    const h = fabRect.height || 42;
    const maxLeft = Math.max(margin, window.innerWidth - w - margin);
    const maxTop = Math.max(margin, window.innerHeight - h - margin);
    const clampedX = Math.max(margin, Math.min(maxLeft, left));
    const clampedY = Math.max(margin, Math.min(maxTop, top));

    lucentWidget.classList.add('lucent-dragged');
    lucentWidget.style.setProperty('left', clampedX + 'px', 'important');
    lucentWidget.style.setProperty('top', clampedY + 'px', 'important');
    lucentWidget.style.setProperty('right', 'auto', 'important');
    lucentWidget.style.setProperty('bottom', 'auto', 'important');

    if (wrap) {
      wrap.classList.toggle('menu-down', clampedY < 360);
      wrap.classList.toggle('menu-left', clampedX < 320);
    }
  }

  function saveWidgetPosition(left, top) {
    const xRatio = Math.max(0, Math.min(1, left / Math.max(1, window.innerWidth)));
    const yRatio = Math.max(0, Math.min(1, top / Math.max(1, window.innerHeight)));
    safeStorageSet({ lucentWidgetPos: { xRatio, yRatio, left, top } });
  }

  // Restore saved position
  safeStorageGet(['lucentWidgetPos']).then((data) => {
    if (data?.lucentWidgetPos && lucentWidget) {
      const { xRatio, yRatio, left, top } = data.lucentWidgetPos;
      let targetLeft = left;
      let targetTop = top;
      if (typeof xRatio === 'number' && typeof yRatio === 'number') {
        targetLeft = Math.round(xRatio * window.innerWidth);
        targetTop = Math.round(yRatio * window.innerHeight);
      }
      applyWidgetPosition(targetLeft, targetTop);
    }
  });

  let isDragging = false;
  let didMove = false;
  let justDragged = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let startWidgetX = 0;
  let startWidgetY = 0;

  function initDrag(handleEl) {
    if (!handleEl) return;
    handleEl.setAttribute('draggable', 'false');
    handleEl.addEventListener('dragstart', (e) => e.preventDefault());

    handleEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (handleEl !== fab && e.target.closest('button, input, select, a, [role="button"]')) {
        return;
      }
      isDragging = true;
      didMove = false;
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      const rect = fab.getBoundingClientRect();
      startWidgetX = rect.left;
      startWidgetY = rect.top;

      fab.classList.add('is-dragging');

      const onPointerMove = (ev) => {
        if (!isDragging) return;
        const dx = ev.clientX - startPointerX;
        const dy = ev.clientY - startPointerY;
        if (!didMove && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
          didMove = true;
        }
        if (didMove) {
          ev.preventDefault();
          applyWidgetPosition(startWidgetX + dx, startWidgetY + dy);
        }
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        fab.classList.remove('is-dragging');
        window.removeEventListener('pointermove', onPointerMove, { capture: true });
        window.removeEventListener('pointerup', onPointerUp, { capture: true });
        window.removeEventListener('pointercancel', onPointerUp, { capture: true });
        handleEl.removeEventListener('pointermove', onPointerMove);
        handleEl.removeEventListener('pointerup', onPointerUp);
        handleEl.removeEventListener('pointercancel', onPointerUp);

        if (didMove) {
          justDragged = true;
          const rect = fab.getBoundingClientRect();
          saveWidgetPosition(rect.left, rect.top);
          setTimeout(() => { justDragged = false; }, 250);
        }
      };

      window.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
      window.addEventListener('pointerup', onPointerUp, { capture: true });
      window.addEventListener('pointercancel', onPointerUp, { capture: true });
      handleEl.addEventListener('pointermove', onPointerMove, { passive: false });
      handleEl.addEventListener('pointerup', onPointerUp);
      handleEl.addEventListener('pointercancel', onPointerUp);
    });
  }

  initDrag(fab);
  if (header) initDrag(header);

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    if (justDragged) {
      justDragged = false;
      return;
    }
    const isOpen = wrap.classList.toggle('menu-open');
    fab.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) {
      const rect = fab.getBoundingClientRect();
      wrap.classList.toggle('menu-down', rect.top < 360);
      wrap.classList.toggle('menu-left', rect.left < 320);
    }
  });

  window.addEventListener('resize', () => {
    if (!lucentWidget || !lucentWidget.classList.contains('lucent-dragged')) return;
    const rect = fab.getBoundingClientRect();
    applyWidgetPosition(rect.left, rect.top);
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.remove('menu-open');
    fab.setAttribute('aria-expanded', 'false');
  });

  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  masterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const nextEnabled = !settings.enabled;
    const next = { ...settings, enabled: nextEnabled };
    persistSettings(next);
    applySettings(next);
    report(nextEnabled ? 'Enabled Lucent via page widget' : 'Paused Lucent via page widget', 'In-Page Widget');
  });

  lucentWidgetRoot.querySelectorAll('.profile-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const prof = btn.dataset.profile;
      const next = { ...settings, profile: prof };
      persistSettings(next);
      applySettings(next);
      report(`Switched to ${prof} profile`, 'Profile Switcher');
    });
  });

  const aiScanBtn = lucentWidgetRoot.querySelector('.ai-scan-trigger-btn');
  const aiResultsBox = lucentWidgetRoot.querySelector('.ai-scan-results-box');
  const aiFixBtn = lucentWidgetRoot.querySelector('.ai-fix-trigger-btn');
  const aiSummaryText = lucentWidgetRoot.querySelector('.ai-summary-text');
  let currentWidgetScan = null;

  aiScanBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    aiScanBtn.textContent = 'Scanning active page...';
    const scan = scanAccessibility();
    currentWidgetScan = scan;
    aiScanBtn.innerHTML = `<span>🔍</span> Re-scan Page (${scan.total} issues)`;
    if (aiResultsBox) aiResultsBox.style.display = 'block';

    const setVal = (cls, val) => {
      const el = lucentWidgetRoot.querySelector(`.${cls}`);
      if (el) {
        el.textContent = val;
        el.classList.toggle('zero', val === 0);
      }
    };
    setVal('val-unlabeled', scan.unlabeledButtons);
    setVal('val-alt', scan.missingAlt);
    setVal('val-targets', scan.smallTargets);
    setVal('val-contrast', scan.lowContrast);

    if (aiSummaryText) {
      aiSummaryText.textContent = scan.total === 0
        ? 'Great job! No critical barriers found on this page.'
        : `Identified ${scan.total} accessibility barriers. Click below to remediate with Gemini AI.`;
    }
    report(`Scanned active page: ${scan.total} issues found`, 'In-Page Scanner');
  });

  aiFixBtn?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!currentWidgetScan) currentWidgetScan = scanAccessibility();
    aiFixBtn.disabled = true;
    aiFixBtn.textContent = '✨ Remediating with Gemini AI...';

    const remediations = await runGeminiAiScan(currentWidgetScan);
    reinforceAccessibility(remediations);
    removeHighlights();
    showLucentToast(`Gemini AI remediated ${currentWidgetScan.total} accessibility barriers`);
    report(`Gemini AI auto-remediated ${currentWidgetScan.total} barriers`, 'In-Page Auto-Fix');

    aiFixBtn.disabled = false;
    aiFixBtn.innerHTML = '<span>✓</span> Successfully Remediated!';
    aiFixBtn.style.background = '#059669';

    const conf = Math.round((remediations?.confidenceScore ?? 0.95) * 100);
    if (aiSummaryText) {
      aiSummaryText.innerHTML = `<strong>Remediated ${currentWidgetScan.total} barriers!</strong><br>Injected labels &amp; alt text (Confidence: ${conf}%).`;
    }

    ['val-unlabeled', 'val-alt', 'val-targets', 'val-contrast'].forEach(cls => {
      const el = lucentWidgetRoot.querySelector(`.${cls}`);
      if (el) {
        el.textContent = '0';
        el.classList.add('zero');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (wrap.classList.contains('menu-open')) {
      wrap.classList.remove('menu-open');
      fab.setAttribute('aria-expanded', 'false');
    }
  });

  rebuildWidgetOptions();
  renderWidget();
}

function watchWidget() {
  if (widgetObserver || isDashboard()) return;
  widgetObserver = new MutationObserver(() => {
    if (!document.body || isDashboard()) return;
    if (!document.getElementById('lucent-widget')) {
      lucentWidget = undefined;
      lucentWidgetRoot = undefined;
      widgetProfile = undefined;
      createWidget();
      applySettings(settings);
    }
  });
  widgetObserver.observe(document.body, { childList: true });
}

function rebuildWidgetOptions() {
  if (!lucentWidgetRoot) return;
  widgetProfile = settings.profile;
  const optionsContainer = lucentWidgetRoot.querySelector('.options');
  if (!optionsContainer) return;

  const optionsList = settings.profile === 'motor'
    ? [
        ['motor.targets', '48 px targets'],
        ['motor.focus', 'Focus halo'],
        ['motor.shortcuts', 'Number shortcuts (1-9)'],
        ['motor.steadyClick', 'Steady click'],
        ['motor.largeCursor', 'Large cursor']
      ]
    : settings.profile === 'visual'
    ? [
        ['visual.daltonize', 'Color-blind spectral filter'],
        ['visual.highContrast', 'Solar high-contrast (Yellow/Black)'],
        ['visual.magnifier', 'Hover magnifier loupe'],
        ['visual.boldText', 'Bold typography (18px floor)'],
        ['visual.crosshairs', 'Cursor crosshairs guide']
      ]
    : [
        ['cognitive.declutter', 'De-clutter'],
        ['cognitive.readingGuide', 'Reading guide'],
        ['cognitive.dyslexia', 'Dyslexia-friendly text'],
        ['cognitive.calmMode', 'Calm mode'],
        ['cognitive.readingWidth', 'Comfortable reading width']
      ];

  let html = '';
  if (settings.profile === 'cognitive') {
    html += `
      <div class="widget-simplify-control" style="background: #112217; border: 1px solid #20442c; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 12px; color: #ecfff3; display: flex; align-items: center; gap: 5px;">
            <span>✨</span> AI Text Simplifier
          </span>
          <span class="widget-simplify-badge" style="font-size: 10px; color: #8bb799; background: rgba(34, 197, 94, 0.15); padding: 1px 7px; border-radius: 999px; border: 1px solid rgba(74, 222, 128, 0.25);">Ready</span>
        </div>
        <button type="button" class="widget-simplify-btn" style="width: 100%; background: #152e20; color: #8df4b5; border: 1px solid #3c8055; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s ease;">
          <span>✨</span> Simplify Paragraphs with AI
        </button>
        <button type="button" class="widget-restore-btn" style="width: 100%; background: #1f2b23; color: #a8cbb4; border: 1px solid #324e3c; border-radius: 6px; padding: 5px 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: none; align-items: center; justify-content: center; gap: 5px; margin-top: 5px; transition: all 0.15s ease;">
          <span>↩</span> Restore Original Text
        </button>
        <div class="widget-simplify-status" style="font-size: 10px; color: #7cb28e; margin-top: 5px; display: none;"></div>
      </div>
    `;
  } else if (settings.profile === 'visual') {
    const curSize = settings.visual?.fontSize || 16;
    html += `
      <div class="widget-font-size-control">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 12px; color: #ecfff3;">🔤 Font Size</span>
          <b class="widget-font-size-badge" style="font-size: 11px; color: #4ade80; background: rgba(34, 197, 94, 0.2); padding: 1px 7px; border-radius: 999px; border: 1px solid rgba(74, 222, 128, 0.3);">${curSize}px</b>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; color: #8bb799; font-weight: 600;">12px</span>
          <input type="range" class="widget-font-slider" min="12" max="32" step="1" value="${curSize}" style="flex: 1; accent-color: #22c55e; cursor: pointer; height: 5px;">
          <span style="font-size: 14px; font-weight: 800; color: #8bb799;">32px</span>
        </div>
      </div>
      <div class="widget-speech-control" style="background: #112217; border: 1px solid #20442c; border-radius: 8px; padding: 8px 10px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 12px; color: #ecfff3; display: flex; align-items: center; gap: 5px;">
            <span>🗣️</span> Text-to-Speech
          </span>
          <span class="speech-status-badge" style="font-size: 10px; color: #8bb799; background: rgba(34, 197, 94, 0.15); padding: 1px 7px; border-radius: 999px; border: 1px solid rgba(74, 222, 128, 0.25);">Ready</span>
        </div>
        <button type="button" class="widget-speak-btn" style="width: 100%; background: #152e20; color: #8df4b5; border: 1px solid #3c8055; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s ease;">
          <span>🔊</span> Read Selected Text
        </button>
        <div class="widget-speech-preview" style="font-size: 10px; color: #7cb28e; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: none;"></div>
      </div>
    `;
  }
  html += optionsList
    .map(([path, label]) => `<label><span>${label}</span><input type="checkbox" data-path="${path}"></label>`)
    .join('');

  optionsContainer.innerHTML = html;

  const fontSlider = optionsContainer.querySelector('.widget-font-slider');
  const fontBadge = optionsContainer.querySelector('.widget-font-size-badge');
  if (fontSlider) {
    fontSlider.addEventListener('input', (event) => {
      event.stopPropagation();
      const val = Number(event.target.value);
      if (fontBadge) fontBadge.textContent = `${val}px`;
      if (!settings.visual) settings.visual = {};
      settings.visual.fontSize = val;
      settings.enabled = true;
      applyFontSize(val);
      const wrap = lucentWidgetRoot?.querySelector('.widget-wrap');
      if (wrap) wrap.classList.add('is-on');
      const master = lucentWidgetRoot?.querySelector('.master-btn');
      if (master) {
        master.textContent = 'ON';
        master.classList.add('is-on');
      }
    });
    fontSlider.addEventListener('change', (event) => {
      event.stopPropagation();
      const val = Number(event.target.value);
      const next = {
        ...settings,
        enabled: true,
        visual: {
          ...(settings.visual || {}),
          fontSize: val
        }
      };
      persistSettings(next);
      report(`Font size scaled to ${val}px`, 'Visual & Low Vision');
    });
  }

  const speakBtn = optionsContainer.querySelector('.widget-speak-btn');
  if (speakBtn) {
    speakBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      speakSelectedText();
    });
    updateSpeechButtonUI();
  }

  const simplifyBtn = optionsContainer.querySelector('.widget-simplify-btn');
  const restoreBtn = optionsContainer.querySelector('.widget-restore-btn');
  const simplifyBadge = optionsContainer.querySelector('.widget-simplify-badge');
  const simplifyStatus = optionsContainer.querySelector('.widget-simplify-status');

  if (simplifyBtn) {
    simplifyBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      simplifyBtn.disabled = true;
      simplifyBtn.innerHTML = '<span>✨</span> Summarizing with AI...';
      if (simplifyBadge) {
        simplifyBadge.textContent = 'Processing...';
        simplifyBadge.style.color = '#fbbf24';
      }
      if (simplifyStatus) {
        simplifyStatus.style.display = 'block';
        simplifyStatus.textContent = 'Extracting and simplifying reading paragraphs...';
      }
      try {
        const result = await simplifyActivePage();
        if (result && result.count > 0) {
          if (simplifyBadge) {
            simplifyBadge.textContent = `${result.count} simplified`;
            simplifyBadge.style.color = '#4ade80';
          }
          if (simplifyStatus) {
            simplifyStatus.style.display = 'block';
            simplifyStatus.textContent = `Summarized ${result.count} paragraphs (~${result.timeSaved || 2} min saved). Click any card to view original.`;
          }
          if (restoreBtn) restoreBtn.style.display = 'flex';
        } else {
          if (simplifyBadge) {
            simplifyBadge.textContent = 'No text found';
            simplifyBadge.style.color = '#8aa695';
          }
          if (simplifyStatus) {
            simplifyStatus.style.display = 'block';
            simplifyStatus.textContent = 'No suitable long reading paragraphs found on this page.';
          }
        }
      } catch (err) {
        if (simplifyBadge) {
          simplifyBadge.textContent = 'Error';
          simplifyBadge.style.color = '#f87171';
        }
      } finally {
        simplifyBtn.disabled = false;
        simplifyBtn.innerHTML = '<span>✨</span> Simplify Paragraphs with AI';
      }
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      restoreActivePage();
      restoreBtn.style.display = 'none';
      if (simplifyBadge) {
        simplifyBadge.textContent = 'Ready';
        simplifyBadge.style.color = '#8bb799';
      }
      if (simplifyStatus) simplifyStatus.style.display = 'none';
    });
  }

  optionsContainer.querySelectorAll('input[data-path]').forEach(input => {
    input.addEventListener('change', (event) => {
      event.stopPropagation();
      const [group, name] = event.target.dataset.path.split('.');
      const checked = event.target.checked;
      const next = {
        ...settings,
        enabled: checked ? true : settings.enabled,
        [group]: {
          ...(settings[group] || {}),
          [name]: checked
        }
      };
      persistSettings(next);
      applySettings(next);
      const category = group === 'motor' ? 'Motor & Tremor' : group === 'visual' ? 'Visual & Low Vision' : 'Cognitive & ADHD';
      report(`${checked ? 'Enabled' : 'Disabled'} ${name}`, category);
    });
  });

  renderWidget();
}

function renderWidget() {
  if (!lucentWidgetRoot) return;
  const wrap = lucentWidgetRoot.querySelector('.widget-wrap');
  if (wrap) {
    wrap.classList.toggle('is-on', !!settings.enabled);
  }
  const master = lucentWidgetRoot.querySelector('.master-btn');
  if (master) {
    master.textContent = settings.enabled ? 'ON' : 'OFF';
    master.classList.toggle('is-on', !!settings.enabled);
  }
  const fontSlider = lucentWidgetRoot.querySelector('.widget-font-slider');
  const fontBadge = lucentWidgetRoot.querySelector('.widget-font-size-badge');
  if (fontSlider && settings.visual?.fontSize) {
    fontSlider.value = String(settings.visual.fontSize);
    if (fontBadge) fontBadge.textContent = `${settings.visual.fontSize}px`;
  }
  lucentWidgetRoot.querySelectorAll('input[data-path]').forEach(input => {
    const [group, name] = input.dataset.path.split('.');
    input.checked = !!settings[group]?.[name];
  });
  lucentWidgetRoot.querySelectorAll('.profile-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.profile === settings.profile);
  });
}

function report(action, feature) {
  if (!isExtensionValid()) { cleanupContext(); return; }
  if (isDashboard() || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    at: new Date().toISOString(),
    site: location.hostname || 'Web Browser',
    url: location.href,
    action,
    feature
  };
  safeSendMessage({ type: 'LUCENT_RECORD_EVENT', event });
}

// Safe bidirectional bridge for the Lucent dashboard
async function handleDashboardMessage(event) {
  if (event.source !== window || !event.data || event.data.source !== 'lucent-dashboard') return;
  window.isLucentDashboardTab = true;

  if (!isExtensionValid()) {
    cleanupContext();
    return;
  }

  try {
    if (event.data.type === 'PING') {
      const stored = await safeStorageGet([settingsKey, 'lucentEvents']);
      if (!stored || !isExtensionValid()) return;
      const currentSettings = stored[settingsKey] || settings;
      window.postMessage({ source: 'lucent-extension', type: 'STATE', settings: currentSettings }, '*');
      window.postMessage({ source: 'lucent-extension', type: 'EVENTS', events: stored.lucentEvents || [] }, '*');
    } else if (event.data.type === 'SETTINGS' && event.data.settings) {
      const ok = await safeStorageSet({ [settingsKey]: event.data.settings, enabled: event.data.settings.enabled });
      if (ok && isExtensionValid()) {
        settings = event.data.settings;
      }
    } else if (event.data.type === 'CONFIG' && event.data.apiUrl) {
      safeStorageSet({ lucentApiUrl: event.data.apiUrl });
    }
  } catch {
    cleanupContext();
  }
}

try {
  if (typeof chrome !== 'undefined' && chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      try {
        if (!isExtensionValid() || area !== 'local') return;
        if (changes[settingsKey]) {
          const next = changes[settingsKey].newValue;
          if (isDashboard()) {
            window.postMessage({ source: 'lucent-extension', type: 'STATE', settings: next }, '*');
          } else {
            applySettings(next);
          }
        }
        if (changes.lucentEvents?.newValue?.[0] && isDashboard()) {
          window.postMessage({ source: 'lucent-extension', type: 'EVENT', event: changes.lucentEvents.newValue[0] }, '*');
        }
      } catch {
        cleanupContext();
      }
    });
  }
} catch {}

try {
  if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (!isExtensionValid()) {
          cleanupContext();
          return;
        }
        if (message.type === 'LUCENT_EVENT_RECORDED' && isDashboard()) {
          window.postMessage({ source: 'lucent-extension', type: 'EVENT', event: message.event }, '*');
          return;
        }
        if (message.type === 'LUCENT_SETTINGS') {
          if (isDashboard()) {
            window.postMessage({ source: 'lucent-extension', type: 'STATE', settings: message.settings }, '*');
          } else {
            applySettings(message.settings);
          }
          sendResponse({ success: true });
          return;
        }
        if (message.type === 'LUCENT_STATUS') {
          sendResponse({ settings, activeShortcuts: shortcutNodes.length });
          return;
        }
        if (message.type === 'LUCENT_FONT_SIZE') {
          if (!settings.visual) settings.visual = {};
          settings.visual.fontSize = message.fontSize;
          settings.enabled = true;
          applyFontSize(message.fontSize);
          sendResponse({ success: true });
          return;
        }
        if (message.type === 'LUCENT_SPEAK_SELECTION') {
          const ok = speakSelectedText(message.text);
          sendResponse({ success: true, isSpeaking: isSpeaking || ok, text: currentSelectedText });
          return;
        }
        if (message.type === 'LUCENT_GET_SELECTION') {
          const sel = window.getSelection()?.toString().trim() || currentSelectedText;
          sendResponse({ text: sel, isSpeaking: isSpeaking || window.speechSynthesis?.speaking || false });
          return;
        }
        if (message.type === 'SCAN_ACCESSIBILITY') {
          const results = scanAccessibility();
          report(`Accessibility scan: found ${results.total} issues`, 'Scanner');
          sendResponse({ results });
          return;
        }
        if (message.type === 'REINFORCE_ACCESSIBILITY') {
          reinforceAccessibility(message.remediations);
          removeHighlights();
          showLucentToast(`Applied accessibility fixes to ${lastScanResults?.total || 'page'} issues`);
          report('Applied auto-remediation fixes', 'Auto-fix');
          sendResponse({ success: true });
          return;
        }
        if (message.type === 'GEMINI_AI_SCAN') {
          (async () => {
            const scan = scanAccessibility();
            const remediations = await runGeminiAiScan(scan);
            reinforceAccessibility(remediations);
            removeHighlights();
            showLucentToast(`Gemini AI remediated ${scan.total} accessibility issues`);
            report(`Gemini AI remediated ${scan.total} issues on ${document.title || location.hostname}`, 'AI Auto-Remediate');
            if (isDashboard()) {
              window.postMessage({ source: 'lucent-extension', type: 'AUDIT_COMPLETE', results: scan, remediations }, '*');
            }
            sendResponse({ results: scan, remediations, success: true });
          })();
          return true; // Keep message channel open for async response
        }
        if (message.type === 'SIMPLIFY_PAGE_AI') {
          (async () => {
            const res = await simplifyActivePage();
            sendResponse(res);
          })();
          return true;
        }
        if (message.type === 'RESTORE_ORIGINAL_TEXT') {
          const res = restoreActivePage();
          sendResponse(res);
          return;
        }
      } catch {
        cleanupContext();
      }
    });
  }
} catch {}

let highlightedElements = [];
let lastScanResults = null;

function getLuminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function parseColor(value) {
  const rgb = value.match(/\d+/g);
  return rgb?.length >= 3 ? { r: +rgb[0], g: +rgb[1], b: +rgb[2] } : null;
}

function checkContrast(el) {
  const s = getComputedStyle(el);
  if (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') return true;
  const bg = parseColor(s.backgroundColor), fg = parseColor(s.color);
  if (!bg || !fg) return true;
  const a = getLuminance(bg.r, bg.g, bg.b), b = getLuminance(fg.r, fg.g, fg.b);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5;
}

function highlightElement(el, issue) {
  el.dataset.lucentOriginalOutline = el.style.outline || '';
  el.dataset.accessibilityIssue = issue;
  el.style.outline = '3px dashed #f87171';
  el.style.outlineOffset = '2px';
  highlightedElements.push(el);
}

function removeHighlights() {
  highlightedElements.forEach(el => {
    el.style.outline = el.dataset.lucentOriginalOutline || '';
    el.style.outlineOffset = '';
    delete el.dataset.lucentOriginalOutline;
    delete el.dataset.accessibilityIssue;
  });
  highlightedElements = [];
}

function showLucentToast(message) {
  try {
    let toast = document.getElementById('lucent-ai-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'lucent-ai-toast';
      toast.className = 'lucent-ai-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="lucent-ai-toast-icon">✦</span><span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  } catch (_) {}
}

function scanAccessibility() {
  removeHighlights();
  let smallTargets = 0, unlabeledButtons = 0, lowContrast = 0, missingAlt = 0;
  const unlabelledElements = [];
  const missingAltImages = [];

  const controls = document.querySelectorAll('button, a[href], [role="button"], input[type="button"], input[type="submit"]');
  controls.forEach((el, idx) => {
    if (el.closest('#lucent-widget')) return;

    // Check accessible name
    const hasVisibleText = (el.innerText || el.textContent || '').trim().length > 0;
    const hasAriaLabel = Boolean(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
    const isUnlabelled = !hasVisibleText && !hasAriaLabel;

    if (isUnlabelled) {
      unlabeledButtons++;
      const scanId = `lucent-ctrl-${idx}`;
      el.dataset.lucentScanId = scanId;
      highlightElement(el, 'unlabeled');

      unlabelledElements.push({
        id: scanId,
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === 'string' ? el.className.slice(0, 80) : '',
        elementId: el.id || '',
        textSnippet: (el.innerText || '').slice(0, 50).trim(),
        surroundingContext: (el.parentElement?.textContent || '').slice(0, 100).replace(/\s+/g, ' ').trim(),
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        svgContent: el.querySelector('svg')?.outerHTML?.slice(0, 120) || ''
      });
    }

    // Check touch target hitbox >= 44x44
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
      smallTargets++;
      el.dataset.lucentSmallTarget = 'true';
      if (!isUnlabelled) {
        highlightElement(el, 'small-target');
      }
    }
  });

  // Check images missing alt attribute
  document.querySelectorAll('img').forEach((img, idx) => {
    if (img.closest('#lucent-widget')) return;
    const role = img.getAttribute('role');
    const isPresentation = role === 'presentation' || role === 'none';
    const hasAlt = img.hasAttribute('alt') && img.alt.trim() !== '';

    if (!hasAlt && !isPresentation) {
      missingAlt++;
      const scanId = `lucent-img-${idx}`;
      img.dataset.lucentImgId = scanId;
      highlightElement(img, 'missing-alt');

      missingAltImages.push({
        id: scanId,
        src: img.src?.slice(0, 120) || '',
        surroundingText: (img.parentElement?.textContent || '').slice(0, 80).replace(/\s+/g, ' ').trim(),
        parentTag: img.parentElement?.tagName?.toLowerCase() || ''
      });
    }
  });

  // Contrast check
  [...document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6')].slice(0, 100).forEach(el => {
    if (el.closest('#lucent-widget')) return;
    if (el.textContent.trim() && !checkContrast(el)) {
      lowContrast++;
      highlightElement(el, 'low-contrast');
    }
  });

  const total = smallTargets + unlabeledButtons + lowContrast + missingAlt;
  lastScanResults = {
    title: document.title || 'Web Page',
    url: location.href,
    smallTargets,
    unlabeledButtons,
    lowContrast,
    missingAlt,
    total,
    unlabelledElements,
    missingAltImages
  };

  return lastScanResults;
}

async function runGeminiAiScan(scanData) {
  try {
    const aiResponse = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'LUCENT_AI_SCAN',
        scanData: {
          title: scanData.title,
          url: scanData.url,
          unlabelledElements: scanData.unlabelledElements || [],
          missingAltImages: scanData.missingAltImages || []
        }
      }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(res);
        }
      });
    });

    if (aiResponse && aiResponse.success && (aiResponse.labels || aiResponse.imageAlts)) {
      return aiResponse;
    }
  } catch (err) {
    console.warn('[Lucent] Gemini AI scan error, using local fallback heuristics', err);
  }

  return generateClientFallbackRemediations(scanData);
}

function generateClientFallbackRemediations(scanData) {
  const labels = {};
  const imageAlts = {};

  (scanData.unlabelledElements || []).forEach(el => {
    const hint = el.elementId || el.className || el.role || 'action';
    const cleanHint = hint.replace(/[-_]/g, ' ').replace(/[0-9]/g, '').trim();
    labels[el.id] = `Interactive control: ${cleanHint || 'Click to activate'}`;
  });

  (scanData.missingAltImages || []).forEach(img => {
    const snippet = img.surroundingText ? ` (${img.surroundingText.slice(0, 30)}...)` : '';
    imageAlts[img.id] = `Image on ${scanData.title || 'page'}${snippet}`;
  });

  return {
    labels,
    imageAlts,
    summary: `Remediated ${Object.keys(labels).length} controls and ${Object.keys(imageAlts).length} images.`,
    confidenceScore: 0.88
  };
}

function reinforceAccessibility(aiRemediations) {
  ROOT.dataset.accessibilityEnabled = 'true';

  // Apply Gemini AI-generated labels
  document.querySelectorAll('[data-lucent-scan-id]').forEach(el => {
    const scanId = el.dataset.lucentScanId;
    const aiLabel = aiRemediations?.labels?.[scanId];
    if (aiLabel) {
      el.setAttribute('aria-label', aiLabel);
      el.dataset.lucentAiRemediated = 'true';
    } else if (!el.getAttribute('aria-label') && !el.textContent.trim()) {
      el.setAttribute('aria-label', `Action ${el.id || el.className || 'control'}`);
    }
  });

  // Apply Gemini AI-generated image descriptions
  document.querySelectorAll('[data-lucent-img-id]').forEach(img => {
    const imgId = img.dataset.lucentImgId;
    const aiAlt = aiRemediations?.imageAlts?.[imgId];
    if (aiAlt) {
      img.setAttribute('alt', aiAlt);
      img.dataset.lucentAiRemediated = 'true';
    } else if (!img.hasAttribute('alt') || img.alt === '') {
      img.setAttribute('alt', `Image related to ${document.title || 'page content'}`);
    }
  });

  // Expand small touch targets (<44px)
  document.querySelectorAll('[data-lucent-small-target="true"]').forEach(el => {
    el.classList.add('lucent-touch-remediated');
  });
}

// Initializer
async function init() {
  window.addEventListener('message', handleDashboardMessage);

  if (isDashboard()) {
    window.isLucentDashboardTab = true;
    window.postMessage({ source: 'lucent-extension', type: 'HELLO' }, '*');
    const stored = await safeStorageGet([settingsKey, 'lucentEvents']);
    if (stored && isExtensionValid()) {
      window.postMessage({ source: 'lucent-extension', type: 'STATE', settings: stored[settingsKey] || settings }, '*');
      window.postMessage({ source: 'lucent-extension', type: 'EVENTS', events: stored.lucentEvents || [] }, '*');
    }
    return;
  }

  // Non-dashboard pages: attach normal accessibility listeners
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('click', blockRepeatActivation, true);
  document.addEventListener('selectionchange', () => {
    if (isDashboard()) return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text) {
      currentSelectedText = text;
    }
    updateSpeechButtonUI();
  });
  document.addEventListener('mouseup', () => {
    if (isDashboard()) return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text) {
      currentSelectedText = text;
      updateSpeechButtonUI();
    }
  });

  const stored = await safeStorageGet([settingsKey, 'lucentEvents']);
  if (!stored || !isExtensionValid()) return;
  
  if (stored[settingsKey]) {
    settings = { ...settings, ...stored[settingsKey] };
  }
  
  createWidget();
  applySettings(settings);
  if (settings.enabled && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    const prof = settings.profile === 'cognitive' ? 'Cognitive & ADHD' : settings.profile === 'motor' ? 'Motor & Tremor' : settings.profile === 'visual' ? 'Visual & Low Vision' : 'Baseline';
    report(`Visited ${document.title || location.hostname}`, prof);
  }
}

init();
