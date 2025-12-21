upstream_remote := env('UPSTREAM_REMOTE', "upstream")
upstream_branch := env('UPSTREAM_BRANCH', "main")
offline := env_var_or_default('OFFLINE', 'false')

# git clean helper
_clean-git:

# Fail if there are local modifications or untracked files
_check-local-modifications:
    #!/usr/bin/env bash
    set -uo pipefail

    ERRORS=""

    git diff --quiet || ERRORS+="- Working tree has uncommitted changes\n"
    git diff --staged --quiet || ERRORS+="- Index has staged changes\n"
    git status --porcelain | grep -q '^??' && ERRORS+="- Untracked files exist\n"

    if [ -n "$ERRORS" ]; then
        {{echo_command}} "Local modifications"
        echo -e "$ERRORS"
        just _run "git status"
        exit 1
    fi

# git fetch configurable upstream
fetch:
    #!/usr/bin/env bash
    set -Eeuo pipefail
    if [ "{{offline}}" != "true" ]; then
        just _run "git fetch {{ANSI_BRIGHT_RED}}{{ANSI_BOLD}}{{upstream_remote}}{{ANSI_NORMAL}} --tags --prune"
    fi
