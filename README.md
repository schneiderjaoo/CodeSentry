# Use Node.js 22 with Alpine Linux for smaller image size
FROM node:22-alpine3.21

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S codesentry -u 1001

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY --chown=codesentry:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/context /app/db && \
    chown -R codesentry:nodejs /app

# Switch to non-root user
USER codesentry

# Expose port for Cloud Run
EXPOSE 8080

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=8080

# Health check updated for HTTP server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Default command
CMD ["node", "main.js"]# CodeSentry - Agente de Análise de Código com RAG

## 📋 Resumo do Projeto

CodeSentry é um sistema de análise de código que combina múltiplos agentes especializados com **Retrieval-Augmented Generation (RAG)** para fornecer insights profundos sobre mudanças no código. O sistema analisa git diffs e oferece:

- **Análise Semântica** com Google Gemini
- **Detecção de Padrões** baseada em regras e similaridade
- **Contexto Enriquecido** através de RAG com base de conhecimento local
- **Insights Automáticos** sobre qualidade e boas práticas

## 🏗️ Arquitetura do Sistema

```
CodeSentry/
├── agents/
│   ├── agentCoordinator.js     # Orquestra todos os agentes
│   ├── parserAgent.js          # Parse de git diff + enriquecimento RAG
│   ├── analyzerAgent.js        # Análise semântica com LLM
│   ├── patternDetectorAgent.js # Detecção de padrões + RAG
│   ├── retrieverAgent.js       # Recuperação de contexto
│   └── simpleRAG.js           # Sistema RAG com SQLite
├── db/
│   ├── rules.json             # Regras de padrões/antipadrões
│   └── rag_knowledge.db       # Base de conhecimento SQLite
├── main.js                    # Ponto de entrada
└── README.md
```

## 🧠 Como Funciona

### 1. **Inicialização RAG**
```javascript
await initializeRAG();
```
- Cria banco SQLite local (`./db/rag_knowledge.db`)
- Indexa automaticamente toda a base de código
- Extrai palavras-chave e calcula similaridades

### 2. **Pipeline de Análise**
```javascript
const result = await runAgenticPipeline(gitDiff);
```

**Fluxo dos Agentes:**

1. **Parser Agent** → Processa git diff + busca código similar
2. **Analyzer Agent** → Análise semântica com Gemini
3. **Pattern Detector** → Detecta padrões usando regras + RAG
4. **Retriever Agent** → Adiciona contexto relevante

### 3. **Sistema RAG Simplificado**

**Tecnologia:** SQLite + Similaridade Jaccard (em vez de ChromaDB)

**Como funciona:**
- ✅ **Indexação**: Extrai palavras-chave de cada arquivo
- ✅ **Busca**: Calcula similaridade entre códigos
- ✅ **Contexto**: Enriquece análise com exemplos similares
- ✅ **Local**: Sem dependências externas

```javascript
// Exemplo de saída RAG
{
  ragContext: {
    similarPatterns: [
      {
        content: "function greet(name) { ... }",
        similarity: 0.85,
        file_path: "./utils/helpers.js"
      }
    ],
    hasContext: true
  }
}
```

## 🚀 Como Usar

### **Execução Simples (Recomendado)**
```bash
# Instalar dependências
npm install

# Executar com Makefile
make run

# Ou executar diretamente
node main.js
```

### **Outras Opções**
```bash
# Só construir imagem Docker
make build

# Modo desenvolvimento (com volumes)
make run-dev

# Limpar containers e imagens
make clean

# Ver ajuda
make help
```

### **Docker Compose**
```bash
# Executar com docker-compose
docker-compose up --build

# Modo desenvolvimento
docker-compose -f docker-compose.dev.yml up
```

## 📊 Exemplo de Execução

**Input (Git Diff):**
```diff
diff --git a/index.js b/index.js
+function greet(name) {
+  console.log("Hello, " + name) 
+}
+
+greet("Hello, world!");
```

