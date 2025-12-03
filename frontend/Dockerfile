FROM node:20-alpine AS builder
WORKDIR /build
RUN npm install -g typescript
COPY tsconfig.json ./
COPY src ./src
RUN tsc

FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY --from=builder /build/dist /usr/share/nginx/html/dist
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]