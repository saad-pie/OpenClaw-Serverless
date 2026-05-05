FROM node:20

# Install basic tools for the agent
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build TypeScript
RUN npx tsc

# Expose the port
EXPOSE 3000

# Start the self-executing agent server
CMD ["node", "dist/api/index.js"]
