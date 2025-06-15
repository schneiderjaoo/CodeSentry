import fs from 'fs/promises';
import * as acorn from 'acorn';

export async function parseCode(code) {
  const ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });

  const structure = {
    functions: [],
    classes: [],
  };

  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration') {
      structure.functions.push(node.id.name);
    }
    if (node.type === 'ClassDeclaration') {
      structure.classes.push(node.id.name);
    }
  }

  return {
    language: 'JavaScript',
    structure,
    ast,
  };
}

export async function parseFile(filePath) {
  const code = await fs.readFile(filePath, 'utf-8');
  return await parseCode(code);
}
