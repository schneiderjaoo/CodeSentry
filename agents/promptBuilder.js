// Monta o prompt para análise de código com base em código + contexto (opcional).
// @param {string} code - Código do git diff.
// @param {string} context - (Opcional) Documentação ou histórico relevante.
/**
 * Monta o prompt para análise de código com base em código + contexto (opcional).
 * @param {string} code - Código do git diff.
 * @param {string} context - (Opcional) Documentação ou histórico relevante.
 * @returns {string} Prompt final.
 */
export function buildPrompt(code, context = "") {
  return `
Você é um assistente especializado em engenharia de software.

Analise o código a seguir. Identifique possíveis **problemas de codificação** e ofereça **sugestões de melhorias**.

${context ? `\n?? Contexto adicional:\n${context}` : ""}

?? Código:
"""
${code}
"""

Responda com uma explicação clara, em linguagem natural, sem usar JSON.
Se não houver problemas, apenas diga que o código parece bom.
`;
}
