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

/**
 * Busca contexto relevante usando o AdvancedRAG
 * @param {{ content: string }} parsedInput 
 * @returns {Promise<Array<{file: string, snippet: string, similarity: number}>>}
 */
export async function retrieveContext(parsedInput) {
  try {
    const rag = await getRagService();
    const similarCode = await rag.searchSimilar(parsedInput.content, 5);
    
    return similarCode.map(result => ({
      file: result.file_path,
      snippet: result.content,
      similarity: result.similarity
    }));
  } catch (error) {
    console.warn('Error retrieving context with RAG:', error.message);
    return [];
  }
}