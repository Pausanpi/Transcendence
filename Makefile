# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: lcuevas- <lcuevas-@student.42malaga.c      +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/11/11 11:39:05 by lcuevas-          #+#    #+#              #
#    Updated: 2025/11/11 11:39:06 by lcuevas-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

# Base image for services
BASE_IMAGE=transcendence-base:latest

# -----------------------
# Default: build everything
# -----------------------
all: build-base build-services

# Build base image
build-base:
	docker build -t $(BASE_IMAGE) ./base_image

# Build and start all services
build-services:
	docker compose up --build -d

# -----------------------
# Start / Stop containers
# -----------------------
up:
	docker compose up -d

down:
	docker compose down --remove-orphans
# can add -t 1

# Optional: restart containers quickly
restart: down up

# -----------------------
# Optional intermediate clean (remove stopped containers, networks, dangling images)
# -----------------------
clean: down
	docker system prune -f

# -----------------------
# Optional clean for db
# -----------------------
clean-db:
	rm -rf auth/data/*.db
	rm -rf users/data/*.db
	rm -rf backend/data/*.db

# -----------------------
# Full cleanup: remove everything including volumes
# -----------------------
fclean: clean-db
	docker compose down --volumes --remove-orphans
	docker system prune -af

# -----------------------
# Hard reset: full rebuild after full cleanup
# -----------------------
re: fclean all

# -----------------------
# Health check
# -----------------------
health:
	@./health-check.sh

#setup-42: codigo pa que corra docker en sgoingfree
 #   @mkdir -p /sgoinfre/$(USER)/docker
  #  @mkdir -p ~/.config/docker
 #   @echo '{"data-root": "/sgoinfre/$(USER)/docker"}' > ~/.config/docker/daemon.json
  #  @echo "Docker configured for /sgoinfre/$(USER)/docker"
  #  @echo "Run: systemctl --user restart docker"