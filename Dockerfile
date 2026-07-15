# syntax=docker/dockerfile:1

# ---------- deps (somente producao, para a imagem final) ----------
FROM node:22-alpine AS deps
WORKDIR /app
# better-sqlite3 compila addon nativo no install; sem prebuild musl, precisa de toolchain.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
# libstdc++ — dependencia de runtime do addon nativo do better-sqlite3, sem toolchain de build.
RUN apk add --no-cache libstdc++ && \
    addgroup -S myprovenance && adduser -S myprovenance -G myprovenance

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./

# DB_PATH deve apontar para um volume montado fora do container.
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER myprovenance
CMD ["node", "build/index.js"]
