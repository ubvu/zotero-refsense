FROM node:18-bullseye

# Minimal image to build the Zotero .xpi
WORKDIR /workspace

# Install dependencies based on lockfile
COPY package*.json ./
RUN npm ci

# Copy the rest of the project
COPY . .

# Default command builds the .xpi into /workspace/build
CMD ["npm", "run", "build"]

