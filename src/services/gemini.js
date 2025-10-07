import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const generativeModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function* streamGemini(prompt) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await generativeModel.generateContentStream(prompt);
            for await (const chunk of result.stream) {
                yield chunk.text();
            }
            return;
        } catch (error) {
            console.error(`Attempt ${attempt} of ${maxRetries} failed:`, error);
            if (attempt === maxRetries) {
                yield "Server Down: Please Try Again Later.";
                return;
            }
            await sleep(1000);
        }
    }
    console.error("Unexpected error in streamGemini");
    
}
