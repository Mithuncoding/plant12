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
  },

  async getPlantAnalysis(cropName, weatherData) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Analyze the growing conditions for ${cropName} based on the following weather data:
        Temperature: ${weatherData.current.temp_c}°C
        Humidity: ${weatherData.current.humidity}%
        Wind Speed: ${weatherData.current.wind_kph} km/h
        Weather Condition: ${weatherData.current.condition.text}
        
        Return a JSON object with string values (not nested objects) for each field:
        {
          "suitability": "Overall suitability assessment as a single string",
          "growthStage": "Current recommended growth stage",
          "risks": "List of risks separated by semicolons",
          "care": "Care instructions as a single string",
          "milestones": "Growth milestones as a single string",
          "pestManagement": "Pest management advice as a single string",
          "irrigation": "Irrigation recommendations as a single string",
          "soilManagement": "Soil management advice as a single string"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Ensure all values are strings
      Object.keys(parsedData).forEach(key => {
        if (typeof parsedData[key] === 'object') {
          parsedData[key] = Object.entries(parsedData[key])
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
        }
      });
      
      return parsedData;
    } catch (error) {
      console.error('Plant Analysis Error:', error);
      throw new Error('Unable to analyze plant conditions');
    }
  }
}; 