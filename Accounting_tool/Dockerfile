FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY start.js ./

# Copy backend files
COPY backend backend/

# Copy frontend build
COPY web_frontend/dist backend/public/

# Install dependencies
RUN npm install

# Expose port 
EXPOSE 5002

# Start the application
CMD [ "npm", "start" ] 