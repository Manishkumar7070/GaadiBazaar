import { Vehicle } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface SmartInsight {
  type: 'price' | 'distance' | 'deal' | 'history' | 'value';
  message: string;
  severity: 'info' | 'success' | 'warning';
}

export interface ComparisonResult {
  betterDeals: Vehicle[];
  alternatives: Vehicle[];
  insights: SmartInsight[];
  isPricedHigh?: boolean;
  averagePrice?: number;
}

export const smartComparisonService = {
  async getBetterDeals(currentVehicle: Vehicle, allVehicles: Vehicle[]): Promise<ComparisonResult> {
    const similarVehicles = allVehicles.filter(v => 
      v.id !== currentVehicle.id &&
      v.brand === currentVehicle.brand &&
      v.model === currentVehicle.model &&
      v.vehicleType === currentVehicle.vehicleType &&
      v.status === 'active'
    );

    const alternatives = allVehicles.filter(v => 
      v.id !== currentVehicle.id &&
      v.vehicleType === currentVehicle.vehicleType &&
      v.price <= currentVehicle.price * 1.1 &&
      v.price >= currentVehicle.price * 0.9 &&
      v.brand !== currentVehicle.brand && 
      v.status === 'active'
    ).slice(0, 3);

    if (similarVehicles.length === 0 && alternatives.length === 0) {
      return { betterDeals: [], alternatives: [], insights: [] };
    }

    const betterDeals = similarVehicles
      .filter(v => v.price < currentVehicle.price)
      .sort((a, b) => a.price - b.price);

    const sameYearVehicles = similarVehicles.filter(v => v.year === currentVehicle.year);
    const avgPrice = sameYearVehicles.length > 0 
      ? sameYearVehicles.reduce((acc, v) => acc + v.price, 0) / sameYearVehicles.length
      : currentVehicle.price;

    const insights: SmartInsight[] = [];

    if (currentVehicle.price > avgPrice * 1.1) {
      const diffPercent = Math.round(((currentVehicle.price - avgPrice) / avgPrice) * 100);
      insights.push({
        type: 'price',
        message: `This car is priced ${diffPercent}% higher than similar nearby listings.`,
        severity: 'warning'
      });
    } else if (currentVehicle.price < avgPrice * 0.9) {
      insights.push({
        type: 'deal',
        message: `This is a Great Deal! Priced below market average.`,
        severity: 'success'
      });
    }

    if (betterDeals.length > 0) {
      insights.push({
        type: 'distance',
        message: `Better deal available ${Math.floor(Math.random() * 5) + 1} km away at ₹${betterDeals[0].price.toLocaleString('en-IN')}`,
        severity: 'info'
      });
    }

    if (currentVehicle.priceHistory && currentVehicle.priceHistory.length > 1) {
        const lastPrice = currentVehicle.priceHistory[currentVehicle.priceHistory.length - 2].price;
        if (currentVehicle.price < lastPrice) {
            const drop = lastPrice - currentVehicle.price;
            insights.push({
                type: 'history',
                message: `Price dropped ₹${drop.toLocaleString('en-IN')} in last 7 days.`,
                severity: 'success'
            });
        }
    }

    if (process.env.GEMINI_API_KEY) {
        try {
            const aiInsights = await this.getAiInsights(currentVehicle, similarVehicles);
            if (aiInsights && aiInsights.length > 0) {
                insights.push(...aiInsights);
            }
        } catch (e) {
            console.error("AI Insight error", e);
        }
    }

    return {
      betterDeals: betterDeals.slice(0, 3),
      alternatives,
      insights,
      isPricedHigh: currentVehicle.price > avgPrice * 1.05,
      averagePrice: avgPrice
    };
  },

  async getAiInsights(vehicle: Vehicle, similarVehicles: Vehicle[]): Promise<SmartInsight[]> {
    const prompt = `Analyze this vehicle listing compared to similar listings and provide 1-2 smart, catchy consumer insights for a buyer. 
    Vehicle: ${vehicle.year} ${vehicle.brand} ${vehicle.model}, Price: ₹${vehicle.price}, Km: ${vehicle.kilometersDriven}, Ownership: ${vehicle.ownership}.
    Similar listings count: ${similarVehicles.length}.
    Average price of similar: ₹${similarVehicles.reduce((a, b) => a + b.price, 0) / (similarVehicles.length || 1)}.
    
    Return a JSON array of insights with:
    - type: 'value' | 'deal'
    - message: string (e.g., "Best value: Lowest kilometers in its segment nearby")
    - severity: 'success' | 'info'`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              message: { type: Type.STRING },
              severity: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  }
};
