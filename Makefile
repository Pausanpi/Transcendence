all: build up
build:
	@docker compose build
up:
	@docker compose up -d
	@echo "\nhttps://localhost:8443/"
down:
	@docker compose down
re: down build up
clean:
	@docker compose down -v --rmi local
fclean:
	@docker compose down -v
logs:
	@docker compose logs
ps:
	@docker compose ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
destroy:
	docker stop $$(docker ps -aq) || true
	docker rm $$(docker ps -aq) || true
	docker rmi -f $$(docker images -aq) || true
	docker volume prune -f
	docker network prune -f
	docker system prune -a -f --volumes

.PHONY: all build up down fclean re logs ps clean destroy
