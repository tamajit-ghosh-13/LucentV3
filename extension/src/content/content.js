chrome.storage.local.get(["enabled"], (result) => {
    updateExtensionState(result.enabled ?? false);
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) {
        updateExtensionState(changes.enabled.newValue);
    }
});

function updateExtensionState(enabled) {
    document.documentElement.dataset.accessibilityEnabled = enabled;
}