import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  const text = (req.body && req.body.text) || '';

  if (!apiKey || !text.trim()) {
    return res.status(200).json({
      simplifiedText: text ? `• ${text.slice(0, 200)}...` : '',
      readingTimeSavedMinutes: 1
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Rewrite the following text into 3-4 clear, bite-sized bullet points using plain, simple language for readers with ADHD/cognitive overload:
${text.slice(0, 1500)}

Return JSON:
{
  "bulletPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedTimeSavedMinutes": 2
}
`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text?.trim() || '{}');
    const bullets = Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints.join('\n• ') : text;
    return res.status(200).json({
      simplifiedText: `• ${bullets}`,
      readingTimeSavedMinutes: parsed.estimatedTimeSavedMinutes || 1
    });
  } catch (err) {
    console.error('Gemini simplify error:', err);
    return res.status(200).json({
      simplifiedText: `• ${text.slice(0, 250)}...`,
      readingTimeSavedMinutes: 1
    });
  }
}
