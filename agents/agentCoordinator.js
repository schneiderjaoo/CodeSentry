import { parseGitDiff, indexCodebase } from "./parserAgent.js";
import { analyzeSemantics } from "./analyzerAgent.js";
import { detectPatterns, indexPatterns } from "./patternDetectorAgent.js";
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
  const context = await retrieveContext(parsed);
  
  // Adiciona o contexto ao objeto parsed
  parsed.context = context;

  return {
    semanticResult,
    patterns,
    context: parsed.context,
    ragEnabled: true,
    stats: {
      filesAnalyzed: parsed.files.length,
      ragEnhanced: parsed.files.filter(f => f.ragContext?.hasContext).length
    }
  };
}

export async function initializeRAG() {
  console.log("Initializing Simple RAG knowledge base...");
  
  try {
    // Indexa a base de código atual
    await indexCodebase('./');
    
    // Indexa padrões (placeholder por enquanto)
    await indexPatterns();
    
    console.log("Simple RAG initialization completed successfully");
  } catch (error) {
    console.error("Error initializing RAG:", error);
    // Não falha completamente se RAG não funcionar
    console.log("Continuing without RAG enhancement...");
  }
}
