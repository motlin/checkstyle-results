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

# npm install
install:
    npm install

# npm run all
all: mise install
    npm run all

# Override this with a command called `woof` which notifies you in whatever ways you prefer.
# My `woof` command uses `echo`, `say`, and sends a Pushover notification.
echo_command := env('ECHO_COMMAND', "echo")


