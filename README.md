# Resumo do Projeto: Agente de Análise de Código com RAG em Node.js

## Objetivo

Construir um sistema de análise de código-fonte com uso de LLM (como Google Gemini), seguindo a arquitetura Agentic RAG (Retrieval-Augmented Generation). O sistema será escrito em Node.js, de forma modular, simples e extensível — sem uso de engenharia de prompt explícita.

## Arquitetura Agentic RAG (adaptada para Node.js)

    1. Agent – Controla o fluxo: recebe código, decide se precisa de contexto e orquestra chamadas.

    2. Retriever – Recupera dados complementares (documentação, padrões, histórico Git).

    3. LLM – Realiza a análise com base no código e no contexto.

    4. Prompt Builder – Gera entrada estruturada JSON para o modelo.

    5. Saída Estruturada – Retorno em JSON com resumo, problemas e sugestões.

## Tecnologias Utilizadas

    1. LLM	@google/generative-ai (Gemini)
    2. Runtime	Node.js (ESM / TypeScript opcional)
    3. Contextual	Git CLI, arquivos locais ou JSON
    4. Vetorização	(opcional) ChromaDB ou LangChain

## Explicacao Arquitutura 

    project-root/
    ├── agents/
    │   ├── parserAgent.js          # Lê o código e gera estrutura/AST
    │   ├── analyzerAgent.js        # Usa LLM para analisar com base na estrutura
    │   ├── retrieverAgent.js       # (opcional) Recupera contexto adicional
    │   └── agentCoordinator.js     # Coordena todos os agentes
    │   └── patternDetectorAgent.js # Identifica padrões e antipadrões
    │   └── promptBuilder.js        # Constroi/Monta o Prompt
    │
    ├── types/
    │   └── agentTypes.ts         # Tipos base para entrada/saída entre agentes
    │
    ├── main.js                     # Ponto de entrada do sistema
    ├── .env                        # Chave da API, config LLM
    ├── package.json
    └── README.md

I'll analyze your project structure and generate a complete Dockerfile based on your Node.js project. Let me first examine the key files to understand the project requirements. Now I'll generate a complete Dockerfile for your CodeSentry project based on the analysis: 
```


Made changes.


```
I notice the file was already properly configured! Let me create a `.dockerignore` file to complement your Dockerfile and ensure optimal build performance: 

Made changes.

Perfeito! Eu analisei seu projeto CodeSentry e o Dockerfile já está bem configurado. Aqui está o que foi implementado:

## Dockerfile Features

1. **Base Image**: Node.js 22 com Alpine Linux para uma imagem menor
2. **Segurança**: Usuário não-root (`codesentry`) para melhor segurança
3. **Cache Layers**: Copia `package*.json` primeiro para otimizar o cache do Docker
4. **Dependencies**: Instala apenas dependências de produção
5. **Permissions**: Configura permissões adequadas para diretórios `/app/context` e `/app/db`
6. **Health Check**: Verifica se a aplicação está funcionando
7. **Port**: Expõe porta 3000 para futuras implementações HTTP
8. **Entry Point**: Executa main.js como ponto de entrada

## Adicionais

.dockerignore para otimizar o build, excluindo arquivos desnecessários como:
- node_modules
- Arquivos de log
- Arquivos de ambiente
- Documentação
- Arquivos do sistema

## Como usar

Para construir e executar o container:

```bash
# Construir a imagem
docker build -t codesentry .

# Executar o container passando a API_KEY
docker run --rm --env-file .env codesentry

# Ou usando um arquivo .env (recomendado para desenvolvimento)
docker run --rm --env-file .env codesentry

# Para desenvolvimento com bind mount
docker run --rm -v $(pwd):/app -w /app --env-file .env codesentry
```

### Variáveis de Ambiente Necessárias

- `GEMINI_KEY`: Sua chave da API do Google Gemini

### Usando Docker Compose (Recomendado)

```bash
# Rodar com docker-compose (lê automaticamente o .env)
docker-compose up --build

# Ou em modo detached
docker-compose up -d --build
```
docker run --rm -v $(pwd):/app -w /app codesentry
```
