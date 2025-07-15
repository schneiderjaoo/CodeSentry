# CodeSentry - Agente RAG Avançado para Análise de Código

CodeSentry é um sistema avançado de análise de código que combina múltiplos agentes especializados com **Retrieval-Augmented Generation (RAG)** para fornecer insights profundos sobre mudanças no código. O sistema analisa git diffs, classifica commits, detecta refatorações e oferece sugestões de melhorias.

- ?? **Análise Semântica** com Google Gemini
- ??? **Classificação Automática de Commits** (feature, bugfix, refactor, etc.)
- ??? **Detecção de Padrões de Refatoração** (extract method, rename, move, etc.)
- ?? **RAG Avançado** com embeddings e busca semântica
- ?? **Métricas de Qualidade** (complexidade, risco, similaridade)
- ?? **Detecção de Padrões** baseada em regras e ML
- ?? **Estatísticas e Histórico** de commits e refatorações

## Estrutura do Projeto

```
CodeSentry/
??? agents/
?   ??? analyzerAgent.js             # Análise semântica com LLM
?   ??? patternDetectorAgent.js      # Detecção de padrões + RAG
?   ??? retrieverAgent.js           # Recuperação de contexto
?   ??? commitClassifierAgent.js    # Classificação de commits
?   ??? refactoringAnalyzerAgent.js # Análise de refatoração
?   ??? advancedRAG.js              # RAG avançado com embeddings
?   ??? promptBuilder.js            # Montagem de prompts
?   ??? agentCoordinator.js         # Orquestração dos agentes
??? db/
?   ??? rules.json                  # Regras de padrões/antipadrões
?   ??? advanced_rag.db             # Base avançada com embeddings
??? public/
?   ??? index.html                  # Frontend web
?   ??? style.css                   # Estilos com tabs e formulários
?   ??? script.js                   # Lógica do frontend
??? test/                           # Testes automatizados
??? main.js                         # Servidor principal
??? Dockerfile                      # Container Docker
??? docker-compose.yml              # Orquestração produção
??? docker-compose.dev.yml          # Orquestração desenvolvimento
??? Makefile                        # Comandos automatizados
??? README.md                       # Documentação atualizada
```

### 1. **Sistema RAG Avançado**

// Inicialização com embeddings
- **Embeddings**: Usa Xenova/transformers para vetorização semântica
- **Similaridade**: Cálculo de similaridade cosseno entre vetores
- **Fallback**: Sistema de hash para quando embeddings não estão disponíveis
- **Múltiplas Linguagens**: Suporte para JS, TS, Python, Java, C++, Go, Rust, etc.

### 2. **Classificação de Commits**

- `feature` - Novas funcionalidades
- `bugfix` - Correções de bugs
- `refactor` - Refatorações
- `docs` - Documentação
- `test` - Testes
- `style` - Formatação
- `security` - Segurança
- `chore` - Manutenção
- `hotfix` - Correções urgentes

### 3. **Análise de Refatoração**

**Padrões Detectados:**
- `extract_method` - Extração de método
- `extract_class` - Extração de classe
- `rename_method` - Renomear método
- `move_method` - Mover método
- `inline_method` - Inline de método
- `pull_up` / `push_down` - Herança
- `modularization` - Modularização

### 4. **Pipeline de Análise Completo**

**Fluxo dos Agentes:**
1. **Parser Agent** ? Processa git diff + busca código similar
2. **Commit Classifier** ? Classifica tipo de commit e calcula risco
3. **Refactoring Analyzer** ? Detecta padrões de refatoração
4. **Analyzer Agent** ? Análise semântica com Gemini
5. **Pattern Detector** ? Detecta padrões usando regras + RAG
6. **Retriever Agent** ? Adiciona contexto relevante

## Como Usar

### **Execução Simples**
```bash
# Instalar dependências
npm install

# Executar com Makefile
make run

# Ou executar diretamente
node main.js
```

### **Novos Endpoints API**

#### Análise Geral
```bash
POST /api/analyze
{
  "gitDiff": "diff --git a/file.js b/file.js..."
}
```

#### Análise de Commit
```bash
POST /api/analyze-commit
{
  "gitDiff": "diff --git a/file.js b/file.js...",
  "commitMessage": "feat: add new feature",
  "commitHash": "a1b2c3d4"
}
```

#### Análise de Refatoração
```bash
POST /api/analyze-refactoring
{
  "gitDiff": "diff --git a/file.js b/file.js...",
  "beforeCode": "function oldCode() { ... }",
  "afterCode": "function newCode() { ... }"
}
```

#### Estatísticas
```bash
GET /api/commit-stats
GET /api/refactoring-stats
GET /api/commit-history?limit=10
```

### **Interface Web**

A interface web agora inclui:
- **Tabs** para diferentes tipos de análise
- **Formulários** para commit message e hash
- **Campos** para código antes/depois
- **Botão de estatísticas** para visualizar histórico
- **Cards específicos** para cada tipo de análise

## Exemplo de Saída

### Análise de Commit
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

## Configuração

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
  "@xenova/transformers": "^2.15.0",
  "sqlite3": "^5.1.6",
  "node-nlp": "^4.27.0",
  "natural": "^6.10.4",
  "string-similarity": "^4.0.4"
}
```

## Docker

### **Execução com Docker**
```bash
# Construir e executar
make run

# Modo desenvolvimento
make run-dev

# Ver estatísticas
docker exec -it codesentry curl http://localhost:8080/api/commit-stats
```

## Métricas e Estatísticas

### **Métricas de Commit**
- **Tipo de commit** (feature, bugfix, etc.)
- **Score de risco** (0-1, baseado em conteúdo e tipo)
- **Mudança de complexidade** (-1, 0, +1)
- **Arquivos modificados**

### **Métricas de Refatoração**
- **Tipo de refatoração** detectado
- **Confiança** da detecção (0-1)
- **Complexidade ciclomática** antes/depois
- **Melhorias e riscos** identificados

### **Métricas RAG**
- **Similaridade** com código existente
- **Padrões** encontrados na base de conhecimento
- **Contexto** enriquecido

## Melhorias Implementadas

### ? **Sistema RAG Avançado**
- Embeddings com Xenova/transformers
- Similaridade cosseno
- Fallback para hash-based search
- Suporte a múltiplas linguagens
- Base de conhecimento persistente

### ? **Classificação de Commits**
- Detecção automática de tipos
- Cálculo de risco baseado em conteúdo
- Análise de mudança de complexidade
- Sugestões específicas por tipo

### ? **Análise de Refatoração**
- Detecção de 10+ padrões de refatoração
- Métricas de complexidade
- Identificação de melhorias e riscos
- Análise antes/depois

### ? **Interface Web Melhorada**
- Sistema de tabs para diferentes análises
- Formulários específicos por tipo
- Cards de resultado especializados
- Visualização de estatísticas

### ? **API Expandida**
- Endpoints específicos por tipo de análise
- Estatísticas e histórico
- Parâmetros opcionais (commit message, hash, etc.)

## Testes

```bash
# Executar testes
npm test

# Testes específicos
npm test parserAgent.test.js
npm test patternDetectorAgent.test.js
```
## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.
---

**CodeSentry** - Transformando análise de código com IA avançada!
