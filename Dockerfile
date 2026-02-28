# ------------------------------
# Stage 1: Dependencies
# ------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ------------------------------
# Stage 2: Production image
# ------------------------------
FROM node:20-alpine AS runner

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy application (migrations, src, public)
COPY . .

# Owned by nodejs user
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run migrations then start (depends_on + healthchecks ensure DB/Redis are ready)
CMD ["sh", "-c", "npx knex migrate:latest && exec node server.js"]
