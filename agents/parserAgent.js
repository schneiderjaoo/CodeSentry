import fs from 'fs/promises';
import AdvancedRAG from './advancedRAG.js';

// Instância global do RAG
let ragService = null;

async function getRagService() {
  if (!ragService) {
    ragService = new AdvancedRAG();
    await ragService.initialize();
  }
  return ragService;
}

export async function parseGitDiff(diffText) {
  const files = [];
  const lines = diffText.split('\n');
  let currentFile = null;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      const parts = line.split(' ');
      const filePath = parts[2].slice(2); // remove 'a/'
      currentFile = { name: filePath, addedLines: 0, removedLines: 0, content: '' };
    } else if (currentFile) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentFile.addedLines++;
        currentFile.content += line.slice(1) + '\n';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentFile.removedLines++;
      }
    }
  }
  if (currentFile) files.push(currentFile);

  // Enriquece com contexto RAG
  const enrichedFiles = await enrichWithRAG(files);

  return {
    content: diffText,
    files: enrichedFiles
  };
}

async function enrichWithRAG(files) {
  try {
    const rag = await getRagService();
    const enrichedFiles = [];

    for (const file of files) {
      if (file.content && file.content.trim()) {
        // Busca cÃ³digo similar
        const similarCode = await rag.searchSimilar(file.content, 3);
        
        enrichedFiles.push({
          ...file,
          ragContext: {
            similarPatterns: similarCode.filter(result => result.similarity > 0.3),
            hasContext: similarCode.length > 0
          }
        });
      } else {
        enrichedFiles.push(file);
      }
    }

    return enrichedFiles;
  } catch (error) {
    console.warn('Error enriching with RAG:', error.message);
    return files; // Retorna files originais se RAG falhar
  }
}

export async function parseFile(filePath) {
  const code = await fs.readFile(filePath, 'utf-8');
  
  try {
    const rag = await getRagService();
    const similarCode = await rag.searchSimilar(code, 3);
    
    return {
      content: code,
      name: filePath,
      ragContext: {
        similarPatterns: similarCode.filter(result => result.similarity > 0.3)
      }
    };
  } catch (error) {
    console.warn(`Error enriching file ${filePath} with RAG:`, error.message);
    return {
      content: code,
      name: filePath,
    };
  }
}

// Função para indexar a base de código
export async function indexCodebase(directory = './') {
  try {
    const rag = await getRagService();
    await rag.indexDirectory(directory);
    console.log(`Codebase indexed: ${directory}`);
  } catch (error) {
    console.error('Error indexing codebase:', error.message);
  }
}
