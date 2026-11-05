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

# pnpm install
install:
    pnpm install

# pnpm run fmt
format: mise install
    pnpm run fmt

# pnpm run oxlint
lint: mise install
    pnpm run oxlint

# pnpm run typecheck
typecheck: mise install
    pnpm run typecheck

# pnpm run test run
test: mise install
    pnpm run test run

# pnpm run package
build: mise install
    pnpm run package

# format lint typecheck test build
precommit: format lint typecheck test build

# pnpm run all (alias for precommit)
all: precommit

# Override this with a command called `woof` which notifies you in whatever ways you prefer.
# My `woof` command uses `echo`, `say`, and sends a Pushover notification.
echo_command := env('ECHO_COMMAND', "echo")
