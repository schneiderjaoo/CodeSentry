# ?? Deploy CodeSentry - Google Cloud

## ?? Pré-requisitos

1. **Google Cloud SDK** instalado
2. **Projeto Google Cloud** criado
3. **APIs habilitadas**:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API

## ?? Configuração Inicial

```bash
# 1. Instalar Google Cloud SDK (se necessário)
# https://cloud.google.com/sdk/docs/install

# 2. Fazer login
gcloud auth login

# 3. Configurar projeto
gcloud config set project YOUR_PROJECT_ID

# 4. Habilitar APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## ??? Deploy Automático

### Opção 1: Usando Makefile (Recomendado)

```bash
# Deploy completo (Build + Deploy)
make gcloud-deploy-full

# Ou separadamente:
make gcloud-build    # Apenas build
make gcloud-deploy   # Apenas deploy
```

### Opção 2: Usando Script

```bash
# Editar PROJECT_ID no script
nano deploy-gcloud.sh

# Executar
chmod +x deploy-gcloud.sh
./deploy-gcloud.sh
```

### Opção 3: Comandos Manuais

```bash
# 1. Build e push da imagem
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/codesentry

# 2. Deploy no Cloud Run
gcloud run deploy codesentry \
  --image gcr.io/YOUR_PROJECT_ID/codesentry \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --update-env-vars-file .env
```

## ?? Configurações

### Variáveis de Ambiente (.env)

```env
PORT=8080
NODE_ENV=production
GOOGLE_API_KEY=your_google_api_key_here
DB_PATH=./db/advanced_rag.db
LOG_LEVEL=info
CORS_ORIGIN=*
RAG_SIMILARITY_THRESHOLD=0.3
RAG_MAX_RESULTS=5
```

### Recursos Cloud Run

- **Memória**: 2Gi (recomendado para RAG)
- **CPU**: 2 vCPUs
- **Instâncias máximas**: 10
- **Timeout**: 300s (5 minutos)
- **Concurrency**: 80 requests por instância

## ?? URLs

Após o deploy, você terá acesso a:

- **Serviço**: `https://codesentry-us-central1-YOUR_PROJECT_ID.a.run.app`
- **Console**: `https://console.cloud.google.com/run/detail/us-central1/codesentry`

## ?? Monitoramento

```bash
# Ver logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=codesentry" --limit=50

# Ver métricas
gcloud run services describe codesentry --region=us-central1
```

## ?? Atualizações

Para atualizar o serviço:

```bash
# Rebuild e redeploy
make gcloud-deploy-full

# Ou apenas redeploy (se não mudou código)
make gcloud-deploy
```

## ??? Troubleshooting

### Erro de Build
```bash
# Ver logs do build
gcloud builds log BUILD_ID
```

### Erro de Deploy
```bash
# Ver logs do serviço
gcloud run services logs read codesentry --region=us-central1
```

### Problemas de Memória
- Aumentar `--memory` para 4Gi
- Verificar se o RAG não está consumindo muita memória

### Problemas de Timeout
- Aumentar `--timeout` para 600s
- Verificar se as operações de RAG não estão demorando muito

## ?? Custos

- **Cloud Run**: Pay-per-use (só paga quando ativo)
- **Cloud Build**: ~$0.003 por minuto de build
- **Container Registry**: ~$0.026 por GB/mês

## ?? Segurança

- ? Usuário não-root no container
- ? Health checks configurados
- ? Variáveis de ambiente seguras
- ? HTTPS automático
- ?? `--allow-unauthenticated` (remover se precisar de auth) 