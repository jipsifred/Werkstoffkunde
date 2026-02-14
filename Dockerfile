FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built frontend + server source
COPY --from=build /app/dist ./dist
COPY server ./server
COPY tsconfig.json ./

# Data directory for SQLite (mount a volume here)
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DB_PATH=/data/wk1-karteikarten.db
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "server/index.ts"]
