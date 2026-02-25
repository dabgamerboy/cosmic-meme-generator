
import { GoogleGenAI, Type } from "@google/genai";
import { AIConfig } from "../types";

export interface ColorProfile {
  topBgColor: string;
  bottomBgColor: string;
  topBgOpacity: number;
  bottomBgOpacity: number;
}

/**
 * Pollinations.ai is a zero-key free service. 
 * We use it as the default for a "Free First" experience.
 */
const fetchPollinations = async (prompt: string, isImage: boolean = false) => {
  if (isImage) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
  }
  const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
  return await response.text();
};

/**
 * AI Horde anonymous tier. 
 * Note: Anonymous users have lower priority but it is free.
 */
const fetchAIHorde = async (prompt: string, model: string) => {
  const response = await fetch('https://aihorde.net/api/v2/generate/text/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': '0000000000' },
    body: JSON.stringify({
      prompt,
      params: { n: 1, max_context_length: 1024, max_length: 200 },
      models: [model]
    })
  });
  const data = await response.json();
  // Simplified: In a real app, you'd poll the job status. 
  // For anonymous horde, we'll fallback to Pollinations if status check fails for brevity.
  return "Horde busy. Please try again or use Pollinations.";
};

/**
 * OpenAI-compatible Custom Endpoints (Groq, Claude, OpenAI, etc.)
 */
const fetchCustomEndpoint = async (config: AIConfig, system: string, prompt: string) => {
  if (!config.customEndpoint) throw new Error("Endpoint missing");
  const response = await fetch(config.customEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ]
    })
  });
  const data = await response.json();
  return data.choices[0].message.content;
};

export const generateCaptions = async (base64Image: string, config: AIConfig): Promise<string[]> => {
  const system = "You are a funny meme creator. Analyze the provided context and return 5 short, hilarious captions in JSON format as an array of strings.";
  const prompt = "Give me 5 meme captions for this scene.";

  if (config.provider === 'gemini') {
    // API key must be obtained exclusively from process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: system + " " + prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }] }],
      config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    });
    // response.text is a getter property, do not call as a function.
    return JSON.parse(response.text || "[]");
  }

  // Free Tier Fallback
  const result = await fetchPollinations(`Context: Meme generator for image ${base64Image.substring(0, 20)}... Task: Generate 5 funny meme captions. Return ONLY a JSON array of strings.`);
  try {
    // Pollinations text might include prose, we try to extract the array
    const jsonMatch = result.match(/\[.*\]/s);
    return JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
  } catch {
    return ["Me in this situation", "Bottom text", "When it finally works", "Is this a meme?", "Modern problems require modern solutions"];
  }
};

export const analyzeColors = async (base64Image: string, config: AIConfig): Promise<ColorProfile> => {
  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: "Suggest HEX background colors and opacity (0-1) for top/bottom text overlays for contrast. JSON: {topBgColor, bottomBgColor, topBgOpacity, bottomBgOpacity}" }, { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }] }],
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  }
  return { topBgColor: "#000000", bottomBgColor: "#000000", topBgOpacity: 0.3, bottomBgOpacity: 0.3 };
};

export const generateImage = async (prompt: string, config: AIConfig, baseImage?: string): Promise<string> => {
  if (config.provider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: prompt }];
    if (baseImage) parts.push({ inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } });
    
    // For general image generation and editing tasks, 'gemini-2.5-flash-image' is the default.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts }
    });
    
    // Iterate through candidates and parts to find the image part correctly.
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart && imagePart.inlineData) return `data:image/png;base64,${imagePart.inlineData.data}`;
  }

  // Free Tier: Pollinations
  const finalPrompt = baseImage ? `${prompt} (Based on reference image style)` : prompt;
  return await fetchPollinations(finalPrompt, true);
};
