
import { GoogleGenAI } from "@google/genai";

export async function getMarketInsights(
  symbol: string,
  price: number,
  day: number,
  history: any[]
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const lastMoves = history.slice(-5).map(h => `${h.changePercent.toFixed(1)}%`).join(", ");
    
    const prompt = `
      Act as a Wall Street quant trader. 
      Analyze the current state of our simulation for ${symbol}.
      - Current Price: $${price.toFixed(2)}
      - Day in simulation: ${day}
      - Recent daily price movements: ${lastMoves}
      
      Explain in 2-3 short sentences how these movements and the passage of time are affecting the "Greeks" (specifically Delta and Theta) of the options.
      Focus on how the passage of time is eating away extrinsic value.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The market is reacting to current price volatility and time decay. Keep an eye on Theta as expiration nears.";
  }
}
