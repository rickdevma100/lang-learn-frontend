# Stage 1: Build the React Application
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency configs
COPY package.json ./

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy configuration and code files
COPY vite.config.js index.html ./
COPY src/ src/

# Build static bundle (generates 'dist/' folder)
RUN npm run build

# Stage 2: Serve the application using Node/Express BFF
FROM node:20-slim

WORKDIR /app

# Copy dependency configs
COPY package.json ./

# Install ONLY production dependencies
RUN npm install --only=production

# Copy static assets from builder stage
COPY --from=builder /app/dist ./dist

# Copy production Express server
COPY server.js ./

# Set environment defaults (can be overridden by Helm chart values)
ENV PORT=3000
ENV API_URL=http://lang-learn-inference-predictor.lang-learn.svc.cluster.local

EXPOSE 3000

CMD ["node", "server.js"]
