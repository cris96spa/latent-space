.PHONY: all $(MAKECMDGOALS)
DOC_PORT ?= 8031
SERVE_HOST ?= 0.0.0.0
SERVE_PORT ?= 8000
PROJECT_NAME ?= latent_space
PYTHON_FORMAT_TARGETS ?= main.py $(PROJECT_NAME) tests utils
FRONTEND_DIR ?= frontend
NPM ?= npm
help: # print all the available targets
	@echo "\nAvailable targets:\n"
	@grep -E '^[a-zA-Z_-]+:.*?# .*$$' $(MAKEFILE_LIST) | sed 's/:.*#/\t/' | column -t -s '	' ; echo

install: # install requirements without development dependencies
	uv sync

dev: install-dev  # install requirements with all dependencies that are needed for development
	uv run pre-commit install --install-hooks

install-uv: # install uv tool
	curl -LsSf https://astral.sh/uv/install.sh | sh

install-dev: # install dev dependencies
	uv sync --all-groups

install-release: # install release dependencies
	uv sync --group release

install-test: # install test dependencies
	uv sync --group test

format: # format the code with the ruff tool
	uv run ruff format $(PYTHON_FORMAT_TARGETS)

format-check: # check the formatting code with ruff
	uv run ruff format --check $(PYTHON_FORMAT_TARGETS)

lint: # check the code style
	uv run ruff check $(PROJECT_NAME) utils tests

lint-fix: # check and fix the code style
	uv run ruff check --fix $(PROJECT_NAME) utils tests

lint-doc: # check the docstring style
	uv run flake8 $(PROJECT_NAME) utils tests

serve: # run the FastAPI app locally with autoreload
	uv run uvicorn latent_space.app:create_app --factory --reload --reload-include '*.py' --reload-include '*.md' --host $(SERVE_HOST) --port $(SERVE_PORT)

doc: # create the project documentation; Build and visualize documentation through a local server
	uv run properdocs serve -f properdocs.yml --dev-addr 0.0.0.0:$(DOC_PORT)

test: # launch the tests
	uv run pytest -v -n auto --junitxml=tests_report.xml --doctest-modules --cov=$(PROJECT_NAME) --cov-report xml:coverage.xml --durations=0 tests

pre-commit: # run pre-commit hooks
	uv run pre-commit run --all-files

release: # release the next version based on commit messages
	uv run semantic-release version --no-commit --no-tag
	uv run python -m utils.release

patch: # release a patch
	uv run semantic-release version --no-commit --no-tag --patch
	uv run python -m utils.release

minor: # release a minor version
	uv run semantic-release version --no-commit --no-tag --minor
	uv run python -m utils.release

major: # release a major version
	uv run semantic-release version --no-commit --no-tag --major
	uv run python -m utils.release

fe-install: # install frontend dependencies
	cd $(FRONTEND_DIR) && $(NPM) install

fe-dev: # run the Vite dev server (proxies /api to the backend on port 8000)
	cd $(FRONTEND_DIR) && $(NPM) run dev

fe-build: # build the frontend production bundle into frontend/dist
	cd $(FRONTEND_DIR) && $(NPM) run build

fe-lint: # lint the frontend with oxlint
	cd $(FRONTEND_DIR) && $(NPM) run lint

fe-test: # run the frontend unit tests with Vitest
	cd $(FRONTEND_DIR) && $(NPM) run test