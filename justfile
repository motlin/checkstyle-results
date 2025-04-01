set shell := ["bash", "-O", "globstar", "-c"]
set dotenv-filename := ".envrc"

import ".just/console.just"
import ".just/git.just"
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

# pnpm run all
all: mise install
    pnpm run all

# Override this with a command called `woof` which notifies you in whatever ways you prefer.
# My `woof` command uses `echo`, `say`, and sends a Pushover notification.
echo_command := env('ECHO_COMMAND', "echo")


