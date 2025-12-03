FROM transcendence-base:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 9200

CMD ["npm", "start"]