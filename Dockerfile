# syntax=docker/dockerfile:1

FROM node:22-alpine AS runtime

# Application directory
WORKDIR /var/src

# Run as non-root
USER node

# Copy dependency manifests first for better layer caching
COPY --chown=node:node ./src/package.json ./src/package-lock.json ./

# Install only production dependencies
RUN npm install --legacy-peer-deps
# Copy application source
# .dockerignore prevents .env and node_modules from being copied
COPY --chown=node:node ./src/ ./

# Application port
EXPOSE 3000

# Start application
CMD ["node", "app.js"]
