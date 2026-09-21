chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SCAN_ACCESSIBILITY") {
        const results = scanAccessibility();
        sendResponse({ results: results });
        return true;
    } else if (message.type === "REINFORCE_ACCESSIBILITY") {
        reinforceAccessibility();
        removeHighlights();
        sendResponse({ success: true });
        return true;
    }
});

let highlightedElements = [];

function getLuminance(r, g, b) {
    const a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(l1, l2) {
    const lightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (lightest + 0.05) / (darkest + 0.05);
}

function parseColor(colorStr) {
    const rgba = colorStr.match(/\d+/g);
    if (!rgba || rgba.length < 3) return null;
    return { r: parseInt(rgba[0]), g: parseInt(rgba[1]), b: parseInt(rgba[2]) };
}

function checkContrast(element) {
    const style = window.getComputedStyle(element);
    const bgColorStr = style.backgroundColor;
    const colorStr = style.color;
    
    if (bgColorStr === 'rgba(0, 0, 0, 0)' || bgColorStr === 'transparent') {
       return true; 
    }

    const bgColor = parseColor(bgColorStr);
    const fgColor = parseColor(colorStr);

    if (bgColor && fgColor) {
        const l1 = getLuminance(bgColor.r, bgColor.g, bgColor.b);
        const l2 = getLuminance(fgColor.r, fgColor.g, fgColor.b);
        const ratio = getContrastRatio(l1, l2);
        
        return ratio >= 4.5;
    }
    return true;
}

function scanAccessibility() {
    removeHighlights();
    
    let smallTargetsCount = 0;
    let unlabeledButtonsCount = 0;
    let lowContrastCount = 0;
    let missingAltCount = 0;

    // 1. Unlabeled buttons
    const buttonsAndLinks = document.querySelectorAll('button, a, [role="button"]');
    buttonsAndLinks.forEach(el => {
        if (!el.textContent.trim() && !el.getAttribute('aria-label')) {
            const img = el.querySelector('img, svg');
            if (!img || (img.tagName === 'IMG' && !img.getAttribute('alt'))) {
                unlabeledButtonsCount++;
                highlightElement(el, 'unlabeled');
            }
        }
    });

    // 2. Small targets (less than 44x44 CSS pixels)
    buttonsAndLinks.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
                smallTargetsCount++;
                highlightElement(el, 'small-target');
            }
        }
    });

    // 3. Missing image description
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('alt') || img.getAttribute('alt') === "") {
            if (img.getAttribute('role') !== 'presentation') {
                missingAltCount++;
                highlightElement(img, 'missing-alt');
            }
        }
    });

    // 4. Low contrast
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6');
    const limit = Math.min(textElements.length, 100);
    for (let i = 0; i < limit; i++) {
        const el = textElements[i];
        if (el.textContent.trim().length > 0) {
            if (!checkContrast(el)) {
                lowContrastCount++;
                highlightElement(el, 'low-contrast');
            }
        }
    }

    const total = smallTargetsCount + unlabeledButtonsCount + lowContrastCount + missingAltCount;

    return {
        smallTargets: smallTargetsCount,
        unlabeledButtons: unlabeledButtonsCount,
        lowContrast: lowContrastCount,
        missingAlt: missingAltCount,
        total: total
    };
}

function highlightElement(el, issueType) {
    const originalOutline = el.style.outline;
    const originalOutlineOffset = el.style.outlineOffset;
    
    el.dataset.originalOutline = originalOutline;
    el.dataset.originalOutlineOffset = originalOutlineOffset;
    el.dataset.accessibilityIssue = issueType;
    
    el.style.outline = '3px dashed #f87171';
    el.style.outlineOffset = '2px';
    
    highlightedElements.push(el);
}

function removeHighlights() {
    highlightedElements.forEach(el => {
        el.style.outline = el.dataset.originalOutline || '';
        el.style.outlineOffset = el.dataset.originalOutlineOffset || '';
        delete el.dataset.originalOutline;
        delete el.dataset.originalOutlineOffset;
        delete el.dataset.accessibilityIssue;
    });
    highlightedElements = [];
}

// 5. Reinforcement logic
function reinforceAccessibility() {
    document.documentElement.dataset.accessibilityEnabled = "true";
    
    const buttonsAndLinks = document.querySelectorAll('button:not([aria-label]), a:not([aria-label]), [role="button"]:not([aria-label])');
    buttonsAndLinks.forEach(el => {
        if (!el.textContent.trim()) {
            const img = el.querySelector('img, svg');
            let label = "Unlabelled Interactive Element";
            if (img && img.getAttribute('alt')) {
                label = img.getAttribute('alt');
            } else if (el.id) {
                label = el.id.replace(/-/g, ' ');
            } else if (el.className && typeof el.className === 'string') {
                label = "Action " + el.className.split(' ')[0]; 
            }
            el.setAttribute('aria-label', `[AI Reinforced] ${label}`);
        }
    });

    const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
    images.forEach(img => {
        img.setAttribute('alt', '[AI Reinforced] Image description provided by Universal Accessibility Layer');
    });
}