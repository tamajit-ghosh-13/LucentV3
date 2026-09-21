const toggleButton = document.getElementById("toggle");

chrome.storage.local.get(["enabled"], (result) => {
    updateUI(result.enabled ?? false);
});

toggleButton.addEventListener("click", () => {
    chrome.storage.local.get(["enabled"], (result) => {
        const newState = !(result.enabled ?? false);

        chrome.storage.local.set({
            enabled: newState
        });

        updateUI(newState);

        chrome.runtime.sendMessage({
            type: "TOGGLE_EXTENSION",
            enabled: newState
        });
    });
});

function updateUI(enabled) {
    toggleButton.textContent = enabled ? "Deactivate" : "Activate";
}