**Output:**
```javascript
{
  semanticResult: "Função simples de saudação. Considera usar template literals.",
  patterns: {
    patterns: [
      { rule: "function_declaration", confidence: 1.0 }
    ],
    antipatterns: [
      { rule: "string_concatenation", confidence: 0.8 }
    ],
    ragInsights: [
      { 
        description: "Similar code found in ./utils/helpers.js",
        similarity: 0.75
      }
    ]
  },
  stats: {
    filesAnalyzed: 1,
    ragEnhanced: 1
  }
}
```

## 🔧 Configuração

### **Variáveis de Ambiente**
```bash
# .env
GEMINI_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### **Dependências Principais**
```json
{
  "@google/generative-ai": "^0.21.0",
  "sqlite3": "^5.1.6",
  "node-nlp": "^4.27.0",
  "dotenv": "^16.4.7"
}
```

## 🐳 Docker

### **Estrutura Docker**
- **Dockerfile**: Imagem otimizada com Node.js 22 Alpine
- **docker-compose.yml**: Execução simples com variáveis de ambiente
- **docker-compose.dev.yml**: Modo desenvolvimento com hot-reload
- **.dockerignore**: Exclui arquivos desnecessários do build

### **Características do Dockerfile**
- ✅ **Segurança**: Usuário não-root
- ✅ **Otimização**: Cache de layers para dependencies
- ✅ **Saúde**: Health check integrado
- ✅ **Leve**: Base Alpine Linux

## 🎯 Features Implementadas

### **✅ RAG (Retrieval-Augmented Generation)**
- Sistema de busca por similaridade local
- Base de conhecimento em SQLite
- Enriquecimento automático de contexto
- Sem dependências externas complexas

### **✅ Análise Multi-Agente**
- Parser inteligente de git diffs
- Análise semântica com LLM
- Detecção de padrões híbrida (regras + ML)
- Contexto enriquecido

### **✅ Docker Ready**
- Containers otimizados
- Múltiplos modos de execução
- Fácil deployment

## 📝 Logs de Exemplo

```bash
$ make run
Initializing Simple RAG knowledge base...
Indexed 15 files in knowledge base
Simple RAG initialization completed successfully

=== Enhanced Analysis Results ===
Semantic Analysis: Função bem estruturada, considera usar template literals
Patterns: { patterns: [...], antipatterns: [...], ragInsights: [...] }
Stats: { filesAnalyzed: 1, ragEnhanced: 1 }
```

---

**Tecnologias:** Node.js, Google Gemini, SQLite, Docker, NLP
**Licença:** MIT

## ⚡ Comandos Rápidos - Google Cloud Run

### **🚀 Subir o Serviço**
```bash
# Deploy
gcloud run deploy codesentry --source . --set-env-vars="GEMINI_KEY=AIzaSyCGE-4RP-2m2QRn0gnXhH6XytlcB4i_Zq8" --allow-unauthenticated

# Redeploy (atualizar)
gcloud run deploy codesentry --source .
```

### **🛑 Descer o Serviço**
```bash
# Parar (economizar)
gcloud run services update codesentry --no-traffic --region=us-central1

# Deletar
gcloud run services delete codesentry --region=us-central1
```

### **🔄 Controlar**
```bash
# Status
gcloud run services list

# Reativar
gcloud run services update codesentry --traffic=100 --region=us-central1

# URL
gcloud run services describe codesentry --region=us-central1 --format="value(status.url)"
```

### **🧪 Testar**
```bash
# Health check
curl $(gcloud run services describe codesentry --region=us-central1 --format="value(status.url)")/health

# Demo
curl $(gcloud run services describe codesentry --region=us-central1 --format="value(status.url)")/demo
```

| Ação | Comando |
|------|---------|
| **🚀 Subir** | `gcloud run deploy codesentry --source .` |
| **⏸️ Parar** | `gcloud run services update codesentry --no-traffic` |
| **🗑️ Deletar** | `gcloud run services delete codesentry` |
| **📊 Status** | `gcloud run services list` |
