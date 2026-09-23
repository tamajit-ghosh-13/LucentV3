async function updateIcon(enabled) {
    const filename = enabled ? "green.png" : "grey.png";
    const url = chrome.runtime.getURL(`icons/${filename}`);

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        const sizes = [16, 32, 48, 128];
        const imageData = {};

        for (const size of sizes) {
            const canvas = new OffscreenCanvas(size, size);
            const context = canvas.getContext("2d");

            context.clearRect(0, 0, size, size);
            context.drawImage(bitmap, 0, 0, size, size);

            imageData[size] = context.getImageData(
                0,
                0,
                size,
                size
            );
        }

        await chrome.action.setIcon({
            imageData: imageData
        });

        console.log(`Icon changed to ${filename}`);

    } catch (error) {
        console.error("Failed to change icon:", error);
    }
}


// Gemini AI Integration for Lucent
const _DEF_K = atob('QVEuQWI4Uk42S1ExVHI2OExWUGdZU09wM0JZSUVCSU1jTWwyMlhFSkl5ZHMxZ0hmUEtDQnc=');

async function getGeminiApiKey() {
    try {
        const stored = await chrome.storage.local.get(['geminiApiKey', 'userGeminiApiKey']);
        return stored.geminiApiKey || stored.userGeminiApiKey || _DEF_K;
    } catch (_) {
        return _DEF_K;
    }
}

async function callGeminiApi(prompt) {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
        throw new Error('No Gemini API key configured');
    }

    // Free tier models: prioritize gemini-3.5-flash-lite and gemini-3.6-flash
    const models = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json'
                    }
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.warn(`[Lucent ServiceWorker] Model ${model} returned ${res.status}:`, errorText);
                lastError = new Error(`HTTP ${res.status}: ${errorText}`);
                continue;
            }

            const json = await res.json();
            const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) {
                throw new Error('Empty response from Gemini');
            }

            const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            return JSON.parse(cleanedText);
        } catch (err) {
            console.warn(`[Lucent ServiceWorker] Attempt with ${model} failed:`, err?.message || err);
            lastError = err;
        }
    }

    throw lastError || new Error('All Gemini models failed');
}

// Simplification Cache System (LRU, Chrome Storage backed)
const SIMPLIFY_CACHE_KEY = 'lucent_simplify_cache';
const MAX_CACHE_ENTRIES = 120;
let memSimplifyCache = null;

