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

all:
	docker compose up --build -d
# consultar bien las flags

down:
	docker compose down -t 1

clean: down
	docker system prune -af

fclean: clean
	rm -rf ./backend/node_modules
	rm -rf ./frontend/node_modules
	rm -rf ./data

re: clean all
