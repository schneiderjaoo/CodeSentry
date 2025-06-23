import fs from 'fs/promises';
import * as acorn from 'acorn';
import { exec } from 'child_process';

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

/**
 * Executa o git log e retorna o resultado como string
 * @returns {Promise<string>}
 */
export function getGitLog() {
  return new Promise((resolve, reject) => {
    exec('git log --pretty=format:"%H|%an|%ad|%s"', (error, stdout, stderr) => {
      if (error) {
        return reject(`Erro ao executar git log: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}
