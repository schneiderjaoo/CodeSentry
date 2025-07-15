import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from '@xenova/transformers';

class AdvancedRAG {
  constructor() {
    this.db = null;
    this.embeddingPipeline = null;
    this.dbPath = './db/advanced_rag.db';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    await fs.mkdir('./db', { recursive: true });
    this.db = new sqlite3.Database(this.dbPath);
    
    // Inicializar pipeline de embeddings
    try {
      this.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      console.warn('Embedding pipeline not available, falling back to keyword-based search');
    }
    
    await this.createAdvancedTables();
    this.initialized = true;
    console.log("Advanced RAG initialized");
  }

  async createAdvancedTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Tabela para chunks de código com embeddings
        this.db.run(`
          CREATE TABLE IF NOT EXISTS code_embeddings (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            file_path TEXT,
            chunk_type TEXT,
            language TEXT,
            embedding BLOB,
            keywords TEXT,
            complexity_score REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Tabela para padrões de código
        this.db.run(`
          CREATE TABLE IF NOT EXISTS code_patterns (
            id TEXT PRIMARY KEY,
            pattern_name TEXT,
            pattern_type TEXT,
            description TEXT,
            code_example TEXT,
            embedding BLOB,
            tags TEXT,
            confidence_score REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Tabela para commits classificados
        this.db.run(`
          CREATE TABLE IF NOT EXISTS commit_analysis (
            id TEXT PRIMARY KEY,
            commit_hash TEXT,
            commit_message TEXT,
            files_changed TEXT,
            classification TEXT,
            refactoring_type TEXT,
            complexity_change REAL,
            risk_score REAL,
            suggestions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async generateEmbedding(text) {
    if (!this.embeddingPipeline) {
      return this.fallbackEmbedding(text);
    }
    
    try {
      const result = await this.embeddingPipeline(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    } catch (error) {
      console.warn('Embedding generation failed, using fallback:', error.message);
      return this.fallbackEmbedding(text);
    }
  }

  fallbackEmbedding(text) {
    // Fallback: hash simples baseado em palavras-chave
    const keywords = this.extractKeywords(text);
    const hash = crypto.createHash('md5').update(keywords.join(' ')).digest();
    return Array.from(hash).slice(0, 384); // Simular embedding de 384 dimensões
  }

  extractKeywords(text) {
    const keywords = new Set();
    
    // Palavras-chave técnicas mais abrangentes
    const techKeywords = [
      'function', 'class', 'const', 'let', 'var', 'async', 'await',
      'import', 'export', 'try', 'catch', 'if', 'else', 'for', 'while',
      'return', 'throw', 'new', 'this', 'super', 'extends', 'implements',
      'interface', 'type', 'enum', 'namespace', 'module', 'require',
      'promise', 'callback', 'event', 'listener', 'middleware', 'route',
      'controller', 'service', 'model', 'view', 'component', 'hook',
      'refactor', 'optimize', 'performance', 'security', 'test', 'mock'
    ];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    words.forEach(word => {
      if (techKeywords.includes(word) || word.length > 4) {
        keywords.add(word);
      }
    });
    
    return Array.from(keywords).slice(0, 50);
  }

  calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async addCodeChunk(content, filePath, chunkType = 'code', language = 'javascript') {
    const id = crypto.randomUUID();
    const keywords = this.extractKeywords(content);
    const embedding = await this.generateEmbedding(content);
    const complexityScore = this.calculateComplexity(content);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO code_embeddings (id, content, file_path, chunk_type, language, embedding, keywords, complexity_score) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, content, filePath, chunkType, language, Buffer.from(embedding), JSON.stringify(keywords), complexityScore],
        (err) => {
          if (err) reject(err);
          else resolve(id);
        }
      );
    });
  }

  calculateComplexity(content) {
    // Métrica de complexidade ciclomática simplificada
    const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
    let complexity = 1;
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) complexity += matches.length;
    });
    
    return Math.min(complexity, 10); // Normalizar para 1-10
  }

  async searchSimilar(query, limit = 5, threshold = 0.3) {
    const queryEmbedding = await this.generateEmbedding(query);
    
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM code_embeddings ORDER BY created_at DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          const results = rows.map(row => {
            const chunkEmbedding = Array.from(row.embedding);
            const similarity = this.calculateCosineSimilarity(queryEmbedding, chunkEmbedding);
            
            return {
              ...row,
              similarity,
              content: row.content.substring(0, 500),
              keywords: JSON.parse(row.keywords || '[]')
            };
          })
          .filter(result => result.similarity > threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit);
          
          resolve(results);
        }
      );
    });
  }

  async addCommitAnalysis(commitData) {
    const id = crypto.randomUUID();
    const {
      commitHash,
      commitMessage,
      filesChanged,
      classification,
      refactoringType,
      complexityChange,
      riskScore,
      suggestions
    } = commitData;
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO commit_analysis (id, commit_hash, commit_message, files_changed, classification, refactoring_type, complexity_change, risk_score, suggestions) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, commitHash, commitMessage, JSON.stringify(filesChanged), classification, refactoringType, complexityChange, riskScore, JSON.stringify(suggestions)],
        (err) => {
          if (err) reject(err);
          else resolve(id);
        }
      );
    });
  }

  async getCommitHistory(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM commit_analysis ORDER BY created_at DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async indexDirectory(directory = './') {
    let indexed = 0;
    await this.walkDirectory(directory, async (filePath, content) => {
      const language = this.detectLanguage(filePath);
      await this.addCodeChunk(content, filePath, 'code', language);
      indexed++;
    });
    
    console.log(`Advanced RAG: Indexed ${indexed} files`);
    return indexed;
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.ts': 'typescript',
      '.jsx': 'javascript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    return languageMap[ext] || 'unknown';
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
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'db', '.vscode'];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  shouldIndexFile(name) {
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb'];
    return extensions.some(ext => name.endsWith(ext));
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default AdvancedRAG; 