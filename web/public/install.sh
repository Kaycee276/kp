#!/bin/bash

# KP CLI Installation Script for Mac/Linux

echo -e "\033[36m[KP]\033[0m Installing KP CLI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "\033[31m[ERROR]\033[0m Node.js is not installed. Please install Node.js (v18+) and try again."
    exit 1
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "\033[31m[ERROR]\033[0m Git is not installed. Please install Git and try again."
    exit 1
fi

INSTALL_DIR="$HOME/.kp-cli"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "\033[2mUpdating existing installation...\033[0m"
    cd "$INSTALL_DIR"
    git stash -q
    git pull -q
else
    echo -e "\033[2mCloning repository...\033[0m"
    git clone -q https://github.com/Kaycee276/kp.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "\033[2mInstalling dependencies...\033[0m"
npm install --silent

echo -e "\033[2mBuilding CLI...\033[0m"
npm run build --silent

echo -e "\033[2mLinking globally...\033[0m"
npm link --force --silent

echo -e "\033[32m[SUCCESS]\033[0m Installation complete! You can now run \033[36mkp\033[0m from anywhere."
