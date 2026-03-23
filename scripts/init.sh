#!/usr/bin/env bash

set -euo pipefail

if ! command -v fnm >/dev/null 2>&1; then
	echo "fnm is required but was not found in PATH."
	exit 1
fi

eval "$(fnm env)"
fnm use --install-if-missing

if ! command -v pnpm >/dev/null 2>&1; then
	if command -v corepack >/dev/null 2>&1; then
		corepack enable
	else
		echo "pnpm is required but was not found in PATH."
		exit 1
	fi
fi

pnpm install

if [ ! -f .env.local ] && [ -f .env.example ]; then
	cp .env.example .env.local
	echo "Created .env.local from .env.example."
	echo "Fill in GitHub OAuth values before testing private content."
fi

echo "Duet workspace initialized."
