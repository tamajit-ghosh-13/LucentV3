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

async function handleAiSimplify(message) {
    const paragraphs = message.paragraphs;
    const singleText = message.text;

    if (Array.isArray(paragraphs) && paragraphs.length > 0) {
        const prompt = `You are an assistive cognitive AI specialized in reducing reading fatigue for neurodivergent readers (ADHD, Dyslexia, Autism, cognitive overload).
For each of the following numbered paragraphs, write 2 to 3 concise, highly readable, plain-language bullet points capturing the core factual takeaways (6th grade reading level).

Paragraphs to simplify:
${JSON.stringify(paragraphs.slice(0, 15).map((p, i) => ({ index: i, text: p.slice(0, 800) })), null, 2)}

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
                parsed.simplified.forEach(item => {
                    if (typeof item.index === 'number' && Array.isArray(item.bullets)) {
                        simplifiedMap[item.index] = item.bullets;
                    }
                });
            }
            const results = paragraphs.map((p, i) => simplifiedMap[i] || null);
            return {
                success: true,
                simplifiedParagraphs: results,
                readingTimeSavedMinutes: parsed?.estimatedTimeSavedMinutes || Math.max(1, Math.round(paragraphs.length * 0.8))
            };
        } catch (err) {
            console.warn('[Lucent ServiceWorker] AI simplify failed:', err);
            return {
                success: false,
                error: err?.message || 'Gemini simplify failed',
                simplifiedParagraphs: null
            };
        }
    }

    if (singleText) {
        const prompt = `Rewrite the following text into 3-4 clear, bite-sized bullet points using plain, simple language for neurodivergent readers:
${singleText.slice(0, 1500)}

Return strictly valid JSON:
{
  "bulletPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedTimeSavedMinutes": 2
}`;

        try {
            const parsed = await callGeminiApi(prompt);
            const bullets = Array.isArray(parsed?.bulletPoints) ? parsed.bulletPoints.join('\n• ') : singleText;
            return {
                success: true,
                simplifiedText: `• ${bullets}`,
                readingTimeSavedMinutes: parsed?.estimatedTimeSavedMinutes || 1
            };
        } catch (err) {
            console.warn('[Lucent ServiceWorker] AI single text simplify failed:', err);
            return {
                success: false,
                error: err?.message || 'Gemini simplify failed',
                simplifiedText: `• ${singleText.slice(0, 200)}...`
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
