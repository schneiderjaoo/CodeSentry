import { parseGitDiff } from "./parserAgent.js";
import { analyzeSemantics } from "./analyzerAgent.js";
import { detectPatterns } from "./patternDetectorAgent.js";

export async function runAgenticPipeline(gitDiff) {
  const parsed = await parseGitDiff(gitDiff);
  const semanticResult = await analyzeSemantics(parsed);
  const patterns = await detectPatterns(parsed);

  return {
    semanticResult,
    patterns
  };
}
