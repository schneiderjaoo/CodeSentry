# Use Node.js 22 with Alpine Linux for smaller image size
FROM node:22-alpine3.21

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S codesentry -u 1001

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY --chown=codesentry:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/context /app/db && \
    chown -R codesentry:nodejs /app

# Switch to non-root user
USER codesentry

# Expose port for Cloud Run
EXPOSE 8080

# Environment variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=8080

# Health check updated for HTTP server
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Default command
CMD ["node", "main.js"]

