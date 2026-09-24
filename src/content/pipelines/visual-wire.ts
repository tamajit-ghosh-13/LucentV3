// Configuration for the local Python backend API
const API_URL = "http://localhost:8000/api/visual/analyze-element"; // Adjust based on deployment

export interface VisualSettings {
  highContrast: boolean;
  scaleTypography: boolean;
  aiLabelling: boolean;
}

/**
 * Orchestrator: Initializes the visual pipeline on the current webpage.
 * Called by the content script orchestrator when the profile is loaded.
 */
export function initVisualPipeline(settings: VisualSettings) {
  if (settings.highContrast) applyHighContrast();
  if (settings.scaleTypography) applyTypographyScaling();
  if (settings.aiLabelling) scanAndLabelElements();

  // Set up an observer for dynamic SPA changes (MutationObserver)
  const observer = new MutationObserver(() => {
    // In production, debounce these calls heavily to prevent performance drag
    if (settings.aiLabelling) {
      scanAndLabelElements();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Pipeline Stage 1: Contrast & Color Tuning
 */
function applyHighContrast() {
  const elements = document.querySelectorAll<HTMLElement>('p, span, h1, h2, h3, h4, h5, h6, a, button');
  elements.forEach(el => {
    // Realistic fallback for high contrast. 
    // A robust version would compute relative luminance via window.getComputedStyle first.
    el.style.color = '#000000'; 
    el.style.textShadow = '1px 1px 0 #FFFFFF, -1px -1px 0 #FFFFFF'; 
  });
}

/**
 * Pipeline Stage 2: Dynamic Typography Scaling
 */
function applyTypographyScaling() {
  const elements = document.querySelectorAll<HTMLElement>('p, span, a, li');
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    const currentSize = parseFloat(style.fontSize);
    
    // Scale up fonts smaller than 16px to improve readability
    if (currentSize < 16) {
      el.style.fontSize = '16px';
      el.style.lineHeight = '1.6'; // Generous line height
    }
  });
}

/**
 * Pipeline Stage 3: AI Element Labelling via Python Backend
 */
async function scanAndLabelElements() {
  // Find unlabelled SVGs and Images
  const unlabelledSVGs = Array.from(document.querySelectorAll('svg:not([aria-label]):not([aria-hidden="true"])'));
  const unlabelledImgs = Array.from(document.querySelectorAll('img:not([alt]):not([data-scanning])'));

  // Process SVGs
  for (const svg of unlabelledSVGs) {
    svg.setAttribute('aria-hidden', 'true'); // Temporarily hide to avoid infinite loop scanning
    
    const svgString = new XMLSerializer().serializeToString(svg);
    const base64SVG = btoa(unescape(encodeURIComponent(svgString)));
    const dataUrl = `data:image/svg+xml;base64,${base64SVG}`;
    
    await labelElementWithAI(svg as HTMLElement, dataUrl, 'svg');
  }

  // Process raster Images
  for (const img of unlabelledImgs) {
    img.setAttribute('data-scanning', 'true');
    const imgSrc = (img as HTMLImageElement).src;
    
    // Convert image to base64 via canvas (simplified for CORS-safe images)
    try {
      const base64Img = await getBase64FromUrl(imgSrc);
      await labelElementWithAI(img as HTMLElement, base64Img, 'image');
    } catch (e) {
      console.warn("Could not capture image for AI labeling due to CORS:", imgSrc);
    }
  }
}

/**
 * Bridge: Sends the extracted element to the Python API and patches the DOM
 */
async function labelElementWithAI(element: HTMLElement, imageBase64: string, type: string) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        element_type: type,
        context_text: element.parentElement?.innerText?.substring(0, 100) || ""
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Patch the DOM dynamically
      if (data.aria_label) {
        element.setAttribute('aria-label', data.aria_label);
        element.setAttribute('role', 'img');
        element.removeAttribute('aria-hidden'); // Restore visibility to screen readers
        
        // Add a visual indicator in dev mode
        element.style.outline = "2px solid #10B981"; // Green outline for successfully labeled items
      }
      
      if (type === 'image' && data.alt_text) {
        element.setAttribute('alt', data.alt_text);
      }
    }
  } catch (error) {
    console.error("Lucent Visual AI Pipeline Error:", error);
  }
}

/**
 * Utility: Fetches an image URL and converts it to Base64
 */
async function getBase64FromUrl(url: string): Promise<string> {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob); 
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}
