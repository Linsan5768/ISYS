#!/usr/bin/env sh

# abort on errors
set -e

echo "===== Starting deployment process ====="

# 首先清除之前的构建
echo "Cleaning previous build..."
rm -rf dist

# build
echo "Building application with correct public path..."
npm run build

# navigate to the build output directory
cd dist

echo "Setting up GitHub Pages deployment..."

# Create a .nojekyll file to bypass Jekyll processing
echo "Creating .nojekyll file..."
touch .nojekyll

# Verify the structure of built files
echo "Checking built files..."
ls -la

echo "Contents of index.html (checking paths):"
cat index.html | grep -E "script|link|href" | head -10

# initialize git repository if not already done
echo "Initializing git repository..."
git init

# 创建一个干净的gh-pages分支，确保不包含任何历史
git checkout -b gh-pages

# 只添加当前目录内容（dist目录的内容）
echo "Adding only the frontend build files..."
git add .

# Check git identity
echo "Checking git identity..."
git config user.name 2>/dev/null || git config --global user.name "GitHub Pages Deployer"
git config user.email 2>/dev/null || git config --global user.email "deploy@example.com"

echo "Committing changes..."
git commit -m 'Deploy to GitHub Pages with clean frontend-only files'

# 使用学校GitHub仓库URL
echo "Pushing to GitHub Pages branch..."
git push -f https://github.sydney.edu.au/ISYS2110-2025-S1/CC04-05.git gh-pages:gh-pages

echo "===== Deployment complete! ====="
echo "Your site should be available at: https://github.sydney.edu.au/pages/ISYS2110-2025-S1/CC04-05/"
echo "Please clear your browser cache by pressing Ctrl+F5 or Cmd+Shift+R"
echo "If it's still not working, please wait a few minutes for GitHub Pages to update"

cd - 