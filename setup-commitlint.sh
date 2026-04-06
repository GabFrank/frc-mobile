#!/bin/bash
# Run this script to set up commitlint for conventional commits
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
echo "Commitlint and husky configured successfully."
