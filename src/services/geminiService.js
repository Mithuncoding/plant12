import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI('AIzaSyAJX0A1MUJ0DuOMzG2SIOKm0yJ-N8kScDI');

export const GeminiService = {
  async getDistrictCropAnalysis(cropName, district) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Analyze agricultural conditions and market potential for ${cropName} in ${district} district, Karnataka, India.
        Consider local climate, soil types, rainfall patterns, and market access.
        Return ONLY a JSON object with this structure:
        {
          "priceHistory": [
            {"month": "string", "price": number}
          ],
          "districtComparison": [
            {"district": "string", "production": number}
          ],
          "seasonalAnalysis": {
            "kharif": number,
            "rabi": number,
            "summer": number
          },
          "districtStats": {
            "majorAreas": ["string"],
            "soilTypes": ["string"],
            "avgRainfall": number
          },
          "viabilityScore": number,
          "marketPotential": "string",
          "waterRequirements": "string",
          "climateSuitability": "string",
          "recommendations": [
            {
              "type": "string",
              "title": "string",
              "message": "string"
            }
          ]
        }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Unable to generate district analysis');
    }
  },

  async getQuickMarketAnalysis(cropName) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Provide a quick market analysis for ${cropName} farming in Karnataka.
        Return ONLY a JSON array with this structure:
        [
          {
            "season": "string",
            "supply": number,
            "demand": number
          }
        ]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Quick Analysis Error:', error);
      return null;
    }
  }
}; 