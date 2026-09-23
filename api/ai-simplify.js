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
  const paragraphs = req.body?.paragraphs;
  const singleText = req.body?.text || '';

  if (!apiKey || (!paragraphs && !singleText.trim())) {
    return res.status(200).json({
      simplifiedParagraphs: Array.isArray(paragraphs) ? paragraphs.map(p => [p.slice(0, 160)]) : undefined,
      simplifiedText: singleText ? `• ${singleText.slice(0, 200)}...` : '',
      readingTimeSavedMinutes: 1
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    if (Array.isArray(paragraphs) && paragraphs.length > 0) {
      const prompt = `
You are an assistive cognitive AI specialized in reducing reading fatigue for neurodivergent readers (ADHD, Dyslexia, Autism, cognitive overload).
For each of the following paragraphs, write 2 to 3 concise, highly readable, plain-language bullet points capturing the core factual takeaways (6th grade reading level).

Paragraphs to simplify:
${JSON.stringify(paragraphs.slice(0, 15).map((p, i) => ({ index: i, text: p.slice(0, 800) })), null, 2)}

Return strictly valid JSON:
{
  "simplified": [
    { "index": 0, "bullets": ["Bullet 1", "Bullet 2"] }
  ],
  "estimatedTimeSavedMinutes": 3
}
`;
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(response.text?.trim() || '{}');
      const simplifiedMap = {};
      if (Array.isArray(parsed.simplified)) {
        parsed.simplified.forEach(item => {
          if (typeof item.index === 'number' && Array.isArray(item.bullets)) {
            simplifiedMap[item.index] = item.bullets;
          }
        });
      }
      const results = paragraphs.map((p, i) => simplifiedMap[i] || [p.slice(0, 160)]);
      return res.status(200).json({
        simplifiedParagraphs: results,
        readingTimeSavedMinutes: parsed.estimatedTimeSavedMinutes || Math.max(1, Math.round(paragraphs.length * 0.8))
      });
    }

    const prompt = `
Rewrite the following text into 3-4 clear, bite-sized bullet points using plain, simple language for readers with ADHD/cognitive overload:
${singleText.slice(0, 1500)}

Return JSON:
{
  "bulletPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedTimeSavedMinutes": 2
}
`;
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const parsed = JSON.parse(response.text?.trim() || '{}');
    const bullets = Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints.join('\n• ') : singleText;
    return res.status(200).json({
      simplifiedText: `• ${bullets}`,
      readingTimeSavedMinutes: parsed.estimatedTimeSavedMinutes || 1
    });
  } catch (err) {
    console.error('Gemini simplify error:', err);
    return res.status(200).json({
      simplifiedText: singleText ? `• ${singleText.slice(0, 250)}...` : '',
      simplifiedParagraphs: Array.isArray(paragraphs) ? paragraphs.map(p => [p.slice(0, 160)]) : undefined,
      readingTimeSavedMinutes: 1
    });
  }
}
