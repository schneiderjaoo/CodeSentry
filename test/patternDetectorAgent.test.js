import { describe, it, expect } from 'vitest';
import { detectPatterns } from '../agents/patternDetectorAgent.js';
import fs from 'fs/promises';

describe('patternDetectorAgent', () => {
  it('deve detectar antipadrões corretamente', async () => {
    // cria regras fake
    const rules = {
      patterns: [],
      antipatterns: [
        {
          name: "God Object",
          maxMethods: 5,
          maxLines: 10
        }
      ]
    };
    
    await fs.writeFile('./db/rules.json', JSON.stringify(rules, null, 2));

    const parsedInput = {
      files: [
        { name: 'bigFile.js', lines: 100, methods: 10 }
      ]
    };

    const result = await detectPatterns(parsedInput);
    expect(result.antipatterns).toHaveLength(1);
    expect(result.antipatterns[0].rule).toBe("God Object");
  });
});
