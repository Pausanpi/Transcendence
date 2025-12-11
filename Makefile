all: build up
build:
	@docker build --network=host -t base -f base/Dockerfile .
	@docker compose build
up:
	@docker compose up -d
	@echo "\nhttps://localhost:8443/"
down:
	@docker compose down
re: down up
rebuild: down build up
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

health:
	ps aux | grep -E "(3000|3001|3002|3003|3004|8443)"
	curl http://localhost:3000/health
	curl http://localhost:3001/health
	curl http://localhost:3002/health
	curl http://localhost:3003/health
	curl http://localhost:3004/health
	curl -k https://localhost:8443/health

tails:
	@echo "\n --- GATEWAY ---\n"
	docker logs gateway | tail -n 20
	@echo "\n --- AUTH ---\n"
	docker logs auth | tail -n 20
	@echo "\n --- I18N ---\n"
	docker logs i18n | tail -n 20
	@echo "\n --- DATABASE ---\n"
	docker logs database | tail -n 20
	@echo "\n --- USERS ---\n"
	docker logs users | tail -n 20


.PHONY: all build up down fclean re logs ps clean destroy health tails
