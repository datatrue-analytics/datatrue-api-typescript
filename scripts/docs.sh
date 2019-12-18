#!/usr/bin/env bash

set -e

git restore docs
git commit -n --allow-empty --message "temp"
git stash --include-untracked
git reset --soft HEAD^

if git diff --name-only --cached | grep -q "^src/"; then
  npx typedoc
fi

git stash pop
