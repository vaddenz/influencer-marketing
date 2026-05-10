FROM node:22 AS builder

WORKDIR /app
# Copy source code
COPY . .
# Install all dependencies (including dev dependencies for building)
RUN yarn --frozen-lockfile --ignore-optional
# Generate Prisma client and build application
RUN yarn prisma:gen && yarn build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app
ENV PORT 3000 
ENV HOST 0.0.0.0
ENV NODE_ENV=production
 
# Copy built application and production dependencies from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

CMD ["yarn", "start:prod"]