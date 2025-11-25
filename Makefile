all: build up
build:
	@docker compose build
up:
	@docker compose up -d
	@echo "\nhttps://localhost:8443/"
down:
	@docker compose down
re: down up
clean:
	@docker compose down -v --rmi local
fclean:
	@docker compose down -v
install:
	npm install
logs:
	@docker compose logs
health:
	@curl -f -s http://localhost/health > /tmp/nginx_health.json 2>/dev/null && \
	@curl -f -s http://localhost:8200/v1/sys/health > /tmp/vault_health.json 2>/dev/null && \
	  jq . /tmp/vault_health.json || echo "Vault health: Service unavailable or invalid JSON"
	@docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG && \
	  echo "Redis: PONG" || echo "Redis: Service unavailable"
ps:
	@docker compose ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
dev:
	npm run dev
destroy:
	docker stop $$(docker ps -aq) || true
	docker rm $$(docker ps -aq) || true
	docker rmi -f $$(docker images -aq) || true
	docker volume prune -f
	docker network prune -f
	docker system prune -a -f --volumes

grafana-up:
	@docker compose --file grafana/docker-compose.yml --env-file .env build
	@docker compose --file grafana/docker-compose.yml --env-file .env up -d
	@echo "\nhttp://localhost:3001/"

grafana-down:
	@docker compose --file grafana/docker-compose.yml --env-file .env down

grafana-logs:
	@docker compose --file grafana/docker-compose.yml --env-file .env logs --file

grafana-fclean:
	@docker compose --file grafana/docker-compose.yml down -v --rmi local

grafana-ps:
	@docker compose --file grafana/docker-compose.yml ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

.PHONY: all build up down fclean re logs health ps clean install dev grafana-up grafana-down grafana-logs grafana-fclean grafana-ps
