
import { GoogleGenAI, Type } from "@google/genai";

// Use 'gemini-3-flash-preview' for text-based analysis and 'gemini-2.5-flash-image' for image editing as per guidelines.
const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const EDIT_MODEL = 'gemini-2.5-flash-image';

export interface ColorProfile {
  topBgColor: string;
  bottomBgColor: string;
  topBgOpacity: number;
  bottomBgOpacity: number;
}

export const getMagicCaptions = async (base64Image: string): Promise<string[]> => {
  // Always use process.env.API_KEY and named parameter for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: [
      {
        parts: [
          {
            text: "You are a professional meme creator. Analyze this image and generate 5 funny, sarcastic, and contextually relevant meme captions. Each caption should be suitable for either the top or bottom of a meme. Return a list of 5 creative captions."
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1]
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        },
        description: "An array of 5 meme captions"
      }
    }
  });

  try {
    // response.text is a getter property, do not call it as a method
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return ["Me when I realize the code works", "Standard Monday morning", "When the pizza arrives early", "Processing...", "System Error: Too much cool"];
  }
};

export const getAdaptiveColorProfile = async (base64Image: string): Promise<ColorProfile> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: [
      {
        parts: [
          {
            text: "Analyze this image and suggest the best background colors for text overlays at the top and bottom to ensure maximum readability. If the area is dark, suggest a light color with low opacity. If the area is light, suggest a dark color. Return a JSON object with topBgColor, bottomBgColor (hex), and topBgOpacity, bottomBgOpacity (0.0 to 1.0)."
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1]
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topBgColor: { type: Type.STRING },
          bottomBgColor: { type: Type.STRING },
          topBgOpacity: { type: Type.NUMBER },
          bottomBgOpacity: { type: Type.NUMBER },
        },
        required: ["topBgColor", "bottomBgColor", "topBgOpacity", "bottomBgOpacity"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as ColorProfile;
  } catch (e) {
    return { topBgColor: "#000000", bottomBgColor: "#000000", topBgOpacity: 0.4, bottomBgOpacity: 0.4 };
  }
};

export const editImageWithAI = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: EDIT_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/png',
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    // Find the image part in response candidates parts
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image returned from AI edit");
};

export const applyStyleTransfer = async (
  base64BaseImage: string, 
  stylePrompt: string, 
  base64StyleReference?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [
    {
      inlineData: {
        data: base64BaseImage.split(',')[1],
        mimeType: 'image/png',
      },
    }
  ];

  if (base64StyleReference) {
    parts.push({
      inlineData: {
        data: base64StyleReference.split(',')[1],
        mimeType: 'image/png',
      },
    });
    parts.push({
      text: `Style Transfer Task: Transfer the artistic style, color palette, lighting, and textures of the SECOND image onto the FIRST image. Ensure the content of the first image remains recognizable. Additional instruction: ${stylePrompt}`
    });
  } else {
    parts.push({
      text: `Artistic Transformation: Reimagine the following image in the artistic style of: ${stylePrompt}. Maintain the core composition but fully adopt the aesthetic characteristics of the requested style.`
    });
  }

  const response = await ai.models.generateContent({
    model: EDIT_MODEL,
    contents: { parts },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Style transfer returned no data");
};
