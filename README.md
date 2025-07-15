# CodeSentry - Agente RAG Avan�ado para An�lise de C�digo

CodeSentry � um sistema avan�ado de an�lise de c�digo que combina m�ltiplos agentes especializados com **Retrieval-Augmented Generation (RAG)** para fornecer insights profundos sobre mudan�as no c�digo. O sistema analisa git diffs, classifica commits, detecta refatora��es e oferece sugest�es de melhorias.

- ?? **An�lise Sem�ntica** com Google Gemini
- ??? **Classifica��o Autom�tica de Commits** (feature, bugfix, refactor, etc.)
- ??? **Detec��o de Padr�es de Refatora��o** (extract method, rename, move, etc.)
- ?? **RAG Avan�ado** com embeddings e busca sem�ntica
- ?? **M�tricas de Qualidade** (complexidade, risco, similaridade)
- ?? **Detec��o de Padr�es** baseada em regras e ML
- ?? **Estat�sticas e Hist�rico** de commits e refatora��es

## Estrutura do Projeto

```
CodeSentry/
??? agents/
?   ??? analyzerAgent.js             # An�lise sem�ntica com LLM
?   ??? patternDetectorAgent.js      # Detec��o de padr�es + RAG
?   ??? retrieverAgent.js           # Recupera��o de contexto
?   ??? commitClassifierAgent.js    # Classifica��o de commits
?   ??? refactoringAnalyzerAgent.js # An�lise de refatora��o
?   ??? advancedRAG.js              # RAG avan�ado com embeddings
?   ??? promptBuilder.js            # Montagem de prompts
?   ??? agentCoordinator.js         # Orquestra��o dos agentes
??? db/
?   ??? rules.json                  # Regras de padr�es/antipadr�es
?   ??? advanced_rag.db             # Base avan�ada com embeddings
??? public/
?   ??? index.html                  # Frontend web
?   ??? style.css                   # Estilos com tabs e formul�rios
?   ??? script.js                   # L�gica do frontend
??? test/                           # Testes automatizados
??? main.js                         # Servidor principal
??? Dockerfile                      # Container Docker
??? docker-compose.yml              # Orquestra��o produ��o
??? docker-compose.dev.yml          # Orquestra��o desenvolvimento
??? Makefile                        # Comandos automatizados
??? README.md                       # Documenta��o atualizada
```

### 1. **Sistema RAG Avan�ado**

// Inicializa��o com embeddings
- **Embeddings**: Usa Xenova/transformers para vetoriza��o sem�ntica
- **Similaridade**: C�lculo de similaridade cosseno entre vetores
- **Fallback**: Sistema de hash para quando embeddings n�o est�o dispon�veis
- **M�ltiplas Linguagens**: Suporte para JS, TS, Python, Java, C++, Go, Rust, etc.

### 2. **Classifica��o de Commits**

- `feature` - Novas funcionalidades
- `bugfix` - Corre��es de bugs
- `refactor` - Refatora��es
- `docs` - Documenta��o
- `test` - Testes
- `style` - Formata��o
- `security` - Seguran�a
- `chore` - Manuten��o
- `hotfix` - Corre��es urgentes

### 3. **An�lise de Refatora��o**

**Padr�es Detectados:**
- `extract_method` - Extra��o de m�todo
- `extract_class` - Extra��o de classe
- `rename_method` - Renomear m�todo
- `move_method` - Mover m�todo
- `inline_method` - Inline de m�todo
- `pull_up` / `push_down` - Heran�a
- `modularization` - Modulariza��o

### 4. **Pipeline de An�lise Completo**

**Fluxo dos Agentes:**
1. **Parser Agent** ? Processa git diff + busca c�digo similar
2. **Commit Classifier** ? Classifica tipo de commit e calcula risco
3. **Refactoring Analyzer** ? Detecta padr�es de refatora��o
4. **Analyzer Agent** ? An�lise sem�ntica com Gemini
5. **Pattern Detector** ? Detecta padr�es usando regras + RAG
6. **Retriever Agent** ? Adiciona contexto relevante

## Como Usar

### **Execu��o Simples**
```bash
# Instalar depend�ncias
npm install

# Executar com Makefile
make run

# Ou executar diretamente
node main.js
```

### **Novos Endpoints API**

#### An�lise Geral
```bash
POST /api/analyze
{
  "gitDiff": "diff --git a/file.js b/file.js..."
}
```

#### An�lise de Commit
```bash
POST /api/analyze-commit
{
  "gitDiff": "diff --git a/file.js b/file.js...",
  "commitMessage": "feat: add new feature",
  "commitHash": "a1b2c3d4"
}
```

#### An�lise de Refatora��o
```bash
POST /api/analyze-refactoring
{
  "gitDiff": "diff --git a/file.js b/file.js...",
  "beforeCode": "function oldCode() { ... }",
  "afterCode": "function newCode() { ... }"
}
```

#### Estat�sticas
```bash
GET /api/commit-stats
GET /api/refactoring-stats
GET /api/commit-history?limit=10
```

### **Interface Web**

