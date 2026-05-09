import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const aiPredictionService = {
  async predictPrice(vehicle: {
    brand: string;
    model: string;
    year: number;
    kilometers_driven: number;
    fuel_type: string;
    transmission: string;
    condition?: string;
  }) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      logger.warn('Gemini API key missing, using fallback price prediction');
      return this.fallbackPrediction(vehicle);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `As an expert used car market analyst in India, predict the fair market price range for this vehicle:
      Brand: ${vehicle.brand}
      Model: ${vehicle.model}
      Year: ${vehicle.year}
      KM Driven: ${vehicle.kilometers_driven}
      Fuel: ${vehicle.fuel_type}
      Transmission: ${vehicle.transmission}
      
      Return ONLY a JSON object with this format:
      {
        "estimatedPrice": number,
        "rangeMin": number,
        "rangeMax": number,
        "confidence": number,
        "reasoning": string
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Basic JSON extraction if Gemini wraps it in code blocks
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      logger.error('Error predicting price with AI:', { data: error });
      return this.fallbackPrediction(vehicle);
    }
  },

  fallbackPrediction(vehicle: any) {
    // Simple rule-based fallback
    const basePrice = 500000; // placeholder base
    const age = new Date().getFullYear() - vehicle.year;
    const depreciation = Math.pow(0.9, age);
    const kmImpact = Math.max(0.7, 1 - (vehicle.kilometers_driven / 200000));
    
    const estimate = Math.round(basePrice * depreciation * kmImpact);
    
    return {
      estimatedPrice: estimate,
      rangeMin: Math.round(estimate * 0.9),
      rangeMax: Math.round(estimate * 1.1),
      confidence: 60,
      reasoning: "Calculated based on standard depreciation models for the Indian market."
    };
  }
};
