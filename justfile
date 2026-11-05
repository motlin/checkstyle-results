# `just --list --unsorted`
[group('default')]
default:
    @just --list --unsorted

ci := env("CI", "")

export PATH := justfile_directory() / "node_modules/.bin" + ":" + env("PATH")

# Install dependencies
[group('setup')]
install:
    pnpm install

# Run linter
lint: install
    vp lint {{ if ci != "" { "--format github" } else { "--fix" } }}

# Run formatter
format: install
    pre-commit run just-fmt --all-files
    oxfmt-next-line {{ if ci != "" { "--check" } else { "" } }}

# Run checks (format + lint + typecheck)
check: format lint typecheck

# Run tests
test *args: install
    node node_modules/vitest/dist/cli.js run {{ args }}

# Type-check the project
typecheck: install
    vp run typecheck

# Bundle the action into dist/
build: install
    vp run package

# Apply safe Fallow fixes locally, then reject remaining dead code
fallow: install
    {{ if ci == "" { "vp run fallow" } else { "true" } }}
    vp run fallow:ci

# vp run fallow:ci
fallow-check: install
    vp run fallow:ci

# Run pre-commit hooks on all files (same as CI's pre-commit job)
pre-commit: install
    pre-commit run --all-files

# Run all pre-commit checks
[arg("quick", long, value="true", help="Skip tests")]
verify quick="": check build fallow pre-commit
    {{ if quick != "true" { "just test" } else { "true" } }}
    @echo "All pre-commit checks passed!"

# Deprecated alias for `verify`
[arg("quick", long, value="true", help="Skip tests")]
precommit quick="": (verify quick)

# Alias for `verify`
all: verify
