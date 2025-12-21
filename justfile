set shell := ["bash", "-O", "globstar", "-c"]
set dotenv-filename := ".envrc"

import ".just/console.just"
import ".just/git.just"
import ".just/git-rebase.just"
import ".just/git-test.just"

default:
    @just --list --unsorted

# mise install
mise:
    mise install --quiet
    mise current

# npm install
install:
    npm install

# npm run format:write
format: mise install
    npm run format:write

# npm run lint
lint: mise install
    npm run lint

# npm run tsc --noEmit
typecheck: mise install
    npx tsc --noEmit

# npm run test
test: mise install
    npm run test

# npm run package
build: mise install
    npm run package

# format lint typecheck test build
precommit: format lint typecheck test build

# npm run all (alias for precommit)
all: precommit

# Override this with a command called `woof` which notifies you in whatever ways you prefer.
# My `woof` command uses `echo`, `say`, and sends a Pushover notification.
echo_command := env('ECHO_COMMAND', "echo")
