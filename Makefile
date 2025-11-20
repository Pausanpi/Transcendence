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

BASE_IMAGE=transcendence-base:latest

all: build-base build-services

build-base:
	docker build -t $(BASE_IMAGE) ./base_image

build-services:
	docker compose up --build -d
# consultar bien las flags

up:
	docker compose up -d

down:
	docker compose down -t 1

clean: down
	docker system prune -af

fclean: clean
	rm -rf ./backend/node_modules
	rm -rf ./frontend/node_modules
	rm -rf ./data

re: clean all
