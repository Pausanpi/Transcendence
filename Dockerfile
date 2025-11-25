FROM node:20
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
ENV TZ=Europe/Madrid
CMD ["npm", "start"]

# /etc/docker/daemon.json
# { "features": { "buildkit": true } }
# sudo systemctl restart docker
