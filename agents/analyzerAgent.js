// agents/analyzerAgent.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { buildPrompt } from "./promptBuilder.js";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

export async function analyzeSemantics(parsedInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = buildPrompt(parsedInput.content, parsedInput.context || "");

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return {
    classificacao: "Outro",
    melhorias: [response.text().trim()]
  };
}
