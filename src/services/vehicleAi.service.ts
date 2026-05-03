import { GoogleGenAI, Type } from "@google/genai";
import { Vehicle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface VehicleAIInsight {
  type: 'condition' | 'price' | 'value' | 'maintenance' | 'visual';
  title: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export interface VehicleAnalysis {
  insights: VehicleAIInsight[];
  estimation: {
    minPrice: number;
    maxPrice: number;
    confidence: number;
    reasoning: string;
  };
  visualAnalysis?: {
    identifiedIssues: string[];
    conditionScore: number; // 0-100
  };
}

const imageUrlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip the data:image/jpeg;base64, prefix
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Failed to convert image to base64:", error);
    return null;
  }
};

export const vehicleAiService = {
  async getVehicleInsights(vehicle: Vehicle): Promise<VehicleAnalysis> {
    const defaultResponse: VehicleAnalysis = {
      insights: [
        {
          type: 'price',
          title: 'AI Analysis Unavailable',
          message: 'Configure AI for detailed visual and price analysis.',
          severity: 'info'
        }
      ],
      estimation: {
        minPrice: vehicle.price * 0.9,
        maxPrice: vehicle.price * 1.1,
        confidence: 50,
        reasoning: "Based strictly on listing price due to AI configuration."
      }
    };

    if (!process.env.GEMINI_API_KEY) return defaultResponse;

    try {
      // Prepare image parts if available (limit to 3 for performance/cost)
      const imageParts = [];
      if (vehicle.images && vehicle.images.length > 0) {
        const imagesToProcess = vehicle.images.slice(0, 3);
        const base64Images = await Promise.all(imagesToProcess.map(img => imageUrlToBase64(img)));
        
        for (const base64 of base64Images) {
          if (base64) {
            imageParts.push({
              inlineData: {
                data: base64,
                mimeType: "image/jpeg"
              }
            });
          }
        }
      }

      const prompt = `Analyze this vehicle listing.
      Text Details:
      - Title: ${vehicle.title}
      - Vehicle: ${vehicle.year} ${vehicle.brand} ${vehicle.model}
      - Price: ₹${vehicle.price}
      - Km Driven: ${vehicle.kilometersDriven}
      - Ownership: ${vehicle.ownership}
      - Fuel: ${vehicle.fuelType}
      - Description: ${vehicle.description}
      
      Tasks:
      1. Analyze any provided images to detect visible condition, wear-and-tear, or potential issues (paint quality, dents, tire wear if visible).
      2. Compare the price with the vehicle's age, mileage, and model popularity.
      3. Provide a market value estimation range.
      4. Give 3-4 specific insights.

      Return ONLY a JSON object with this exact structure:
      {
        "insights": [{"type": "condition|price|value|maintenance|visual", "title": "string", "message": "string", "severity": "success|info|warning|error"}],
        "estimation": {"minPrice": number, "maxPrice": number, "confidence": number, "reasoning": "string"},
        "visualAnalysis": {"identifiedIssues": ["string"], "conditionScore": number}
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: imageParts.length > 0 ? 
          { parts: [...imageParts, { text: prompt }] } : 
          prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    message: { type: Type.STRING },
                    severity: { type: Type.STRING }
                  },
                  required: ["type", "title", "message", "severity"]
                }
              },
              estimation: {
                type: Type.OBJECT,
                properties: {
                  minPrice: { type: Type.NUMBER },
                  maxPrice: { type: Type.NUMBER },
                  confidence: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["minPrice", "maxPrice", "confidence", "reasoning"]
              },
              visualAnalysis: {
                type: Type.OBJECT,
                properties: {
                  identifiedIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
                  conditionScore: { type: Type.NUMBER }
                }
              }
            },
            required: ["insights", "estimation"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Error fetching vehicle AI insights:", error);
      return defaultResponse;
    }
  }
};
