import { parseGitDiff, indexCodebase } from "./parserAgent.js";
import { analyzeSemantics } from "./analyzerAgent.js";
import { detectPatterns, indexPatterns } from "./patternDetectorAgent.js";
import { retrieveContext } from "./retrieverAgent.js";
import CommitClassifierAgent from "./commitClassifierAgent.js";
import RefactoringAnalyzerAgent from "./refactoringAnalyzerAgent.js";
import AdvancedRAG from "./advancedRAG.js";

// Instâncias globais dos agentes
let commitClassifier = null;
let refactoringAnalyzer = null;
let advancedRAG = null;

export async function runAgenticPipeline(gitDiff, commitMessage = '', commitHash = '') {
  const parsed = await parseGitDiff(gitDiff);

  // Verifica se o resultado do parse contém arquivos válidos
  if (!parsed || !parsed.files || parsed.files.length === 0) {
    throw new Error("No valid files found in the git diff.");
  }
  
  // Inicializar agentes se necessário
  await initializeAgents();
  
  // Executar análises em paralelo
  const [
    semanticResult,
    patterns,
    context,
    commitAnalysis,
    refactoringAnalysis
  ] = await Promise.all([
    analyzeSemantics(parsed),
    detectPatterns(parsed),
    retrieveContext(parsed),
    commitClassifier.classifyCommit(gitDiff, commitMessage, commitHash),
    refactoringAnalyzer.analyzeRefactoring(gitDiff)
  ]);
  
  // Adiciona o contexto ao objeto parsed
  parsed.context = context;

  return {
    semanticResult,
    patterns,
    context: parsed.context,
    commitAnalysis,
    refactoringAnalysis,
    ragEnabled: true,
    stats: {
      filesAnalyzed: parsed.files.length,
      ragEnhanced: parsed.files.filter(f => f.ragContext?.hasContext).length,
      commitType: commitAnalysis.classification,
      refactoringType: refactoringAnalysis.refactoringType,
      confidence: refactoringAnalysis.confidence
    }
  };
}

async function initializeAgents() {
  if (!commitClassifier) {
    commitClassifier = new CommitClassifierAgent();
    await commitClassifier.initialize();
  }
  
  if (!refactoringAnalyzer) {
    refactoringAnalyzer = new RefactoringAnalyzerAgent();
    await refactoringAnalyzer.initialize();
  }
  
  if (!advancedRAG) {
    advancedRAG = new AdvancedRAG();
    await advancedRAG.initialize();
  }
}

export async function initializeRAG() {
  console.log("Initializing Advanced RAG knowledge base...");
  
  try {
    // Inicializar agentes
    await initializeAgents();
    
    // Indexa a base de código atual
    await indexCodebase('./');
    
    // Indexa padrões
    await indexPatterns();
    
    console.log("Advanced RAG initialization completed successfully");
  } catch (error) {
    console.error("Error initializing RAG:", error);
    console.log("Continuing without RAG enhancement...");
  }
}

// Novas funções para análise específica
export async function analyzeCommit(gitDiff, commitMessage = '', commitHash = '') {
  await initializeAgents();
  return await commitClassifier.classifyCommit(gitDiff, commitMessage, commitHash);
}

export async function analyzeRefactoring(gitDiff, beforeCode = '', afterCode = '') {
  await initializeAgents();
  return await refactoringAnalyzer.analyzeRefactoring(gitDiff, beforeCode, afterCode);
}

export async function getCommitHistory(limit = 10) {
  await initializeAgents();
  return await commitClassifier.getCommitHistory(limit);
}

export async function getCommitStats() {
  await initializeAgents();
  return await commitClassifier.getCommitStats();
}

export async function getRefactoringStats() {
  await initializeAgents();
  return await refactoringAnalyzer.getRefactoringStats();
}
