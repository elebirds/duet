SHELL := /bin/bash

.PHONY: init dev test check build verify preview format lint

FNM_ENV = eval "$$(fnm env)" && fnm use --install-if-missing >/dev/null

init:
	./scripts/init.sh

dev:
	$(FNM_ENV) && pnpm dev

test:
	$(FNM_ENV) && pnpm test

check:
	$(FNM_ENV) && pnpm check

build:
	$(FNM_ENV) && pnpm build

verify:
	$(FNM_ENV) && pnpm exec biome ci ./src ./tests && pnpm test && pnpm check && pnpm build

preview:
	$(FNM_ENV) && pnpm preview

format:
	$(FNM_ENV) && pnpm format && pnpm exec biome format --write ./tests

lint:
	$(FNM_ENV) && pnpm lint && pnpm exec biome check --write ./tests
