FROM node:23-alpine

RUN apk add --no-cache sqlite
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 9000
CMD ["node", "index.js"]