import { GoogleGenAI, Type } from "@google/genai";
import { SearchFilters, VehicleType, FuelType, TransmissionType, OwnershipType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AISearchResult {
  filters: Partial<SearchFilters>;
  normalizedQuery: string;
}

export const aiSearchService = {
  async parseNaturalLanguageQuery(query: string): Promise<AISearchResult> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. AI search will not work accurately.");
      return { filters: {}, normalizedQuery: query };
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse the following user search query for a vehicle marketplace into a structured JSON object.
        
        Available filter fields and their possible values:
        - vehicleType: 'car' | 'bike' | 'scooter' | 'commercial'
        - brand: string (e.g., 'Maruti Suzuki', 'Honda', 'Royal Enfield')
        - model: string (e.g., 'Swift', 'City', 'Classic 350')
        - minPrice: number
        - maxPrice: number
        - minYear: number
        - maxYear: number
        - minKm: number
        - maxKm: number
        - fuelType: 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid'
        - transmission: 'manual' | 'automatic' | 'semi-automatic'
        - ownership: '1st' | '2nd' | '3rd' | '4th' | '4th+'
        - city: string
        - state: string

        Rules:
        1. If a field is not mentioned, do not include it.
        2. 'red Maruti Swift' -> brand: 'Maruti Suzuki', model: 'Swift', normalizedQuery: 'red Maruti Swift'
        3. 'low mileage' -> maxKm: 30000
        4. 'fuel efficient' -> model/description implies it? No, just keep as normalizedQuery.
        5. 'automatic' -> transmission: 'automatic'
        6. 'under 5 lakhs' -> maxPrice: 500000
        7. 'first owner' -> ownership: '1st'
        
        The normalizedQuery should be a cleaned version of the input query that can be used for secondary text matching.

        Query: "${query}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              filters: {
                type: Type.OBJECT,
                properties: {
                  vehicleType: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  model: { type: Type.STRING },
                  minPrice: { type: Type.NUMBER },
                  maxPrice: { type: Type.NUMBER },
                  minYear: { type: Type.NUMBER },
                  maxYear: { type: Type.NUMBER },
                  minKm: { type: Type.NUMBER },
                  maxKm: { type: Type.NUMBER },
                  fuelType: { type: Type.STRING },
                  transmission: { type: Type.STRING },
                  ownership: { type: Type.STRING },
                  city: { type: Type.STRING },
                  state: { type: Type.STRING },
                }
              },
              normalizedQuery: { type: Type.STRING }
            },
            required: ["filters", "normalizedQuery"]
          }
        }
      });

      const result = JSON.parse(response.text);
      return result;
    } catch (error) {
      console.error("Error parsing query with AI:", error);
      return { filters: {}, normalizedQuery: query };
    }
  }
};
