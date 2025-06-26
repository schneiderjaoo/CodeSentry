import { parseGitDiff } from "./parserAgent.js";
import { analyzeSemantics } from "./analyzerAgent.js";
import { detectPatterns } from "./patternDetectorAgent.js";
import { retrieverAgent } from "./retrieverAgent.js";

export async function runAgenticPipeline(gitDiff) {
  const parsed = await parseGitDiff(gitDiff);

  // Verifica se o resultado do parse contém arquivos válidos
  if (!parsed || !parsed.files || parsed.files.length === 0) {
    throw new Error("No valid files found in the git diff.");
  }
  // Mandando o resultado do parse para os outros agentes
  // para análise semântica e detecção de padrões
  const semanticResult = await analyzeSemantics(parsed);
  const patterns = await detectPatterns(parsed);
  const context = await retrieverAgent(parsed);

  return {
    semanticResult,
    patterns,
    context
  };
}
