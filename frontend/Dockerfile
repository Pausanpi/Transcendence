FROM alpine:3

# Optional: install simple tools (not needed but harmless)
RUN apk add --no-cache bash

# Copy static HTML/JS/CSS into the container
COPY . /app

# This container does not serve anything — nginx will read the files
CMD ["sleep", "infinity"]