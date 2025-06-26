import fs from 'fs/promises';

/**
 * Analisa o diff e extrai palavras-chave simples para busca.
 */
function extractKeywords(diffText) {
  const keywords = new Set();

  const lines = diffText.split('\n');
  for (const line of lines) {
    if (line.startsWith('+') || line.startsWith('-')) {
      const tokens = line
        .replace(/[^a-zA-Z0-9_]/g, ' ')
        .split(' ')
        .filter(word => word.length > 3 && isNaN(word));
      tokens.forEach(token => keywords.add(token));
    }
  }

  return Array.from(keywords);
}

/**
 * Busca arquivos relevantes indexados em ./context/index.json
 * @param {{ content: string }} parsedInput 
 * @returns {Promise<Array<{file: string, snippet: string}>>}
 */
export async function retrieveContext(parsedInput) {
  const indexRaw = await fs.readFile('./context/index.json', 'utf-8');
  const indexedFiles = JSON.parse(indexRaw);
  const keywords = extractKeywords(parsedInput.content);

  const matches = [];

  for (const file of indexedFiles) {
    let score = 0;
    for (const word of keywords) {
      if (file.content.includes(word)) score++;
    }

    if (score > 0) {
      matches.push({
        file: file.file,
        snippet: file.content.slice(0, 500) + '...'
      });
    }
  }

  return matches;
}