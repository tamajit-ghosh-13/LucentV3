import { GoogleGenAI } from '@google/genai';

export interface UnlabelledElementContext {
  id: string;
  tag: string;
  className?: string;
  elementId?: string;
  textSnippet?: string;
  surroundingContext?: string;
  role?: string;
  svgContent?: string;
}

export interface MissingAltImageContext {
  id: string;
  src?: string;
  surroundingText?: string;
  parentTag?: string;
}

export interface ScanContext {
  pageTitle: string;
  pageUrl: string;
  unlabelledElements: UnlabelledElementContext[];
  missingAltImages: MissingAltImageContext[];
}

export interface AiRemediationResult {
  labels: Record<string, string>; // map of element id -> semantic aria-label
  imageAlts: Record<string, string>; // map of image id -> contextual alt description
  summary: string;
  confidenceScore: number;
}

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    console.warn('[GeminiService] GEMINI_API_KEY is not configured in environment.');
    return null;
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

/**
 * Audits unlabelled elements and images missing alt text using Gemini 3.6 Flash.
 * Generates natural, concise, and highly accessible aria-labels and image descriptions.
 */
export async function auditAccessibilityWithGemini(
  context: ScanContext
): Promise<AiRemediationResult> {
  const client = getGeminiClient();

  // Fallback heuristic if API key is not available
  if (!client) {
    return generateFallbackRemediations(context);
  }

  try {
    const prompt = `
You are an expert Web Accessibility (WCAG 2.2 AAA) AI auditor.
Analyze the following unlabelled interactive elements and images on the webpage "${context.pageTitle}" (${context.pageUrl}).
Generate accurate, concise, human-friendly 'aria-label' text for interactive controls (buttons, links) and 'alt' descriptions for images.

Page Context:
Title: "${context.pageTitle}"
URL: "${context.pageUrl}"

Unlabelled Elements:
${JSON.stringify(context.unlabelledElements.slice(0, 15), null, 2)}

Images Missing Alt Text:
${JSON.stringify(context.missingAltImages.slice(0, 15), null, 2)}

Return strictly valid JSON with the following structure (no markdown fences, no extra text):
{
  "labels": {
    "<element_id>": "Short, clear action description (e.g. 'Search website', 'Shopping cart', 'Close dialog')"
  },
  "imageAlts": {
    "<image_id>": "Accurate, descriptive alt text under 120 characters"
  },
  "summary": "Brief 1-sentence summary of the remediations applied.",
  "confidenceScore": 0.98
}
`;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    return {
      labels: parsed.labels || {},
      imageAlts: parsed.imageAlts || {},
      summary: parsed.summary || `AI generated ${Object.keys(parsed.labels || {}).length} labels and ${Object.keys(parsed.imageAlts || {}).length} image descriptions.`,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.95,
    };
  } catch (error) {
    console.error('[GeminiService] Error calling Gemini API:', error);
    return generateFallbackRemediations(context);
  }
}

/**
/**
 * Extracts key sentences from text as an instant, zero-latency local heuristic fallback.
 */
export function generateLocalBulletPoints(text: string): string[] {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
  if (sentences.length <= 2) {
    return sentences.length > 0 ? sentences : [text.slice(0, 120)];
  }
  return [sentences[0], sentences[Math.floor(sentences.length / 2)], sentences[sentences.length - 1]].slice(0, 3);
}

/**
 * Simplifies complex, dense text into plain-language bullet points for Cognitive & ADHD mode.
 * Supports both single string input and batch paragraphs { paragraphs: string[] }.
 */
