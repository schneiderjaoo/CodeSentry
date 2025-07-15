import fs from 'fs/promises';
import AdvancedRAG from './advancedRAG.js';

const RULES_PATH = './db/rules.json';

// Instância global do RAG
let ragService = null;

async function getRagService() {
  if (!ragService) {
    ragService = new AdvancedRAG();
    await ragService.initialize();
  }
  return ragService;
}

export async function detectPatterns(parsedInput) {
  const rules = JSON.parse(await fs.readFile(RULES_PATH, 'utf8'));
  const { files } = parsedInput;

  const results = {
    patterns: [],
    antipatterns: [],
    ragInsights: []
  };

  // DetecÃ§Ã£o tradicional
  await detectTraditionalPatterns(files, rules, results);
  
  // DetecÃ§Ã£o com RAG
  await detectPatternsWithRAG(files, results);

  return results;
}

async function detectTraditionalPatterns(files, rules, results) {
  for (const rule of rules.patterns) {
    for (const file of files) {
      const fileName = file.name.toLowerCase();

      if (rule.requiredFiles.some(word => fileName.includes(word))) {
        if (rule.requiredContentRegex) {
          const regex = new RegExp(rule.requiredContentRegex, 'i');
          if (file.content && regex.test(file.content)) {
            results.patterns.push({ 
              rule: rule.name, 
              file: file.name,
              type: 'rule_based',
              confidence: 1.0
            });
          }
        } else {
          results.patterns.push({ 
            rule: rule.name, 
            file: file.name,
            type: 'rule_based',
            confidence: 1.0
          });
        }
      }
    }
  }

  for (const rule of rules.antipatterns) {
    for (const file of files) {
      if ((rule.maxMethods && file.methods > rule.maxMethods) ||
          (rule.maxLines && file.lines > rule.maxLines)) {
        results.antipatterns.push({ 
          rule: rule.name, 
          file: file.name,
          type: 'rule_based',
          confidence: 1.0
        });
      }
    }
  }
}

async function detectPatternsWithRAG(files, results) {
  try {
    const rag = await getRagService();

    for (const file of files) {
      if (!file.content || !file.content.trim()) continue;

      // Busca padrÃµes similares
      const similarPatterns = await rag.searchSimilar(file.content, 3);

      for (const pattern of similarPatterns) {
        if (pattern.similarity > 0.4) { // Threshold de similaridade
          const insight = {
            file: file.name,
            type: 'rag_similarity',
            confidence: pattern.similarity,
            description: `Similar code found in ${pattern.file_path}`,
            similarity: pattern.similarity,
            relatedFile: pattern.file_path
          };

          // Classifica baseado em heurÃ­sticas simples
          if (isLikelyGoodPattern(pattern)) {
            results.patterns.push(insight);
          } else if (isLikelyBadPattern(pattern)) {
            results.antipatterns.push(insight);
          } else {
            results.ragInsights.push(insight);
          }
        }
      }

      // Usa contexto RAG do parser se disponÃ­vel
      if (file.ragContext && file.ragContext.hasContext) {
        results.ragInsights.push({
          file: file.name,
          type: 'rag_enhanced',
          description: `Found ${file.ragContext.similarPatterns.length} similar patterns`,
          patternsCount: file.ragContext.similarPatterns.length
        });
      }
    }
  } catch (error) {
    console.warn('Error detecting RAG patterns:', error.message);
  }
}

function isLikelyGoodPattern(pattern) {
  const goodKeywords = ['test', 'util', 'helper', 'clean', 'valid', 'check'];
  const content = pattern.content.toLowerCase();
  const filePath = pattern.file_path.toLowerCase();
  
  return goodKeywords.some(keyword => 
    content.includes(keyword) || filePath.includes(keyword)
  );
}

function isLikelyBadPattern(pattern) {
  const badKeywords = ['hack', 'todo', 'fixme', 'bug', 'deprecated', 'temp'];
  const content = pattern.content.toLowerCase();
  const filePath = pattern.file_path.toLowerCase();
  
  return badKeywords.some(keyword => 
    content.includes(keyword) || filePath.includes(keyword)
  );
}

export async function indexPatterns() {
  // Esta função pode ser expandida para indexar padrões específicos
  console.log("Pattern indexing completed (using main codebase index)");
}
