import express from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import rateLimit from 'express-rate-limit';
import { serverLogger } from '../logger';
import { rateLimitHandler } from '../middleware/rate-limit-monitor';

const router = express.Router();

// Anti-abuse: Rate limit AI-powered features to prevent billing exploitation of Gemini endpoints
const aiGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 Gemini generation queries per IP per 15 minutes
  message: { error: "Too many AI generation requests. Please wait before asking for more insights." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const fetchImageAsBase64 = async (url: string): Promise<{ data: string; mimeType: string } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      data: buffer.toString('base64'),
      mimeType: mimeType
    };
  } catch (error) {
    serverLogger.warn(`Failed to fetch image for AI: ${url}`, { error });
    return null;
  }
};

router.post("/vehicle-insights", aiGenerationLimiter, async (req, res) => {
  const { vehicle } = req.body;

  if (!vehicle) {
    return res.status(400).json({ error: "Vehicle data is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI Service not configured" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare content parts
    const parts: any[] = [];
    
    // Add vehicle details as text
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
      2. Compare the price with the vehicle's age, mileage, and model popularity in the Indian market.
      3. Provide a market value estimation range.
      4. Give 3-4 specific insights.

      Return ONLY a JSON object with this exact structure:
      {
        "insights": [{"type": "condition|price|value|maintenance|visual", "title": "string", "message": "string", "severity": "success|info|warning|error"}],
        "estimation": {"minPrice": number, "maxPrice": number, "confidence": number, "reasoning": "string"},
        "visualAnalysis": {"identifiedIssues": ["string"], "conditionScore": number}
      }`;

    parts.push({ text: prompt });

    // Add images if available
    if (vehicle.images && vehicle.images.length > 0) {
      const imagesToProcess = vehicle.images.slice(0, 3);
      const imageData = await Promise.all(imagesToProcess.map(img => fetchImageAsBase64(img)));
      
      for (const img of imageData) {
        if (img) {
          parts.push({
            inlineData: {
              data: img.data,
              mimeType: img.mimeType
            }
          });
        }
      }
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Clean up response text in case Gemini adds markdown blocks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    serverLogger.error("Error generating AI insights", { error: error.message });
    res.status(500).json({ error: "Failed to generate AI insights" });
  }
});

export default router;
