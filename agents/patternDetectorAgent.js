import fs from 'fs/promises';

const RULES_PATH = './db/rules.json';

/**
 * Recebe a AST ou metadados do código e aplica regras para detectar padrões/antipadrões
 * @param {{ files: Array<{name: string, lines: number, methods: number}> }} parsedInput
 * @returns {Promise<{patterns: any[], antipatterns: any[]}>}
 */
export async function detectPatterns(parsedInput) {
  const rules = JSON.parse(await fs.readFile(RULES_PATH, 'utf8'));
  const { files } = parsedInput;

  const results = {
    patterns: [],
    antipatterns: []
  };

  // Verifica padrões
  for (const rule of rules.patterns) {
    for (const file of files) {
      if (rule.requiredFiles.some(word => file.name.toLowerCase().includes(word))) {
        results.patterns.push({ rule: rule.name, file: file.name });
      }
    }
  }

  // Verifica antipadrões
  for (const rule of rules.antipatterns) {
    for (const file of files) {
      if ((rule.maxMethods && file.methods > rule.maxMethods) ||
          (rule.maxLines && file.lines > rule.maxLines)) {
        results.antipatterns.push({ rule: rule.name, file: file.name });
      }
    }
  }

  return results;
}
