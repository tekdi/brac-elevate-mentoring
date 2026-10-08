# syntax=docker/dockerfile:1

FROM node:22-alpine

# Application directory
WORKDIR /var/src

# Copy dependency manifests first
# This improves Docker layer caching
COPY ./src/package.json ./src/package-lock.json ./

# Install production dependencies
# Run this as root because /var/src is root-owned
RUN npm install --legacy-peer-deps
# Copy application source
# .dockerignore prevents node_modules and .env files
# from entering the build context
COPY ./src/ ./

# Ensure application files belong to the non-root user
RUN chown -R node:node /var/src

# Run application as non-root
USER node

# Application port
EXPOSE 3000

# Start application
CMD ["node", "app.js"]
