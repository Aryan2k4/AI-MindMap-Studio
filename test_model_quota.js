import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Say 'hello'",
    });
    console.log(`[OK] ${modelName} - Response: "${response.text.trim()}"`);
    return true;
  } catch (error) {
    // Just log the message summary
    const msg = error.message.includes("Quota exceeded") ? "Quota Exceeded (Limit 0)" : error.message;
    console.log(`[FAIL] ${modelName} - Error: ${msg.split('\n')[0]}`);
    return false;
  }
}

async function main() {
  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest',
    'gemini-pro-latest'
  ];
  console.log("Testing model quotas...");
  for (const m of models) {
    await testModel(m);
  }
}

main();
