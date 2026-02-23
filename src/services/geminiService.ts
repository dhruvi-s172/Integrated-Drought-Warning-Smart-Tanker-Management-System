import { GoogleGenAI } from "@google/genai";

export async function getChatResponse(message: string, context: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Gemini API key is not configured. Please add it to your environment variables.";
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are the JalSetu AI Assistant, a specialized GovTech decision support system for drought management in India.
    You have access to real-time data about villages, water stress indices (WSI), rainfall deviation, and tanker fleet status.
    
    Current Context:
    ${JSON.stringify(context)}
    
    Guidelines:
    1. Be professional, data-driven, and helpful to government officials.
    2. Use terms like "Block", "District", "Gram Panchayat" appropriately.
    3. Provide actionable recommendations (e.g., "Deploy 2 tankers to Village X due to 90% WSI").
    4. If asked about predictions, explain the reasoning (e.g., "Based on groundwater depletion velocity of -2.1m/year").
    5. Keep responses concise and formatted with markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I encountered an error while processing your request. Please try again.";
  }
}