function normalizeTextForCache(text) {
    return (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function computeCacheKey(text) {
    const normalized = normalizeTextForCache(text);
    let hash = 5381;
    for (let i = 0; i < normalized.length; i++) {
        hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
        hash = hash & hash;
    }
    return `c_${Math.abs(hash)}_${normalized.length}`;
}

async function loadSimplifyCache() {
    if (memSimplifyCache !== null) return memSimplifyCache;
    try {
        const data = await chrome.storage.local.get(SIMPLIFY_CACHE_KEY);
        memSimplifyCache = data[SIMPLIFY_CACHE_KEY] || {};
    } catch (err) {
        console.warn('[Lucent ServiceWorker] Failed to load simplify cache:', err);
        memSimplifyCache = {};
    }
    return memSimplifyCache;
}

async function getCachedSimplification(text) {
    if (!text || typeof text !== 'string') return null;
    const key = computeCacheKey(text);
    const cache = await loadSimplifyCache();
    const entry = cache[key];
    if (entry && entry.result) {
        entry.ts = Date.now();
        return entry.result;
    }
    return null;
}

async function setCachedSimplification(text, result) {
    if (!text || !result) return;
    const key = computeCacheKey(text);
    const cache = await loadSimplifyCache();

    const keys = Object.keys(cache);
    if (keys.length >= MAX_CACHE_ENTRIES) {
        keys.sort((a, b) => (cache[a]?.ts || 0) - (cache[b]?.ts || 0));
        const toRemove = keys.slice(0, Math.floor(MAX_CACHE_ENTRIES * 0.25));
        for (const k of toRemove) {
            delete cache[k];
        }
    }

    cache[key] = {
        ts: Date.now(),
        result: result
    };

    try {
        await chrome.storage.local.set({ [SIMPLIFY_CACHE_KEY]: cache });
    } catch (err) {
        console.warn('[Lucent ServiceWorker] Failed to persist simplify cache:', err);
    }
}

async function handleAiSimplify(message) {
    const paragraphs = message.paragraphs;
    const singleText = message.text;

    // Target single paragraph / selection
    const targetSingleText = singleText || (Array.isArray(paragraphs) && paragraphs.length === 1 ? paragraphs[0] : null);

    if (targetSingleText) {
        // 1. Check cache first for exact/normalized text hit
        const cached = await getCachedSimplification(targetSingleText);
        if (cached) {
            console.log('[Lucent ServiceWorker] Cache HIT for text simplification');
            return {
                ...cached,
                cached: true
            };
        }

        const words = targetSingleText.trim().split(/\s+/).filter(Boolean);
        const originalWordCount = words.length;
        // Strictly target approximately 1/3 of the input word count
        const targetWordCount = Math.max(8, Math.round(originalWordCount / 3));

        const prompt = `You are an assistive cognitive accessibility AI specialized in reducing cognitive load and reading fatigue for neurodivergent users (ADHD, Dyslexia, Autism, cognitive overload).

ORIGINAL PASSAGE (${originalWordCount} words):
"""
${targetSingleText.slice(0, 3000)}
"""

CRITICAL LENGTH & FORMAT REQUIREMENT:
1. TARGET LENGTH: STRICTLY approximately ONE-THIRD (1/3) the word count of the original passage.
   - Original word count: ~${originalWordCount} words.
   - Target total summary length: around ~${targetWordCount} words combined across all bullet points.
   - Do NOT produce a lengthy rephrasing. Summarize concisely, cutting out 2/3 of the volume while retaining all key meaning.
2. BULLETS: Return 2 to 3 clear, punchy, bite-sized bullet points (6th grade reading level).
3. Do NOT include markdown code fences or conversational intro.

Return strictly valid JSON:
{
  "bulletPoints": ["Concise point 1", "Concise point 2"],
  "estimatedTimeSavedMinutes": ${Math.max(1, Math.round(originalWordCount / 140))},
  "originalWordCount": ${originalWordCount},
  "targetWordCount": ${targetWordCount}
}`;

        try {
            const parsed = await callGeminiApi(prompt);
            const pointsList = Array.isArray(parsed?.bulletPoints) && parsed.bulletPoints.length > 0
                ? parsed.bulletPoints
                : [targetSingleText];
            const bullets = pointsList.join('\n• ');
            const result = {
                success: true,
                simplifiedText: `• ${bullets}`,
                bulletPoints: pointsList,
                simplifiedParagraphs: [pointsList],
                readingTimeSavedMinutes: parsed?.estimatedTimeSavedMinutes || 1,
                originalWordCount,
                targetWordCount,
                cached: false
            };

            await setCachedSimplification(targetSingleText, result);
            return result;
        } catch (err) {
            console.warn('[Lucent ServiceWorker] AI single text simplify failed:', err);
            return {
                success: false,
                error: err?.message || 'Gemini simplify failed',
                simplifiedText: `• ${targetSingleText.slice(0, 200)}...`
            };
        }
    }

    // Batch paragraphs (> 1)
    if (Array.isArray(paragraphs) && paragraphs.length > 1) {
        const results = [];
        const uncachedIndices = [];
        const uncachedParagraphs = [];

        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            const cached = await getCachedSimplification(p);
            if (cached && (cached.bulletPoints || cached.simplifiedParagraphs?.[0])) {
                results[i] = cached.bulletPoints || cached.simplifiedParagraphs[0];
            } else {
                results[i] = null;
                uncachedIndices.push(i);
                const wCount = p.trim().split(/\s+/).filter(Boolean).length;
                uncachedParagraphs.push({
                    index: i,
                    originalWords: wCount,
                    targetWords: Math.max(8, Math.round(wCount / 3)),
                    text: p.slice(0, 800)
                });
            }
        }

        if (uncachedParagraphs.length === 0) {
            console.log('[Lucent ServiceWorker] All batch paragraphs retrieved from cache');
            return {
                success: true,
                simplifiedParagraphs: results,
                readingTimeSavedMinutes: Math.max(1, Math.round(paragraphs.length * 0.8)),
                cached: true
            };
        }

        const prompt = `You are an assistive cognitive AI specialized in reducing reading fatigue for neurodivergent readers.
For each numbered paragraph below, write 2 concise bullet points that are strictly ONE-THIRD (1/3) the length of that original paragraph.

Paragraphs to simplify:
${JSON.stringify(uncachedParagraphs.slice(0, 15), null, 2)}

Return strictly valid JSON:
{
  "simplified": [
    { "index": 0, "bullets": ["Bullet 1", "Bullet 2"] }
  ],
  "estimatedTimeSavedMinutes": 3
}`;

        try {
            const parsed = await callGeminiApi(prompt);
            const simplifiedMap = {};
            if (Array.isArray(parsed?.simplified)) {
                for (const item of parsed.simplified) {
                    if (typeof item.index === 'number' && Array.isArray(item.bullets)) {
                        simplifiedMap[item.index] = item.bullets;
                        const origText = paragraphs[item.index];
                        if (origText) {
                            const words = origText.trim().split(/\s+/).filter(Boolean);
                            await setCachedSimplification(origText, {
                                success: true,
                                bulletPoints: item.bullets,
                                simplifiedParagraphs: [item.bullets],
                                originalWordCount: words.length,
                                targetWordCount: Math.max(8, Math.round(words.length / 3))
                            });
                        }
                    }
                }
            }
            for (const idx of uncachedIndices) {
                results[idx] = simplifiedMap[idx] || null;
            }
            return {
                success: true,
                simplifiedParagraphs: results,
                readingTimeSavedMinutes: parsed?.estimatedTimeSavedMinutes || Math.max(1, Math.round(paragraphs.length * 0.8)),
                cached: false
            };
        } catch (err) {
            console.warn('[Lucent ServiceWorker] AI simplify batch failed:', err);
            return {
                success: false,
                error: err?.message || 'Gemini simplify failed',
                simplifiedParagraphs: results
            };
        }
    }

    return { success: false, error: 'No text provided to simplify' };
}

async function handleAiScan(scanData) {
    const prompt = `You are an expert Web Accessibility (WCAG 2.2 AAA) AI auditor.
Analyze the following unlabelled interactive elements and images on the webpage "${scanData.title || 'Webpage'}" (${scanData.url || ''}).
Generate accurate, concise, human-friendly 'aria-label' text for interactive controls (buttons, links) and 'alt' descriptions for images.

Unlabelled Elements:
${JSON.stringify((scanData.unlabelledElements || []).slice(0, 15), null, 2)}

Images Missing Alt Text:
${JSON.stringify((scanData.missingAltImages || []).slice(0, 15), null, 2)}

Return strictly valid JSON:
{
  "labels": {
    "<element_id>": "Short action description"
  },
  "imageAlts": {
    "<image_id>": "Accurate alt text under 120 chars"
  },
  "summary": "Brief 1-sentence summary of fixes",
  "confidenceScore": 0.98
}`;

    try {
        const parsed = await callGeminiApi(prompt);
        return {
            success: true,
            labels: parsed?.labels || {},
            imageAlts: parsed?.imageAlts || {},
            summary: parsed?.summary || 'Remediations generated by Gemini AI.',
            confidenceScore: typeof parsed?.confidenceScore === 'number' ? parsed.confidenceScore : 0.96
        };
    } catch (err) {
        console.warn('[Lucent ServiceWorker] AI scan failed:', err);
        return {
            success: false,
            error: err?.message || 'Gemini scan failed'
        };
    }
}

let eventWriteQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TOGGLE_EXTENSION") {
        updateIcon(message.enabled);
        sendResponse({ success: true });
        return true;
    }

    if (message.type === 'LUCENT_AI_SIMPLIFY') {
        handleAiSimplify(message).then(result => {
            sendResponse(result);
        }).catch(err => {
            sendResponse({ success: false, error: err?.message || 'Simplification failed' });
        });
        return true;
    }

    if (message.type === 'LUCENT_AI_SCAN') {
        handleAiScan(message.scanData || {}).then(result => {
            sendResponse(result);
        }).catch(err => {
            sendResponse({ success: false, error: err?.message || 'Scan failed' });
        });
        return true;
    }

    if (message.type === 'GET_GEMINI_KEY') {
        getGeminiApiKey().then(key => {
            const isCustom = !!key && key !== _DEF_K;
            sendResponse({ apiKey: key || '', isCustom, isDefault: key === _DEF_K });
        });
        return true;
    }

    if (message.type === 'SET_GEMINI_KEY') {
        chrome.storage.local.set({ geminiApiKey: (message.apiKey || '').trim() }).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === 'LUCENT_RECORD_EVENT' && message.event) {
        const site = String(message.event.site || '').toLowerCase();
        if (site.includes('localhost') || site.includes('127.0.0.1')) {
            sendResponse({ ignored: true });
            return true;
        }

        eventWriteQueue = eventWriteQueue.then(async () => {
            const stored = await chrome.storage.local.get('lucentEvents');
            const cleaned = (stored.lucentEvents || []).filter((e) => {
                const s = String(e?.site || '').toLowerCase();
                return !s.includes('localhost') && !s.includes('127.0.0.1');
            });
            const events = [message.event, ...cleaned].slice(0, 100);
            await chrome.storage.local.set({ lucentEvents: events });
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    if (tab.id && (!tab.url || /^https?:/.test(tab.url))) {
                        chrome.tabs.sendMessage(tab.id, { type: 'LUCENT_EVENT_RECORDED', event: message.event }, () => void chrome.runtime.lastError);
                    }
                });
            });
        });
        sendResponse({ queued: true });
        return true;
    }
});


chrome.storage.local.get(["lucentSettings", "enabled"], (result) => {
    updateIcon(result.lucentSettings?.enabled ?? result.enabled ?? false);
});

// One profile change is broadcast immediately to every open normal browser tab.
// This avoids waiting for a reload or a new content-script lifecycle.
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.lucentSettings?.newValue) return;
    const nextSettings = changes.lucentSettings.newValue;
    updateIcon(!!nextSettings.enabled);
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            if (!tab.id || !/^https?:/.test(tab.url || '')) return;
            chrome.tabs.sendMessage(tab.id, { type: 'LUCENT_SETTINGS', settings: nextSettings }, () => void chrome.runtime.lastError);
        });
    });
});
