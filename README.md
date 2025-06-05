# Resumo do Projeto: Agente de Análise de Código com RAG em Node.js

## Objetivo

Construir um sistema de análise de código-fonte com uso de LLM (como Google Gemini), seguindo a arquitetura Agentic RAG (Retrieval-Augmented Generation). O sistema será escrito em Node.js, de forma modular, simples e extensível — sem uso de engenharia de prompt explícita.

## Arquitetura Agentic RAG (adaptada para Node.js)

    1. Agent – Controla o fluxo: recebe código, decide se precisa de contexto e orquestra chamadas.

    2. Retriever – Recupera dados complementares (documentação, padrões, histórico Git).

    3. LLM – Realiza a análise com base no código e no contexto.

    4. Prompt Builder – Gera entrada estruturada JSON para o modelo.

    5. Saída Estruturada – Retorno em JSON com resumo, problemas e sugestões.

## Estrutura de Diretórios

codesentry/
│
├── agent/
│   ├── agent.js              → Coordena análise completa
│   └── promptBuilder.js      → Gera entrada estruturada para o modelo
│
├── retriever/
│   └── retriever.js          → Faz busca contextual (ex: docs, histórico)
│
├── llm/
│   └── llmClient.js          → Integração com o Google Gemini
│
├── utils/
│   └── heuristics.js         → Decide se precisa de contexto
│
├── types/
│   └── analysis.d.ts         → Tipos Node para análise
│
├── main.js                   → Ponto de entrada (CLI ou API)
├── .env                      → Chave GEMINI_KEY
├── package.json
└── README.md

## Tecnologias Utilizadas

    1. Camada	Ferramenta
    2. LLM	@google/generative-ai (Gemini)
    3. Runtime	Node.js (ESM / TypeScript opcional)
    4. Contextual	Git CLI, arquivos locais ou JSON
    5. Vetorização	(opcional) ChromaDB ou LangChain