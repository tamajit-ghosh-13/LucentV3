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


let eventWriteQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "TOGGLE_EXTENSION") {
        updateIcon(message.enabled);
        sendResponse({ success: true });
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
