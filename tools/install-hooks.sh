#!/bin/sh

# This script installs Git hooks using Husky
# It's compatible with both Windows and Unix-like systems

# Print header
echo "Installing Git hooks using Husky..."

# Change to repository root directory
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR" || exit 1

# Install Husky hooks
npx husky install

# Set executable permissions for the hooks (not needed on Windows but harmless)
chmod +x .husky/pre-commit

echo "Git hooks installed successfully!" 