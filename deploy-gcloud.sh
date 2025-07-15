#!/bin/bash

# Script de Deploy para Google Cloud Run
# CodeSentry - RAG Agent System

set -e

# Configurações
PROJECT_ID="your-project-id"
SERVICE_NAME="codesentry"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "?? Deploying CodeSentry to Google Cloud Run..."

# 1. Configurar projeto (se necessário)
echo "?? Setting up project..."
gcloud config set project $PROJECT_ID

# 2. Habilitar APIs necessárias
echo "?? Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# 3. Build e push da imagem
echo "??? Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME

# 4. Deploy no Cloud Run
echo "?? Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --update-env-vars-file .env

echo "? Deploy completed successfully!"
echo "?? Service URL: https://$SERVICE_NAME-$REGION-$PROJECT_ID.a.run.app"
echo "?? Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME" 