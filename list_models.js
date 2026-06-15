import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const list = await ai.models.list();
    const models = list.pageInternal || [];
    
    console.log("Gemini models available for this key:");
    models.forEach(m => {
      if (m.name && m.name.toLowerCase().includes('gemini')) {
        console.log(`- ${m.name} (${m.displayName || ''})`);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

main();
