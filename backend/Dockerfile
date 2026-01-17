# Production Dockerfile for NestJS Backend
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies with Yarn
RUN yarn install --frozen-lockfile

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN yarn prisma generate

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production

# Copy Prisma files and generate client
COPY --from=builder /app/prisma ./prisma/
RUN yarn prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup --gid 1001 nodejs \
    && adduser --uid 1001 --ingroup nodejs --disabled-password --gecos "" nestjs

USER nestjs

# Expose port
EXPOSE 3001

# Production command
CMD ["node", "dist/main"]