export async function simplifyTextWithGemini(
  input: string | { text?: string; paragraphs?: string[] }
): Promise<{
  simplifiedText?: string;
  simplifiedParagraphs?: string[][];
  readingTimeSavedMinutes: number;
}> {
  const client = getGeminiClient();

  const isBatch = typeof input === 'object' && Array.isArray(input?.paragraphs) && input.paragraphs.length > 0;
  const singleText = typeof input === 'string' ? input : (input?.text || '');

  if (isBatch) {
    const paragraphs = (input as { paragraphs: string[] }).paragraphs.slice(0, 15);
    if (!client) {
      return {
        simplifiedParagraphs: paragraphs.map(p => generateLocalBulletPoints(p)),
        readingTimeSavedMinutes: Math.max(1, Math.round(paragraphs.length * 0.8)),
      };
    }

    try {
      const prompt = `
You are an assistive cognitive AI specialized in reducing reading fatigue for neurodivergent readers (ADHD, Dyslexia, Autism, cognitive overload).
For each of the following paragraphs, write 2 to 3 concise, highly readable, plain-language bullet points capturing the core factual takeaways (6th grade reading level).

Paragraphs to simplify:
${JSON.stringify(paragraphs.map((p, i) => ({ index: i, text: p.slice(0, 800) })), null, 2)}

Return strictly valid JSON in this schema (no markdown, no extra commentary):
{
  "simplified": [
    { "index": 0, "bullets": ["Bullet point 1", "Bullet point 2"] }
  ],
  "estimatedTimeSavedMinutes": 3
}
`;
      const response = await client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      const simplifiedMap: Record<number, string[]> = {};
      if (Array.isArray(parsed.simplified)) {
        parsed.simplified.forEach((item: any) => {
          if (typeof item.index === 'number' && Array.isArray(item.bullets)) {
            simplifiedMap[item.index] = item.bullets;
          }
        });
      }

      const results = paragraphs.map((p, i) => simplifiedMap[i] || generateLocalBulletPoints(p));
      return {
        simplifiedParagraphs: results,
        readingTimeSavedMinutes: parsed.estimatedTimeSavedMinutes || Math.max(1, Math.round(paragraphs.length * 0.8)),
      };
    } catch (err) {
      console.warn('[GeminiService] Batch simplification fallback activated:', err);
      return {
        simplifiedParagraphs: paragraphs.map(p => generateLocalBulletPoints(p)),
        readingTimeSavedMinutes: Math.max(1, Math.round(paragraphs.length * 0.8)),
      };
    }
  }

  // Single text handling
  if (!client || !singleText.trim()) {
    return {
      simplifiedText: singleText.slice(0, 200) + '...',
      readingTimeSavedMinutes: 1,
    };
  }

  try {
    const prompt = `
You are an assistive cognitive AI that optimizes reading retention for people with ADHD, dyslexia, and cognitive overload.
Rewrite the following text into 3-4 clear, bite-sized bullet points using plain, simple language (Flesch-Kincaid Grade Level 6-8). Keep key facts intact.

Original Text:
${singleText.slice(0, 1500)}

Return JSON:
{
  "bulletPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedTimeSavedMinutes": 2
}
`;

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const bullets = Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints.join('\n• ') : singleText;

    return {
      simplifiedText: `• ${bullets}`,
      readingTimeSavedMinutes: parsed.estimatedTimeSavedMinutes || 1,
    };
  } catch (error) {
    console.error('[GeminiService] Error simplifying text with Gemini:', error);
    return {
      simplifiedText: singleText.slice(0, 300) + '...',
      readingTimeSavedMinutes: 1,
    };
  }
}

/**
 * Fallback heuristics if Gemini network call cannot be made.
 */
function generateFallbackRemediations(context: ScanContext): AiRemediationResult {
  const labels: Record<string, string> = {};
  const imageAlts: Record<string, string> = {};

  for (const el of context.unlabelledElements) {
    const hint = el.elementId || el.className || el.textSnippet || 'Interactive control';
    const cleanHint = hint.replace(/[-_]/g, ' ').replace(/[0-9]/g, '').trim();
    labels[el.id] = `Action: ${cleanHint || 'Clickable button'}`;
  }

  for (const img of context.missingAltImages) {
    const contextSnippet = img.surroundingText ? ` (${img.surroundingText.slice(0, 30)}...)` : '';
    imageAlts[img.id] = `Illustrative image on ${context.pageTitle}${contextSnippet}`;
  }

  return {
    labels,
    imageAlts,
    summary: `Heuristic accessibility labels assigned to ${Object.keys(labels).length} controls and ${Object.keys(imageAlts).length} images.`,
    confidenceScore: 0.85,
  };
}
