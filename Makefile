# Makefile para CodeSentry - Docker Compose Edition

.PHONY: build up down dev clean logs help gcloud-build gcloud-deploy gcloud-deploy-full

# Construir e subir em produ��o
build:
	docker-compose build

# Subir em produ��o
up: build
	docker-compose up -d

# Subir em desenvolvimento (hot reload)
dev:
	docker-compose -f docker-compose.dev.yml up --build

# Parar todos os servi�os
down:
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

# Ver logs
logs:
	docker-compose logs -f

# Logs de desenvolvimento
logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

# Limpar tudo
clean: down
	docker system prune -f

# Google Cloud - Build da imagem
gcloud-build:
	@echo "??? Building for Google Cloud..."
	gcloud builds submit --tag gcr.io/$(shell gcloud config get-value project)/codesentry

# Google Cloud - Deploy no Cloud Run
gcloud-deploy:
	@echo "?? Deploying to Google Cloud Run..."
	gcloud run deploy codesentry \
		--image gcr.io/$(shell gcloud config get-value project)/codesentry \
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

# Google Cloud - Build + Deploy completo
gcloud-deploy-full: gcloud-build gcloud-deploy
	@echo "? Full deployment completed!"

# Mostrar ajuda
help:
	@echo "Comandos dispon�veis:"
	@echo ""
	@echo "?? Local Development:"
	@echo "  make build     - Construir imagens Docker"
	@echo "  make up        - Subir em produ��o (porta 8080)"
	@echo "  make dev       - Subir em desenvolvimento (porta 3000, hot reload)"
	@echo "  make down      - Parar todos os servi�os"
	@echo "  make logs      - Ver logs de produ��o"
	@echo "  make logs-dev  - Ver logs de desenvolvimento"
	@echo "  make clean     - Limpar containers e imagens"
	@echo ""
	@echo "?? Google Cloud:"
	@echo "  make gcloud-build        - Build da imagem no Cloud Build"
	@echo "  make gcloud-deploy       - Deploy no Cloud Run"
	@echo "  make gcloud-deploy-full  - Build + Deploy completo"
	@echo ""
	@echo "  make help      - Mostrar esta ajuda"