A interface web agora inclui:
- **Tabs** para diferentes tipos de an�lise
- **Formul�rios** para commit message e hash
- **Campos** para c�digo antes/depois
- **Bot�o de estat�sticas** para visualizar hist�rico
- **Cards espec�ficos** para cada tipo de an�lise

## Exemplo de Sa�da

### An�lise de Commit
```json
{
  "commitAnalysis": {
    "classification": "feature",
    "refactoringType": "extract_method",
    "complexityChange": -1,
    "riskScore": 0.3,
    "suggestions": [
      "Consider adding unit tests for the new function",
      "The extracted method improves code readability"
    ],
    "patterns": [
      "function_extraction",
      "code_organization"
    ]
  },
  "refactoringAnalysis": {
    "refactoringType": "extract_method",
    "confidence": 0.85,
    "improvements": [
      "Reduced function complexity",
      "Improved code reusability"
    ],
    "risks": [
      "Ensure the extracted method is properly tested"
    ],
    "complexity": {
      "before": 8,
      "after": 3,
      "change": -5
    }
  },
  "stats": {
    "filesAnalyzed": 1,
    "commitType": "feature",
    "refactoringType": "extract_method",
    "confidence": 0.85
  }
}
```

## Configura��o

### **Vari�veis de Ambiente**
```bash
# .env
GEMINI_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### **Depend�ncias Principais**
```json
{
  "@google/generative-ai": "^0.21.0",
  "@xenova/transformers": "^2.15.0",
  "sqlite3": "^5.1.6",
  "node-nlp": "^4.27.0",
  "natural": "^6.10.4",
  "string-similarity": "^4.0.4"
}
```

## Docker

### **Execu��o com Docker**
```bash
# Construir e executar
make run

# Modo desenvolvimento
make run-dev

# Ver estat�sticas
docker exec -it codesentry curl http://localhost:8080/api/commit-stats
```

## M�tricas e Estat�sticas

### **M�tricas de Commit**
- **Tipo de commit** (feature, bugfix, etc.)
- **Score de risco** (0-1, baseado em conte�do e tipo)
- **Mudan�a de complexidade** (-1, 0, +1)
- **Arquivos modificados**

### **M�tricas de Refatora��o**
- **Tipo de refatora��o** detectado
- **Confian�a** da detec��o (0-1)
- **Complexidade ciclom�tica** antes/depois
- **Melhorias e riscos** identificados

### **M�tricas RAG**
- **Similaridade** com c�digo existente
- **Padr�es** encontrados na base de conhecimento
- **Contexto** enriquecido

## Melhorias Implementadas

### ? **Sistema RAG Avan�ado**
- Embeddings com Xenova/transformers
- Similaridade cosseno
- Fallback para hash-based search
- Suporte a m�ltiplas linguagens
- Base de conhecimento persistente

### ? **Classifica��o de Commits**
- Detec��o autom�tica de tipos
- C�lculo de risco baseado em conte�do
- An�lise de mudan�a de complexidade
- Sugest�es espec�ficas por tipo

### ? **An�lise de Refatora��o**
- Detec��o de 10+ padr�es de refatora��o
- M�tricas de complexidade
- Identifica��o de melhorias e riscos
- An�lise antes/depois

### ? **Interface Web Melhorada**
- Sistema de tabs para diferentes an�lises
- Formul�rios espec�ficos por tipo
- Cards de resultado especializados
- Visualiza��o de estat�sticas

### ? **API Expandida**
- Endpoints espec�ficos por tipo de an�lise
- Estat�sticas e hist�rico
- Par�metros opcionais (commit message, hash, etc.)

## Testes

```bash
# Executar testes
npm test

# Testes espec�ficos
npm test parserAgent.test.js
npm test patternDetectorAgent.test.js
```

## Roadmap

### **Pr�ximas Melhorias**
- [ ] **Integra��o com Git Hooks** para an�lise autom�tica
- [ ] **Dashboard de M�tricas** em tempo real
- [ ] **An�lise de Depend�ncias** entre commits
- [ ] **Sugest�es de Refatora��o** autom�ticas
- [ ] **Integra��o com IDEs** (VS Code, IntelliJ)
- [ ] **An�lise de Performance** de mudan�as
- [ ] **Detec��o de Code Smells** avan�ada
- [ ] **Relat�rios de Qualidade** peri�dicos

### **Melhorias T�cnicas**
- [ ] **Vector Database** (ChromaDB, Pinecone)
- [ ] **Fine-tuning** de modelos para c�digo
- [ ] **An�lise de Sentimento** de commits
- [ ] **Predi��o de Bugs** baseada em padr�es
- [ ] **An�lise de Seguran�a** automatizada

## Contribui��o

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudan�as (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licen�a

Este projeto est� sob a licen�a ISC. Veja o arquivo `LICENSE` para mais detalhes.

## Agradecimentos

- **Google Gemini** pela API de IA
- **Xenova** pelos transformers para embeddings
- **SQLite** pela base de dados local
- **Node.js** pela plataforma de execu��o

---

**CodeSentry** - Transformando an�lise de c�digo com IA avan�ada! ??
