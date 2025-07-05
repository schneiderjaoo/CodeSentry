import sqlite3 from 'sqlite3';
import { NlpManager } from 'node-nlp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class SimpleRAG {
  constructor() {
    this.db = null;
    this.nlp = new NlpManager({ languages: ['en'], forceNER: true });
    this.dbPath = './db/rag_knowledge.db';
  }

  async initialize() {
    // Garante que o diretório db existe
    await fs.mkdir('./db', { recursive: true });

    // Inicializa o banco SQLite
    this.db = new sqlite3.Database(this.dbPath);
    
    await this.createTables();
    console.log("Simple RAG initialized with SQLite");
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS code_chunks (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            file_path TEXT,
            chunk_type TEXT,
            keywords TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        this.db.run(`
          CREATE TABLE IF NOT EXISTS patterns (
            id TEXT PRIMARY KEY,
            pattern_name TEXT,
            pattern_type TEXT,
            description TEXT,
            code_example TEXT,
            keywords TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  // Função simples para extrair palavras-chave do código
  extractKeywords(content) {
    const keywords = new Set();
    
    // Palavras-chave técnicas comuns
    const techKeywords = [
      'function', 'class', 'const', 'let', 'var', 'async', 'await',
      'import', 'export', 'try', 'catch', 'if', 'else', 'for', 'while',
      'return', 'throw', 'new', 'this', 'super', 'extends', 'implements'
    ];
    
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    words.forEach(word => {
      if (techKeywords.includes(word) || word.length > 4) {
        keywords.add(word);
      }
    });
    
    return Array.from(keywords).slice(0, 20); // Limita a 20 palavras-chave
  }

  // Calcula similaridade simples baseada em palavras-chave
  calculateSimilarity(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  async addCodeChunk(content, filePath, chunkType = 'code') {
    const id = crypto.randomUUID();
    const keywords = this.extractKeywords(content);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO code_chunks (id, content, file_path, chunk_type, keywords) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, content, filePath, chunkType, JSON.stringify(keywords)],
        (err) => {
          if (err) reject(err);
          else resolve(id);
        }
      );
    });
  }

  async searchSimilar(query, limit = 5) {
    const queryKeywords = this.extractKeywords(query);
    
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM code_chunks ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Calcula similaridade para cada chunk
          const results = rows.map(row => {
            const chunkKeywords = JSON.parse(row.keywords || '[]');
            const similarity = this.calculateSimilarity(queryKeywords, chunkKeywords);
            
            return {
              ...row,
              similarity,
              content: row.content.substring(0, 500) // Limita o conteúdo
            };
          })
          .filter(result => result.similarity > 0.1) // Threshold mínimo
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
          
          resolve(results);
        }
      );
    });
  }

  async indexDirectory(directory = './') {
    let indexed = 0;
    await this.walkDirectory(directory, async (filePath, content) => {
      await this.addCodeChunk(content, filePath);
      indexed++;
    });
    
    console.log(`Indexed ${indexed} files in knowledge base`);
    return indexed;
  }

  async walkDirectory(dir, callback) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await this.walkDirectory(fullPath, callback);
        } else if (entry.isFile() && this.shouldIndexFile(entry.name)) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            await callback(fullPath, content);
          } catch (error) {
            console.warn(`Error reading file ${fullPath}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}:`, error.message);
    }
  }

  shouldSkipDirectory(name) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'db'];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  shouldIndexFile(name) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.md'];
    return extensions.some(ext => name.endsWith(ext));
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default SimpleRAG;