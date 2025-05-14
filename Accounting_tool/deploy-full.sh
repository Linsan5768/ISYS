#!/usr/bin/env sh

# abort on errors
set -e

echo "===== Starting Full-Stack Deployment Process ====="

# Get the directory of this script
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"

# 1. Backend Build and Setup
echo "===== Building and Setting Up Backend ====="
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating default .env file..."
  echo "PORT=5002" > .env
  echo "DATABASE_PATH=/var/data/database.sqlite" >> .env
  echo "JWT_SECRET=change_this_to_a_secure_random_string" >> .env
fi

# Run any database migrations or setup
echo "Running database setup..."
# Uncomment and modify as needed:
# npm run migrate

cd ..

# 2. Frontend Build
echo "===== Building Frontend ====="
cd web_frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend for production
echo "Building frontend for production..."
npm run build

# Copy built frontend to backend public directory
echo "Copying frontend build to backend/public..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

cd ..

# 3. Create a single start script
echo "===== Creating startup script ====="

cat > start.js << 'EOF'
/**
 * Combined server script for Accounting Tool
 * This script serves both the backend API and the frontend static files
 */

const path = require('path');
const express = require('express');
const app = express();

// Import backend app (modify path if needed)
const backendApp = require('./backend/server');

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, 'backend/public')));

// Redirect all non-API/non-file requests to the frontend app
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Skip requests for existing files
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|json)$/)) {
    return next();
  }
  
  // For all other routes, serve the index.html
  res.sendFile(path.join(__dirname, 'backend/public/index.html'));
});

// Determine port
const PORT = process.env.PORT || 5002;

// Start server
app.listen(PORT, () => {
  console.log(`
===== Accounting Tool Server Started =====
- Frontend: http://localhost:${PORT}
- Backend API: http://localhost:${PORT}/api
==========================================
  `);
});
EOF

# Create package.json for the root directory
cat > package.json << 'EOF'
{
  "name": "accounting-tool-full",
  "version": "1.0.0",
  "description": "Accounting Tool - Combined Frontend and Backend",
  "main": "start.js",
  "scripts": {
    "start": "node start.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# Install root dependencies
echo "Installing root dependencies..."
npm install

echo "===== Deployment Preparation Complete ====="
echo "To start the application:"
echo "  npm start"
echo ""
echo "Your application will be available at:"
echo "  http://localhost:5002"
echo "" 