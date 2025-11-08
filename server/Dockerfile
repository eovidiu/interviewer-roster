FROM node:20-alpine

WORKDIR /app

# Since Railway builds from repo root with RAILWAY_SERVICE_ROOT_DIR=server,
# all COPY commands are relative to the server directory

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory for SQLite
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
