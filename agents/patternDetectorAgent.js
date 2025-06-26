import fs from 'fs/promises';

const RULES_PATH = './db/rules.json';

/**
 * @param {{ files: Array<{name: string, lines: number, methods: number, content?: string}> }} parsedInput
 */
export async function detectPatterns(parsedInput) {
  const rules = JSON.parse(await fs.readFile(RULES_PATH, 'utf8'));
  const { files } = parsedInput;

  const results = {
    patterns: [],
    antipatterns: []
  };

  for (const rule of rules.patterns) {
    for (const file of files) {
      const fileName = file.name.toLowerCase();

      if (rule.requiredFiles.some(word => fileName.includes(word))) {
        // Se a regra tiver padrão regex para o conteúdo, valida também
        if (rule.requiredContentRegex) {
          const regex = new RegExp(rule.requiredContentRegex, 'i');
          if (file.content && regex.test(file.content)) {
            results.patterns.push({ rule: rule.name, file: file.name });
          }
        } else {
          results.patterns.push({ rule: rule.name, file: file.name });
        }
      }
    }
  }

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
