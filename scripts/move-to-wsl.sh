#!/bin/bash

# Script to move Phos Healthcare Platform repo from Windows-mounted paths to WSL-native storage
# This resolves Input/Output errors when working with /mnt/c paths

set -e

# Configuration
REPO_NAME="Phos-healthcare_new"
WSL_PROJECTS_DIR="$HOME/projects"
SOURCE_DIR="/mnt/c/Users/15612/Desktop/Repositories/$REPO_NAME"
TARGET_DIR="$WSL_PROJECTS_DIR/$REPO_NAME"

echo "🚀 Moving Phos Healthcare Platform to WSL-native storage..."

# Create projects directory if it doesn't exist
if [ ! -d "$WSL_PROJECTS_DIR" ]; then
    echo "📁 Creating projects directory: $WSL_PROJECTS_DIR"
    mkdir -p "$WSL_PROJECTS_DIR"
fi

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    echo "Please ensure the repository exists at the expected Windows path."
    exit 1
fi

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "⚠️  Target directory already exists: $TARGET_DIR"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled."
        exit 1
    fi
    echo "🗑️  Removing existing target directory..."
    rm -rf "$TARGET_DIR"
fi

echo "📦 Copying repository using rsync..."
echo "From: $SOURCE_DIR"
echo "To: $TARGET_DIR"

# Use rsync with progress and exclude common unnecessary files
rsync -av --progress \
    --exclude='.git/objects/' \
    --exclude='bin/' \
    --exclude='obj/' \
    --exclude='node_modules/' \
    --exclude='*.log' \
    --exclude='.vs/' \
    --exclude='.vscode/' \
    "$SOURCE_DIR/" "$TARGET_DIR/"

echo "✅ Repository copied successfully!"

# Create a symlink back to the original location for convenience
echo "🔗 Creating symlink for easy access..."
if [ -L "$SOURCE_DIR" ]; then
    rm "$SOURCE_DIR"
fi
ln -sf "$TARGET_DIR" "$SOURCE_DIR"

echo "🎉 Repository moved successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Navigate to the new location: cd $TARGET_DIR"
echo "2. Run the test script: ./scripts/run-tests.sh"
echo "3. Or use Docker: docker-compose -f docker-compose.test.yml up"
echo ""
echo "💡 The original Windows path now points to the WSL-native location"
echo "   for seamless integration with Windows tools."
