BLUE=\033[34m
GREEN=\033[0;32m
NO_COLOR=\033[0m
USER_ID := $(shell id -u)
GROUP_ID := $(shell id -g)

.PHONY: all
all: help

.PHONY: help
help:
	@echo "    $(BLUE)K I S S B O T     A P I      C L I${NO_COLOR}"
	@echo
	@echo "Principais:"
	@echo
	@echo "  ${GREEN}make help${NO_COLOR}  - Mostra central de ajuda da CLI"
	@echo "  ${GREEN}make start${NO_COLOR} - Inicia container da API"
	@echo "  ${GREEN}make stop${NO_COLOR}  - Pausa container da API"
	@echo "  ${GREEN}make logs${NO_COLOR}  - Mostra os logs do container da API"
	@echo
	@echo "Migrations (Local):"
	@echo
	@echo "  ${GREEN}make create-migration${NO_COLOR} - Cria uma nova migration (use com o parâmetro 'name', ex: make create-migration name=MigrationNameExample)"
	@echo "  ${GREEN}make run-migration${NO_COLOR}    - Executa as migrations pendentes"
	@echo "  ${GREEN}make revert-migration${NO_COLOR} - Reverte a última migration"
	@echo "  ${GREEN}make show-migration${NO_COLOR}   - Mostra o status das migrations"
	@echo

.PHONY: start
start:
	@docker start bd__api

.PHONY: stop
stop:
	@docker stop bd__api

.PHONY: logs
logs:
	@docker logs bd__api --follow

.PHONY: create-migration
create-migration:
	@echo "${GREEN}>>> Criando migration: $(name)${NC}"
	docker exec --user $(USER_ID):$(GROUP_ID) bd__api npm run typeorm -- migration:create -n "$(name)"

.PHONY: run-migration
run-migration:
	@echo "${GREEN}>>> Executando migrations...${NC}"
	docker exec bd__api npm run typeorm -- migration:run

.PHONY: revert-migration
revert-migration:
	@echo "${GREEN}>>> Revertendo última migration...${NC}"
	docker exec bd__api npm run typeorm -- migration:revert

.PHONY: show-migration
show-migration:
	@echo "${GREEN}>>> Buscando migrations...${NC}"
	docker exec bd__api npm run typeorm -- migration:show

.PHONY: exec-migration
exec-migration:
	@echo "${GREEN}>>> Executando migrations em produção...${NC}"
	node ./node_modules/typeorm/cli.js --config dist/modules/database-migrations/config/ormconfig.js migration:run

.PHONY: undo-migration
undo-migration:
	@echo "${GREEN}>>> Revertendo última migration em produção...${NC}"
	node ./node_modules/typeorm/cli.js --config dist/modules/database-migrations/config/ormconfig.js migration:revert

.PHONY: list-migration
list-migration:
	@echo "${GREEN}>>> Buscando migrations em produção...${NC}"
	node ./node_modules/typeorm/cli.js --config dist/modules/database-migrations/config/ormconfig.js migration:show
