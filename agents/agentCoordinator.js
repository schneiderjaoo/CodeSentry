import { parseGitDiff } from "./parserAgent.js";
import { analyzeSemantics } from "./analyzerAgent.js";
import { detectPatterns } from "./patternDetectorAgent.js";
import { retrieveContext } from "./retrieverAgent.js";

export async function runAgenticPipeline(gitDiff) {
  const parsed = await parseGitDiff(gitDiff);

  // Verifica se o resultado do parse contém arquivos válidos
  if (!parsed || !parsed.files || parsed.files.length === 0) {
    throw new Error("No valid files found in the git diff.");
  }
  
  // Roda os agentes com o contexto incluso
  const semanticResult = await analyzeSemantics(parsed);
  const patterns = await detectPatterns(parsed);

  // Recupera o contexto relevante para os arquivos analisados
  const context = await retrieveContext(parsed);

  // Adiciona o contexto ao objeto parsed
  parsed.context = context;

  return {
    semanticResult,
    patterns,
    context: parsed.context
  };
}
