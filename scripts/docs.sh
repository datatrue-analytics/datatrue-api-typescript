#!/usr/bin/env bash

set -e

git restore docs
git commit --allow-empty --no-verify --message "temp"
git stash --include-untracked
git reset --soft HEAD^

if git diff --name-only --cached | grep -q "^src/"; then
  npx typedoc
fi

set +e

git stash pop

exit 0
