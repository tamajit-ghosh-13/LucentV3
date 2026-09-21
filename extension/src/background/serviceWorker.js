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


chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TOGGLE_EXTENSION") {
        updateIcon(message.enabled);
    }
});


chrome.storage.local.get(["enabled"], (result) => {
    updateIcon(result.enabled ?? false);
});