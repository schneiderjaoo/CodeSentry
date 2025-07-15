# Use Node.js 22 with Debian slim for ONNX Runtime compatibility
FROM node:22-slim

# Compatível com Google Cloud Run/App Engine

# Set working directory
WORKDIR /app

# Install system dependencies for ONNX Runtime
RUN apt-get update && apt-get install -y \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r codesentry && useradd -r -g codesentry codesentry

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies with security updates
RUN npm ci --only=production --audit=false && \
    npm cache clean --force

# Copy the rest of the application code
COPY --chown=codesentry:codesentry . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/db && \
    chown -R codesentry:codesentry /app

# Switch to non-root user
USER codesentry

# Expose port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production \
    PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Default command
CMD ["node", "main.js"]

