import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generatePecsImage = async (prompt: string): Promise<string | null> => {
  if (!process.env.API_KEY) {
    console.warn("Missing API_KEY for Gemini");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using the instructed model for image generation
      contents: {
        parts: [
          {
            text: `Create a simple, clear, high-contrast illustration suitable for a PECS (Picture Exchange Communication System) board. 
            The image should represent: "${prompt}". 
            Style: Cartoon-like, thick outlines, white background, no text in the image itself.`,
          },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    // Handle response parts to find image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const suggestLabel = async (base64Image: string): Promise<string> => {
  if (!process.env.API_KEY) return "New Card";
  
  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png' // Assuming PNG for simplicity or extracted from prefix
            }
          },
          {
            text: "What is the single most simple noun or verb that describes this image? Return ONLY the word."
          }
        ]
      }
     });
     return response.text?.trim() || "Card";
  } catch (e) {
    return "Card";
  }
}
