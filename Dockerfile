# Build stage
FROM node:20-alpine
WORKDIR /app

# Install dependencies statically
COPY package*.json ./
RUN npm install

# Build the Vite React app
COPY . .
RUN npm run build

# Install a lightweight static server designed for SPA routing
RUN npm install -g serve

# Expose port 8080 for Google Cloud Run
EXPOSE 8080

# Serve the 'dist' build folder
CMD ["serve", "-s", "dist", "-l", "8080"]
