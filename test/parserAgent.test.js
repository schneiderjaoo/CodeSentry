import { describe, it, expect } from 'vitest';
import { parseGitDiff } from '../agents/parserAgent.js';

describe('parserAgent', () => {
  it('deve extrair corretamente arquivos e conteúdo do git diff', async () => {
    const diff = `
diff --git a/index.js b/index.js
index 000..111 100644
--- a/index.js
+++ b/index.js
@@ -0,0 +1,2 @@
+const x = 1;
+console.log(x);
    `.trim();

    const result = await parseGitDiff(diff);

    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('index.js');
    expect(result.files[0].addedLines).toBe(2);
    expect(result.files[0].content).toContain('const x = 1');
  });
});
