import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

export async function analyzeSemantics(parsedInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
  Você é um assistente especializado em engenharia de software.

  Com base no código abaixo, responda com sugestões e problemas detectados.

  Código para analisar:
  """
  ${parsedInput.content}
  """
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return {
    classificacao: "Análise de Código",
    resposta: text
  };
}
