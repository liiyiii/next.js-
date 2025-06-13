#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting build script..."

# Update package list and install system dependencies
echo "Updating package list and installing system dependencies (libreoffice-writer, pandoc)..."
apt-get update -y
apt-get install -y libreoffice-writer pandoc --no-install-recommends

# Install Python dependencies
echo "Installing Python dependencies from requirements.txt..."
pip install --no-cache-dir -r requirements.txt

echo "Build script finished."
