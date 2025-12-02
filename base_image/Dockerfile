FROM node:20-alpine

RUN apk add --no-cache \
    bash \
    sqlite \
    curl


WORKDIR /app
RUN mkdir -p /app/data && chmod 777 /app/data