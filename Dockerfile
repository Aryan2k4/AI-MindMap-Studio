# Use the official lightweight Node.js Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first for efficient caching of layers
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose port (Cloud Run defaults to routing requests to 8080)
EXPOSE 8080

# Start the Express server
CMD ["npm", "start"]
