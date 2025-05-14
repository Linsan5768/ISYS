#!/usr/bin/env sh

# abort on errors
set -e

echo "===== Starting clean deployment process ====="

# 进入项目根目录
cd "$(dirname "$0")"

# 确保不存在临时部署目录
echo "Removing any existing temp deployment directory..."
rm -rf deploy_temp

# 创建干净的部署目录
echo "Creating fresh deployment directory..."
mkdir -p deploy_temp

# 进入前端目录构建
echo "Building frontend..."
cd web_frontend
npm run build
cd ..

# 复制构建文件到部署目录
echo "Copying only the frontend build files..."
cp -r web_frontend/dist/* deploy_temp/

# 添加测试页面
echo "Adding test page..."
cp test.html deploy_temp/

# 添加简化的Vue测试页面
echo "Adding simple Vue test page..."
cp simple-vue.html deploy_temp/

# 添加调试信息文件
echo "Adding debug info file..."
cat > deploy_temp/debug-info.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Deployment Debug Info</title>
  <style>body { font-family: monospace; }</style>
</head>
<body>
  <h1>Deployment Debug Info</h1>
  <h2>Build Date</h2>
  <pre>$(date)</pre>
  
  <h2>Directory Structure</h2>
  <pre>$(find deploy_temp -type f | grep -v "node_modules" | sort)</pre>
  
  <h2>Index.html Content</h2>
  <pre>$(cat deploy_temp/index.html)</pre>
</body>
</html>
EOF

# 添加.nojekyll文件
echo "Adding .nojekyll file..."
touch deploy_temp/.nojekyll

# 检查index.html是否存在
echo "Verifying index.html exists in deployment directory..."
if [ -f "deploy_temp/index.html" ]; then
  echo "✅ index.html found in root directory"
  echo "Contents of deployment directory:"
  ls -la deploy_temp/
else
  echo "❌ ERROR: index.html not found in deployment directory!"
  exit 1
fi

# 部署到GitHub Pages
echo "Starting GitHub Pages deployment..."
cd deploy_temp

# 初始化Git仓库
echo "Initializing Git repository..."
git init
git checkout -b gh-pages

# 添加所有文件
echo "Adding files..."
git add .

# 设置Git用户
echo "Setting Git identity..."
git config user.name "GitHub Pages Deployer"
git config user.email "deploy@example.com"

# 提交更改
echo "Committing changes..."
git commit -m "Deploy clean frontend-only build to GitHub Pages"

# 推送到GitHub Pages
echo "Pushing to GitHub Pages..."
git push -f https://github.sydney.edu.au/ISYS2110-2025-S1/CC04-05.git gh-pages:gh-pages

# 返回到项目根目录
cd ..

# 清理
echo "Cleaning up..."
rm -rf deploy_temp

echo "===== Deployment complete! ====="
echo "Your site should be available at: https://github.sydney.edu.au/pages/ISYS2110-2025-S1/CC04-05/"
echo "Test page: https://github.sydney.edu.au/pages/ISYS2110-2025-S1/CC04-05/test.html"
echo "Debug info: https://github.sydney.edu.au/pages/ISYS2110-2025-S1/CC04-05/debug-info.html"
echo "Please clear your browser cache by pressing Ctrl+F5 or Cmd+Shift+R" 