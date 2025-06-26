import { parseGitDiff } from "./parserAgent.js";
import { analyzeSemantics } from "./analyzerAgent.js";

export async function runAgenticPipeline(gitDiff) {
  const parsed = await parseGitDiff(gitDiff);
  const semanticResult = await analyzeSemantics(parsed);

  return {
    semanticResult
  };
}
