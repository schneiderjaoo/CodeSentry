import AdvancedRAG from './agents/advancedRAG.js';

async function testRAG() {
  console.log('?? Testando Advanced RAG...\n');
  
  const rag = new AdvancedRAG();
  
  try {
    // 1. Inicializar RAG
    console.log('1?? Inicializando RAG...');
    await rag.initialize();
    console.log('? RAG inicializado com sucesso\n');
    
    // 2. Indexar alguns arquivos de teste
    console.log('2?? Indexando arquivos de teste...');
    const testCode1 = `
function calculateSum(a, b) {
  return a + b;
}

class Calculator {
  multiply(x, y) {
    return x * y;
  }
}
    `;
    
    const testCode2 = `
async function fetchData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
    `;
    
    await rag.addCodeChunk(testCode1, 'test1.js', 'code', 'javascript');
    await rag.addCodeChunk(testCode2, 'test2.js', 'code', 'javascript');
    console.log('? Arquivos de teste indexados\n');
    
    // 3. Testar busca por similaridade
    console.log('3?? Testando busca por similaridade...');
    const query = 'function add numbers';
    const results = await rag.searchSimilar(query, 3);
    
    console.log(`Query: "${query}"`);
    console.log(`Resultados encontrados: ${results.length}`);
    
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. Arquivo: ${result.file_path}`);
      console.log(`   Similaridade: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`   Conteúdo: ${result.content.substring(0, 100)}...`);
    });
    
    // 4. Testar indexação de diretório
    console.log('\n4?? Testando indexação de diretório...');
    const indexedCount = await rag.indexDirectory('./agents');
    console.log(`? Indexados ${indexedCount} arquivos do diretório agents/\n`);
    
    // 5. Testar busca com código real
    console.log('5?? Testando busca com código real...');
    const realQuery = 'async function analyze';
    const realResults = await rag.searchSimilar(realQuery, 2);
    
    console.log(`Query: "${realQuery}"`);
    console.log(`Resultados encontrados: ${realResults.length}`);
    
    realResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Arquivo: ${result.file_path}`);
      console.log(`   Similaridade: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`   Linguagem: ${result.language}`);
      console.log(`   Complexidade: ${result.complexity_score}`);
    });
    
    console.log('\n?? Teste do RAG concluído com sucesso!');
    
  } catch (error) {
    console.error('?? Erro no teste do RAG:', error);
  } finally {
    await rag.close();
  }
}

testRAG(); 