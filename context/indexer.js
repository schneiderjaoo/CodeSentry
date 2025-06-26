import fs from 'fs/promises';
import path from 'path';

export async function indexProjectFiles(dir = './') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const index = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
      const nested = await indexProjectFiles(fullPath);
      index.push(...nested);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.md')) {
      const content = await fs.readFile(fullPath, 'utf-8');
      index.push({ file: fullPath, content });
    }
  }

  await fs.writeFile('./context/index.json', JSON.stringify(index, null, 2));
  console.log('Indexação concluída.');
}
