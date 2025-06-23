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
    │
    ├── types/
    │   └── agentTypes.ts         # Tipos base para entrada/saída entre agentes
    │
    ├── main.js                     # Ponto de entrada do sistema
    ├── .env                        # Chave da API, config LLM
    ├── package.json
    └── README.md
