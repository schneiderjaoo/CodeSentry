// Monta o prompt para an�lise de c�digo com base em c�digo + contexto (opcional).
// @param {string} code - C�digo do git diff.
// @param {string} context - (Opcional) Documenta��o ou hist�rico relevante.
/**
 * Monta o prompt para an�lise de c�digo com base em c�digo + contexto (opcional).
 * @param {string} code - C�digo do git diff.
 * @param {string} context - (Opcional) Documenta��o ou hist�rico relevante.
 * @returns {string} Prompt final.
 */
export function buildPrompt(code, context = "") {
  return `
Voc� � um assistente especializado em engenharia de software.

Analise o c�digo a seguir. Identifique poss�veis **problemas de codifica��o** e ofere�a **sugest�es de melhorias**.

${context ? `\n?? Contexto adicional:\n${context}` : ""}

?? C�digo:
"""
${code}
"""

Responda com uma explica��o clara, em linguagem natural, sem usar JSON.
Se n�o houver problemas, apenas diga que o c�digo parece bom.
`;
}
