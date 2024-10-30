import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAJX0A1MUJ0DuOMzG2SIOKm0yJ-N8kScDI");

export const GeminiService = {
  async getCropMarketAnalysis(cropName) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        Analyze market conditions for ${cropName} farming in Karnataka, India.
        Return a JSON object with the following structure (pure JSON only):
        {
          "priceHistory": [
            {"month": "string", "price": number}
          ],
          "currentSupply": number,
          "marketDemand": number,
          "projectedSupply": number,
          "risks": [
            {"factor": "string", "score": number}
          ],
          "recommendationScore": number,
          "recommendations": [
            {"type": "string", "message": "string"}
          ]
        }
      `;

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
      throw new Error('Unable to generate market analysis');
    }
  },

  async getDistrictCropAnalysis(cropName, district) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        Analyze agricultural conditions and market potential for ${cropName} in ${district} district, Karnataka, India.
        Consider local climate, soil types, rainfall patterns, and market access.
        Return a JSON object with the following structure (pure JSON only):
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
          "viabilityScore": number (between 0-10),
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
        }
      `;

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

  async getPlantAnalysis(cropType, weatherData) {
    try {
      // Here we'll return mock data since we don't have actual AI integration
      // In a real application, you would make an API call to an AI service
      return {
        suitability: `Based on current weather conditions, ${cropType} growing conditions are favorable. Temperature and humidity levels are within optimal range.`,
        growthStage: `${cropType} planted during this season typically enters vegetative growth phase. Monitor leaf development and stem strength.`,
        risks: `Watch for potential fungal diseases due to current humidity levels. Protect plants from strong winds.`,
        care: `Maintain consistent watering schedule. Apply mulch to retain moisture and regulate soil temperature.`,
        milestones: `Expected germination within 7-10 days. First flowers should appear in 4-6 weeks under current conditions.`,
        pestManagement: `Regular inspection recommended. Use organic pest control methods when temperature is between 20-25°C.`,
        irrigation: `Water deeply 2-3 times per week. Adjust based on rainfall and humidity levels.`,
        soilManagement: `Maintain well-draining soil. Add organic matter to improve soil structure and nutrient content.`
      };
    } catch (error) {
      console.error('Error in plant analysis:', error);
      throw new Error('Unable to analyze plant conditions');
    }
  },

  // Quick initial analysis
  async getQuickMarketAnalysis(cropName) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        Provide a quick supply-demand analysis for ${cropName} farming in Karnataka.
        Return a JSON array with exactly 3 seasons of data in this format:
        [
          {
            "season": "string",
            "supply": number,
            "demand": number,
            "priceImpact": "string"
          }
        ]
        Keep the analysis focused and concise.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      console.error('Quick Analysis Error:', error);
      throw new Error('Unable to generate quick analysis');
    }
  },

  // Detailed analysis (can be loaded later)
  async getDetailedAnalysis(cropName, district) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        Analyze agricultural conditions and market potential for ${cropName} in ${district} district, Karnataka, India.
        Consider local climate, soil types, rainfall patterns, and market access.
        Return a JSON object with the following structure (pure JSON only):
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
          "viabilityScore": number (between 0-10),
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
        }
      `;

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
  }
}; 