import fs from 'fs/promises';
// import * as acorn from 'acorn';
// import { exec } from 'child_process';

// export async function parseCode(code) {
//   const ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' });

//   const structure = {
//     functions: [],
//     classes: [],
//   };

//   for (const node of ast.body) {
//     if (node.type === 'FunctionDeclaration') {
//       structure.functions.push(node.id.name);
//     }
//     if (node.type === 'ClassDeclaration') {
//       structure.classes.push(node.id.name);
//     }
//   }

//   return {
//     language: 'JavaScript',
//     structure,
//     ast,
//   };
// }

// export async function parseFile(filePath) {
//   const code = await fs.readFile(filePath, 'utf-8');
//   return await parseCode(code);
// }

// /**
//  * Executa o git log e retorna o resultado como string
//  * @returns {Promise<string>}
//  */
// export function getGitLog() {
//   return new Promise((resolve, reject) => {
//     exec('git log --pretty=format:"%H|%an|%ad|%s" --name-only', (error, stdout, stderr) => {
//       if (error) {
//         return reject(`Erro ao executar git log: ${stderr}`);
//       }
//       resolve(stdout);
//     });
//   });
// }

// export async function parseContent() {
//   const rawLog = await getGitLog();
//   const lines = rawLog.split('\n');

//   const commits = [];
//   let currentCommit = null;

//   for (const line of lines) {
//     if (line.includes('|')) {
//       const [hash, author, date, message] = line.split('|');
//       currentCommit = {
//         hash,
//         author,
//         date,
//         message,
//         files: []
//       };
//       commits.push(currentCommit);
//     } else if (line.trim() !== '' && currentCommit) {
//       currentCommit.files.push(line.trim());
//     }
//   }

//   const seen = new Set();
//   const parsedFiles = [];

//   for (const file of commits.flatMap(c => c.files)) {
//     if (!seen.has(file) && file.endsWith('.js')) {
//       seen.add(file);

//       // Corrige o caminho caso tenha 'agent/' mas a pasta real seja 'agents/'
//       let correctedPath = file.replace(/^agent\//, 'agents/');

//       try {
//         const result = await parseFile(correctedPath); // usa acorn aqui
//         parsedFiles.push({
//           name: correctedPath,
//           lines: result.ast.loc?.end?.line || result.ast.body.length,
//           methods: result.structure.functions.length,
//         });
//       } catch (err) {
//         console.warn(`Erro ao parsear ${correctedPath}: ${err.message}`);
//       }
//     }
//   }

//   return {
//     content: commits.map(c => c.message).join('\n'),
//     files: parsedFiles
//   };
// }

export async function parseGitDiff(diffText) {
  const files = [];
  const lines = diffText.split('\n');
  let currentFile = null;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile) files.push(currentFile);
      const parts = line.split(' ');
      // o formato é: diff --git a/<file> b/<file>
      const filePath = parts[2].slice(2); // remove 'a/'
      currentFile = { name: filePath, addedLines: 0, removedLines: 0, content: '' };
    } else if (currentFile) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentFile.addedLines++;
        currentFile.content += line.slice(1) + '\n';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        currentFile.removedLines++;
      }
    }
  }
  if (currentFile) files.push(currentFile);

  return {
    content: diffText,
    files
  };
}

export async function parseFile(filePath) {
  const code = await fs.readFile(filePath, 'utf-8');
  return {
    content: code,
    name: filePath,
  };
}
