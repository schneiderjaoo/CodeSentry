import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

export async function analyzeSemantics(parsedInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Você é um assistente especializado em engenharia de software. Classifique semanticamente o conteúdo abaixo:

"${parsedInput.content}"

Categorias possíveis:
- Correção de Bug
- Nova Funcionalidade
- Documentação
- Melhoria de Estilo
- Refatoração
- Outro

Responda apenas com o nome da categoria.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return {
    classification: response.text().trim(),
    raw: parsedInput.content
  };
}
