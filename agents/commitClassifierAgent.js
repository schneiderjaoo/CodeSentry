import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import AdvancedRAG from "./advancedRAG.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

// Tipos de commits conhecidos
const COMMIT_TYPES = {
  FEATURE: 'feature',
  BUGFIX: 'bugfix',
  REFACTOR: 'refactor',
  DOCS: 'docs',
  TEST: 'test',
  STYLE: 'style',
  PERF: 'performance',
  SECURITY: 'security',
  CHORE: 'chore',
  HOTFIX: 'hotfix'
};

// Tipos de refatora��o
const REFACTORING_TYPES = {
  EXTRACT_METHOD: 'extract_method',
  EXTRACT_CLASS: 'extract_class',
  RENAME: 'rename',
  MOVE: 'move',
  INLINE: 'inline',
  SIMPLIFY: 'simplify',
  SPLIT: 'split',
  MERGE: 'merge',
  RESTRUCTURE: 'restructure',
  OPTIMIZE: 'optimize'
};

class CommitClassifierAgent {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.rag = null;
  }

  async initialize() {
    this.rag = new AdvancedRAG();
    await this.rag.initialize();
  }

  async classifyCommit(gitDiff, commitMessage = '', commitHash = '') {
    const analysis = {
      commitHash,
      commitMessage,
      classification: 'unknown',
      refactoringType: null,
      complexityChange: 0,
      riskScore: 0,
      suggestions: [],
      patterns: [],
      filesChanged: this.extractFilesChanged(gitDiff),
      metadata: {}
    };

    // An�lise baseada em regras
    const ruleBasedAnalysis = this.analyzeByRules(gitDiff, commitMessage);
    analysis.classification = ruleBasedAnalysis.classification;
    analysis.refactoringType = ruleBasedAnalysis.refactoringType;
    analysis.complexityChange = ruleBasedAnalysis.complexityChange;
    analysis.riskScore = ruleBasedAnalysis.riskScore;

    // An�lise sem�ntica com LLM
    const semanticAnalysis = await this.analyzeSemantically(gitDiff, commitMessage);
    analysis.suggestions = semanticAnalysis.suggestions;
    analysis.patterns = semanticAnalysis.patterns;
    analysis.metadata = { ...analysis.metadata, ...semanticAnalysis.metadata };

    // An�lise com RAG
    const ragAnalysis = await this.analyzeWithRAG(gitDiff);
    analysis.metadata = { ...analysis.metadata, ...ragAnalysis };

    // Salvar an�lise no RAG
    await this.rag.addCommitAnalysis(analysis);

    return analysis;
  }

  extractFilesChanged(gitDiff) {
    const files = [];
    const lines = gitDiff.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        const parts = line.split(' ');
        const filePath = parts[2].slice(2); // remove 'a/'
        files.push(filePath);
      }
    }
    
    return files;
  }

  analyzeByRules(gitDiff, commitMessage) {
    const analysis = {
      classification: 'unknown',
      refactoringType: null,
      complexityChange: 0,
      riskScore: 0
    };

    const message = commitMessage.toLowerCase();
    const diff = gitDiff.toLowerCase();

    // Classifica��o baseada na mensagem do commit
    if (message.includes('feat') || message.includes('add') || message.includes('new')) {
      analysis.classification = COMMIT_TYPES.FEATURE;
    } else if (message.includes('fix') || message.includes('bug') || message.includes('issue')) {
      analysis.classification = COMMIT_TYPES.BUGFIX;
    } else if (message.includes('refactor') || message.includes('clean') || message.includes('improve')) {
      analysis.classification = COMMIT_TYPES.REFACTOR;
    } else if (message.includes('doc') || message.includes('readme')) {
      analysis.classification = COMMIT_TYPES.DOCS;
    } else if (message.includes('test')) {
      analysis.classification = COMMIT_TYPES.TEST;
    } else if (message.includes('style') || message.includes('format')) {
      analysis.classification = COMMIT_TYPES.STYLE;
    } else if (message.includes('perf') || message.includes('optimize')) {
      analysis.classification = COMMIT_TYPES.PERF;
    } else if (message.includes('security')) {
      analysis.classification = COMMIT_TYPES.SECURITY;
    } else if (message.includes('chore') || message.includes('maintenance')) {
      analysis.classification = COMMIT_TYPES.CHORE;
    }

    // Detec��o de refatora��o baseada no diff
    if (this.detectRefactoring(diff)) {
      analysis.refactoringType = this.classifyRefactoringType(diff, message);
      analysis.complexityChange = this.calculateComplexityChange(diff);
    }

    // C�lculo de risco
    analysis.riskScore = this.calculateRiskScore(diff, analysis.classification);

    return analysis;
  }

  detectRefactoring(diff) {
    const refactoringIndicators = [
      'function', 'class', 'method', 'extract', 'inline', 'rename',
      'move', 'split', 'merge', 'restructure', 'simplify'
    ];
    
    return refactoringIndicators.some(indicator => diff.includes(indicator));
  }

  classifyRefactoringType(diff, message) {
    const messageLower = message.toLowerCase();
    const diffLower = diff.toLowerCase();

    if (messageLower.includes('extract') || diffLower.includes('function') && diffLower.includes('new')) {
      return REFACTORING_TYPES.EXTRACT_METHOD;
    } else if (messageLower.includes('class') && (messageLower.includes('extract') || messageLower.includes('split'))) {
      return REFACTORING_TYPES.EXTRACT_CLASS;
    } else if (messageLower.includes('rename') || diffLower.includes('rename')) {
      return REFACTORING_TYPES.RENAME;
    } else if (messageLower.includes('move') || diffLower.includes('move')) {
      return REFACTORING_TYPES.MOVE;
    } else if (messageLower.includes('inline') || diffLower.includes('inline')) {
      return REFACTORING_TYPES.INLINE;
    } else if (messageLower.includes('simplify') || messageLower.includes('clean')) {
      return REFACTORING_TYPES.SIMPLIFY;
    } else if (messageLower.includes('split')) {
      return REFACTORING_TYPES.SPLIT;
    } else if (messageLower.includes('merge')) {
      return REFACTORING_TYPES.MERGE;
    } else if (messageLower.includes('restructure')) {
      return REFACTORING_TYPES.RESTRUCTURE;
    } else if (messageLower.includes('optimize') || messageLower.includes('perf')) {
      return REFACTORING_TYPES.OPTIMIZE;
    }

    return REFACTORING_TYPES.RESTRUCTURE; // padr�o
  }

  calculateComplexityChange(diff) {
    const addedLines = (diff.match(/^\+/gm) || []).length;
    const removedLines = (diff.match(/^-/gm) || []).length;
    
    // Heur�stica simples: mais linhas removidas = redu��o de complexidade
    const netChange = addedLines - removedLines;
    
    if (netChange < -5) return -1; // Redu��o significativa
    if (netChange > 5) return 1;   // Aumento significativo
    return 0; // Mudan�a neutra
  }

  calculateRiskScore(diff, classification) {
    let risk = 0;

    // Fatores de risco baseados no tipo de commit
    const riskFactors = {
      [COMMIT_TYPES.BUGFIX]: 0.3,
      [COMMIT_TYPES.REFACTOR]: 0.4,
      [COMMIT_TYPES.PERF]: 0.5,
      [COMMIT_TYPES.SECURITY]: 0.8,
      [COMMIT_TYPES.HOTFIX]: 0.9
    };

    risk += riskFactors[classification] || 0.1;

    // Fatores baseados no conte�do do diff
    const highRiskPatterns = [
      'delete', 'remove', 'drop', 'truncate', 'clear',
      'password', 'token', 'secret', 'key', 'auth',
      'database', 'db', 'sql', 'query'
    ];

    highRiskPatterns.forEach(pattern => {
      if (diff.includes(pattern)) risk += 0.2;
    });

    return Math.min(risk, 1.0); // Normalizar para 0-1
  }

  async analyzeSemantically(gitDiff, commitMessage) {
    const prompt = this.buildSemanticPrompt(gitDiff, commitMessage);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseSemanticResponse(text);
    } catch (error) {
      console.warn('Semantic analysis failed:', error.message);
      return {
        suggestions: ['An�lise sem�ntica n�o dispon�vel'],
        patterns: [],
        metadata: {}
      };
    }
  }

  buildSemanticPrompt(gitDiff, commitMessage) {
    return `
Voc� � um especialista em an�lise de commits e refatora��o de c�digo.

Analise o seguinte commit e forne�a insights detalhados:

**Mensagem do Commit:**
${commitMessage}

**Git Diff:**
${gitDiff}

**Tarefas:**
1. Identifique o tipo de mudan�a (feature, bugfix, refactor, etc.)
2. Detecte padr�es de refatora��o espec�ficos
3. Sugira melhorias de c�digo
4. Identifique poss�veis riscos
5. Recomende testes adicionais se necess�rio

Responda em formato JSON estruturado:
{
  "suggestions": ["sugest�o 1", "sugest�o 2"],
  "patterns": ["padr�o 1", "padr�o 2"],
  "metadata": {
    "estimatedImpact": "low|medium|high",
    "testingRecommendations": ["teste 1", "teste 2"],
    "codeQuality": "good|needs_improvement|poor"
  }
}
`;
  }

  parseSemanticResponse(text) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse semantic response as JSON');
    }

    // Fallback: an�lise simples do texto
    return {
      suggestions: [text],
      patterns: [],
      metadata: {
        estimatedImpact: 'medium',
        testingRecommendations: [],
        codeQuality: 'unknown'
      }
    };
  }

  async analyzeWithRAG(gitDiff) {
    try {
      const similarCommits = await this.rag.searchSimilar(gitDiff, 3);
      const commitHistory = await this.rag.getCommitHistory(5);
      
      return {
        similarCommits: similarCommits.length,
        commitHistory: commitHistory.length,
        patterns: similarCommits.map(commit => ({
          similarity: commit.similarity,
          filePath: commit.file_path
        }))
      };
    } catch (error) {
      console.warn('RAG analysis failed:', error.message);
      return {};
    }
  }

  async getCommitHistory(limit = 10) {
    return await this.rag.getCommitHistory(limit);
  }

  async getCommitStats() {
    const history = await this.rag.getCommitHistory(100);
    
    const stats = {
      totalCommits: history.length,
      byType: {},
      byRefactoringType: {},
      averageRiskScore: 0,
      complexityChanges: { increased: 0, decreased: 0, neutral: 0 }
    };

    history.forEach(commit => {
      // Contagem por tipo
      stats.byType[commit.classification] = (stats.byType[commit.classification] || 0) + 1;
      
      // Contagem por tipo de refatora��o
      if (commit.refactoring_type) {
        stats.byRefactoringType[commit.refactoring_type] = (stats.byRefactoringType[commit.refactoring_type] || 0) + 1;
      }
      
      // M�dia de risco
      stats.averageRiskScore += commit.risk_score || 0;
      
      // Mudan�as de complexidade
      if (commit.complexity_change > 0) stats.complexityChanges.increased++;
      else if (commit.complexity_change < 0) stats.complexityChanges.decreased++;
      else stats.complexityChanges.neutral++;
    });

    if (history.length > 0) {
      stats.averageRiskScore /= history.length;
    }

    return stats;
  }
}

export default CommitClassifierAgent; 