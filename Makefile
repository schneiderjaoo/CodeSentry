# Makefile para CodeSentry

.PHONY: build run run-dev clean help

# Construir a imagem
build:
	docker build -t codesentry .

# Rodar como no comando docker run --rm (comportamento one-shot)
run: build
	docker run --rm --env-file .env codesentry

# Rodar com docker-compose (similar ao comando original)
run-compose:
	docker-compose up --build --remove-orphans
	docker-compose down --remove-orphans

# Rodar em modo desenvolvimento (com volumes montados)
run-dev:
	docker-compose -f docker-compose.dev.yml up --build

# Limpar containers e imagens
clean:
	docker-compose down --remove-orphans
	docker rmi codesentry 2>/dev/null || true
	docker system prune -f

# Mostrar ajuda
help:
	@echo "Comandos disponíveis:"
	@echo "  make build     - Construir a imagem Docker"
	@echo "  make run       - Rodar como 'docker run --rm --env-file .env codesentry'"
	@echo "  make run-compose - Rodar com docker-compose"
	@echo "  make run-dev   - Rodar em modo desenvolvimento"
	@echo "  make clean     - Limpar containers e imagens"
	@echo "  make help      - Mostrar esta ajuda"
