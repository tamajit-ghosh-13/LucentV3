const btnScan = document.getElementById("btn-scan");
const btnReinforce = document.getElementById("btn-reinforce");
const resultsDiv = document.getElementById("results");

const elTotal = document.getElementById("total-issues");
const elTargets = document.getElementById("count-targets");
const elUnlabeled = document.getElementById("count-unlabeled");
const elContrast = document.getElementById("count-contrast");
const elImages = document.getElementById("count-images");

btnScan.addEventListener("click", async () => {
    btnScan.textContent = "Scanning...";
    btnScan.disabled = true;

    // Send message to content script in the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { type: "SCAN_ACCESSIBILITY" }, (response) => {
        btnScan.textContent = "Re-Scan Page";
        btnScan.disabled = false;
        
        if (response && response.results) {
            displayResults(response.results);
        } else {
            alert("Could not scan page. Ensure you are on a valid webpage (not a chrome:// URL) and try refreshing the tab.");
        }
    });
});

btnReinforce.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: "REINFORCE_ACCESSIBILITY" }, () => {
        btnReinforce.textContent = "✅ Issues Fixed";
        btnReinforce.disabled = true;
        btnReinforce.style.backgroundColor = "#059669";
        
        // Update results to show 0
        displayResults({
            smallTargets: 0,
            unlabeledButtons: 0,
            lowContrast: 0,
            missingAlt: 0,
            total: 0
        });
    });
});

function displayResults(data) {
    resultsDiv.style.display = "flex";
    
    elTotal.textContent = `${data.total} issue${data.total !== 1 ? 's' : ''} found`;
    elTotal.style.color = data.total > 0 ? "#f87171" : "#10b981"; // Red if issues, green if none

    elTargets.textContent = data.smallTargets;
    elUnlabeled.textContent = data.unlabeledButtons;
    elContrast.textContent = data.lowContrast;
    elImages.textContent = data.missingAlt;
    
    if (data.total > 0) {
        btnReinforce.style.display = "block";
        btnReinforce.textContent = "✨ Fix Issues Automatically";
        btnReinforce.disabled = false;
        btnReinforce.style.backgroundColor = "#10b981";
    } else {
        btnReinforce.style.display = "none";
    }
}