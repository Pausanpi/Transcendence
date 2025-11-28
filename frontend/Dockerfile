FROM node:20-alpine AS builder

# Instalar TypeScript
RUN npm install -g typescript

# Copiar archivos TypeScript y configuración
WORKDIR /build
COPY *.ts ./
COPY tsconfig.json ./

# Compilar TypeScript
RUN tsc

# Etapa final
FROM alpine:3

# Optional: install simple tools (not needed but harmless)
RUN apk add --no-cache bash

# Copiar archivos compilados y HTML
WORKDIR /app
COPY index.html ./
COPY --from=builder /build/dist ./dist

# This container does not serve anything — nginx will read the files
CMD ["sleep", "infinity"]