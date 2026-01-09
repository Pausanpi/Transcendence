FROM base:latest
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
CMD ["npm", "start"]

# /etc/docker/daemon.json
# { "features": { "buildkit": true } }
