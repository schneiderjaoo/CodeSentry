import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import AdvancedRAG from "./advancedRAG.js";
import * as acorn from 'acorn';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

class RefactoringAnalyzerAgent {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    this.rag = null;
  }

  async initialize() {
    this.rag = new AdvancedRAG();
    await this.rag.initialize();
  }

  async analyzeRefactoring(gitDiff, beforeCode = '', afterCode = '') {
    const analysis = {
      refactoringType: 'unknown',
      confidence: 0,
      improvements: [],
      risks: [],
      metrics: {},
      suggestions: [],
      patterns: [],
      complexity: {
        before: 0,
        after: 0,
        change: 0
      }
    };

    // Análise estrutural do diff
    const structuralAnalysis = this.analyzeStructure(gitDiff);
    analysis.refactoringType = structuralAnalysis.type;
    analysis.confidence = structuralAnalysis.confidence;
    analysis.patterns = structuralAnalysis.patterns;

    // Análise de métricas
    if (beforeCode && afterCode) {
      analysis.metrics = this.calculateMetrics(beforeCode, afterCode);
      analysis.complexity = this.calculateComplexity(beforeCode, afterCode);
    }

    // Análise semântica
    const semanticAnalysis = await this.analyzeSemantically(gitDiff, beforeCode, afterCode);
    analysis.improvements = semanticAnalysis.improvements;
    analysis.risks = semanticAnalysis.risks;
    analysis.suggestions = semanticAnalysis.suggestions;

    // Análise com RAG
    const ragAnalysis = await this.analyzeWithRAG(gitDiff, analysis.refactoringType);
    analysis.metadata = ragAnalysis;

    return analysis;
  }

  analyzeStructure(gitDiff) {
    const analysis = {
      type: 'unknown',
      confidence: 0,
      patterns: []
    };

    const diff = gitDiff.toLowerCase();
    const addedLines = gitDiff.match(/^\+/gm) || [];
    const removedLines = gitDiff.match(/^-/gm) || [];

    // Detecção de padrões de refatoração
    const patterns = this.detectRefactoringPatterns(diff, addedLines, removedLines);
    analysis.patterns = patterns;

    // Classificação baseada em padrões
    if (patterns.includes('extract_method')) {
      analysis.type = 'extract_method';
      analysis.confidence = 0.8;
    } else if (patterns.includes('extract_class')) {
      analysis.type = 'extract_class';
      analysis.confidence = 0.7;
    } else if (patterns.includes('rename')) {
      analysis.type = 'rename';
      analysis.confidence = 0.9;
    } else if (patterns.includes('move')) {
      analysis.type = 'move';
      analysis.confidence = 0.6;
    } else if (patterns.includes('inline')) {
      analysis.type = 'inline';
      analysis.confidence = 0.7;
    } else if (patterns.includes('simplify')) {
      analysis.type = 'simplify';
      analysis.confidence = 0.6;
    } else if (patterns.includes('split')) {
      analysis.type = 'split';
      analysis.confidence = 0.7;
    } else if (patterns.includes('merge')) {
      analysis.type = 'merge';
      analysis.confidence = 0.6;
    }

    return analysis;
  }

  detectRefactoringPatterns(diff, addedLines, removedLines) {
    const patterns = [];

    // Extract Method
    if (this.detectExtractMethod(diff, addedLines, removedLines)) {
      patterns.push('extract_method');
    }

    // Extract Class
    if (this.detectExtractClass(diff, addedLines, removedLines)) {
      patterns.push('extract_class');
    }

    // Rename
    if (this.detectRename(diff, addedLines, removedLines)) {
      patterns.push('rename');
    }

    // Move
    if (this.detectMove(diff, addedLines, removedLines)) {
      patterns.push('move');
    }

    // Inline
    if (this.detectInline(diff, addedLines, removedLines)) {
      patterns.push('inline');
    }

    // Simplify
    if (this.detectSimplify(diff, addedLines, removedLines)) {
      patterns.push('simplify');
    }

    // Split
    if (this.detectSplit(diff, addedLines, removedLines)) {
      patterns.push('split');
    }

    // Merge
    if (this.detectMerge(diff, addedLines, removedLines)) {
      patterns.push('merge');
    }

    return patterns;
  }

  detectExtractMethod(diff, addedLines, removedLines) {
    // Detectar se uma função foi extraída
    const functionPatterns = [
      /function\s+\w+\s*\(/g,
      /const\s+\w+\s*=\s*\(/g,
      /let\s+\w+\s*=\s*\(/g,
      /var\s+\w+\s*=\s*\(/g
    ];

    const hasNewFunction = addedLines.some(line => 
      functionPatterns.some(pattern => pattern.test(line))
    );

    const hasFunctionCall = addedLines.some(line => 
      /\w+\(/.test(line) && !line.includes('function') && !line.includes('=>')
    );

    return hasNewFunction && hasFunctionCall;
  }

  detectExtractClass(diff, addedLines, removedLines) {
    const classPatterns = [
      /class\s+\w+/g,
      /constructor\s*\(/g,
      /this\./g
    ];

    return addedLines.some(line => 
      classPatterns.some(pattern => pattern.test(line))
    );
  }

  detectRename(diff, addedLines, removedLines) {
    // Detectar renomeação de variáveis/funções
    const identifierPattern = /\b[a-zA-Z_]\w*\b/g;
    const addedIdentifiers = new Set();
    const removedIdentifiers = new Set();

    addedLines.forEach(line => {
      const matches = line.match(identifierPattern);
      if (matches) matches.forEach(id => addedIdentifiers.add(id));
    });

    removedLines.forEach(line => {
      const matches = line.match(identifierPattern);
      if (matches) matches.forEach(id => removedIdentifiers.add(id));
    });

    // Se há muitos identificadores únicos adicionados/removidos, pode ser renomeação
    const uniqueAdded = addedIdentifiers.size;
    const uniqueRemoved = removedIdentifiers.size;
    
    return uniqueAdded > 2 && uniqueRemoved > 2 && 
           Math.abs(uniqueAdded - uniqueRemoved) <= 2;
  }

  detectMove(diff, addedLines, removedLines) {
    // Detectar movimentação de código entre arquivos
    const fileChanges = diff.match(/diff --git a\/(.+) b\/(.+)/g);
    return fileChanges && fileChanges.length > 1;
  }

  detectInline(diff, addedLines, removedLines) {
    // Detectar inlining (remoção de função e expansão do código)
    const functionCallPattern = /\w+\([^)]*\)/g;
    const hasFunctionRemoval = removedLines.some(line => 
      functionCallPattern.test(line)
    );

    const hasCodeExpansion = addedLines.length > removedLines.length;

    return hasFunctionRemoval && hasCodeExpansion;
  }

  detectSimplify(diff, addedLines, removedLines) {
    // Detectar simplificação (menos linhas, menos complexidade)
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case'];
    
    const removedComplexity = removedLines.filter(line => 
      complexityKeywords.some(keyword => line.includes(keyword))
    ).length;

    const addedComplexity = addedLines.filter(line => 
      complexityKeywords.some(keyword => line.includes(keyword))
    ).length;

    return removedComplexity > addedComplexity && removedLines.length > addedLines.length;
  }

  detectSplit(diff, addedLines, removedLines) {
    // Detectar divisão de função/classe em múltiplas partes
    const functionPatterns = [
      /function\s+\w+/g,
      /class\s+\w+/g
    ];

    const addedFunctions = addedLines.filter(line => 
      functionPatterns.some(pattern => pattern.test(line))
    ).length;

    const removedFunctions = removedLines.filter(line => 
      functionPatterns.some(pattern => pattern.test(line))
    ).length;

    return addedFunctions > removedFunctions && addedFunctions > 1;
  }

  detectMerge(diff, addedLines, removedLines) {
    // Detectar fusão de funções/classes
    const functionPatterns = [
      /function\s+\w+/g,
      /class\s+\w+/g
    ];

    const addedFunctions = addedLines.filter(line => 
      functionPatterns.some(pattern => pattern.test(line))
    ).length;

    const removedFunctions = removedLines.filter(line => 
      functionPatterns.some(pattern => pattern.test(line))
    ).length;

    return removedFunctions > addedFunctions && removedFunctions > 1;
  }

  calculateMetrics(beforeCode, afterCode) {
    return {
      linesOfCode: {
        before: beforeCode.split('\n').length,
        after: afterCode.split('\n').length,
        change: afterCode.split('\n').length - beforeCode.split('\n').length
      },
      functions: {
        before: this.countFunctions(beforeCode),
        after: this.countFunctions(afterCode),
        change: this.countFunctions(afterCode) - this.countFunctions(beforeCode)
      },
      classes: {
        before: this.countClasses(beforeCode),
        after: this.countClasses(afterCode),
        change: this.countClasses(afterCode) - this.countClasses(beforeCode)
      },
      complexity: {
        before: this.calculateCyclomaticComplexity(beforeCode),
        after: this.calculateCyclomaticComplexity(afterCode),
        change: this.calculateCyclomaticComplexity(afterCode) - this.calculateCyclomaticComplexity(beforeCode)
      }
    };
  }

  countFunctions(code) {
    const functionPatterns = [
      /function\s+\w+\s*\(/g,
      /const\s+\w+\s*=\s*\(/g,
      /let\s+\w+\s*=\s*\(/g,
      /var\s+\w+\s*=\s*\(/g,
      /=>\s*{/g
    ];

    let count = 0;
    functionPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  countClasses(code) {
    const classPattern = /class\s+\w+/g;
    const matches = code.match(classPattern);
    return matches ? matches.length : 0;
  }

  calculateCyclomaticComplexity(code) {
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
    let complexity = 1;

    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    });

    return complexity;
  }

  calculateComplexity(beforeCode, afterCode) {
    const beforeComplexity = this.calculateCyclomaticComplexity(beforeCode);
    const afterComplexity = this.calculateCyclomaticComplexity(afterCode);

    return {
      before: beforeComplexity,
      after: afterComplexity,
      change: afterComplexity - beforeComplexity
    };
  }

  async analyzeSemantically(gitDiff, beforeCode, afterCode) {
    const prompt = this.buildSemanticPrompt(gitDiff, beforeCode, afterCode);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseSemanticResponse(text);
    } catch (error) {
      console.warn('Semantic analysis failed:', error.message);
      return {
        improvements: ['Análise semântica não disponível'],
        risks: [],
        suggestions: []
      };
    }
  }

  buildSemanticPrompt(gitDiff, beforeCode, afterCode) {
    return `
Você é um especialista em refatoração de código e análise de qualidade.

Analise a seguinte refatoração e forneça insights detalhados:

**Git Diff:**
${gitDiff}

${beforeCode ? `**Código Antes:**
\`\`\`
${beforeCode}
\`\`\`` : ''}

${afterCode ? `**Código Depois:**
\`\`\`
${afterCode}
\`\`\`` : ''}

**Tarefas:**
1. Identifique o tipo de refatoração aplicada
2. Avalie se a refatoração melhora a qualidade do código
3. Identifique possíveis riscos ou problemas
4. Sugira melhorias adicionais
5. Avalie a legibilidade e manutenibilidade

Responda em formato JSON estruturado:
{
  "improvements": ["melhoria 1", "melhoria 2"],
  "risks": ["risco 1", "risco 2"],
  "suggestions": ["sugestão 1", "sugestão 2"],
  "quality": "improved|degraded|neutral",
  "readability": "better|worse|same",
  "maintainability": "better|worse|same"
}
`;
  }

  parseSemanticResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse semantic response as JSON');
    }

    return {
      improvements: [text],
      risks: [],
      suggestions: []
    };
  }

  async analyzeWithRAG(gitDiff, refactoringType) {
    try {
      const similarRefactorings = await this.rag.searchSimilar(gitDiff, 3);
      
      return {
        similarRefactorings: similarRefactorings.length,
        patterns: similarRefactorings.map(ref => ({
          similarity: ref.similarity,
          filePath: ref.file_path,
          type: ref.chunk_type
        })),
        refactoringType
      };
    } catch (error) {
      console.warn('RAG analysis failed:', error.message);
      return {};
    }
  }

  async getRefactoringHistory(limit = 10) {
    try {
      const history = await this.rag.getCommitHistory(limit);
      return history.filter(commit => commit.refactoring_type);
    } catch (error) {
      console.warn('Failed to get refactoring history:', error.message);
      return [];
    }
  }

  async getRefactoringStats() {
    const history = await this.rag.getCommitHistory(100);
    const refactoringCommits = history.filter(commit => commit.refactoring_type);
    
    const stats = {
      totalRefactorings: refactoringCommits.length,
      byType: {},
      averageComplexityChange: 0,
      averageRiskScore: 0
    };

    refactoringCommits.forEach(commit => {
      stats.byType[commit.refactoring_type] = (stats.byType[commit.refactoring_type] || 0) + 1;
      stats.averageComplexityChange += commit.complexity_change || 0;
      stats.averageRiskScore += commit.risk_score || 0;
    });

    if (refactoringCommits.length > 0) {
      stats.averageComplexityChange /= refactoringCommits.length;
      stats.averageRiskScore /= refactoringCommits.length;
    }

    return stats;
  }
}

export default RefactoringAnalyzerAgent; 