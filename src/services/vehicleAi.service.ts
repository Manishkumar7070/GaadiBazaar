import { Vehicle } from "../types";

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

export const vehicleAiService = {
  async getVehicleInsights(vehicle: Vehicle): Promise<VehicleAnalysis> {
    const defaultResponse: VehicleAnalysis = {
      insights: [
        {
          type: 'price',
          title: 'AI Analysis Unavailable',
          message: 'Unable to analyze vehicle at this time. Please try again later.',
          severity: 'info'
        }
      ],
      estimation: {
        minPrice: vehicle.price * 0.9,
        maxPrice: vehicle.price * 1.1,
        confidence: 50,
        reasoning: "Based strictly on listing price due to AI connectivity issue."
      }
    };

    try {
      const response = await fetch('/api/ai/vehicle-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vehicle }),
      });

      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching vehicle AI insights:", error);
      return defaultResponse;
    }
  }
};
