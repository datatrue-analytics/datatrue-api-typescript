#!/usr/bin/env bash

set -e

git restore docs --quiet
git commit --allow-empty --no-verify --quiet --message "temp"
git stash --include-untracked --quiet
git reset --quiet --soft HEAD^

if git diff --name-only --cached | grep -q "^src/"; then
  npx typedoc
else
  echo "No staged changes to src, docs will not be generated"
fi

set +e

git stash pop > /dev/null 2>&1

exit 0
