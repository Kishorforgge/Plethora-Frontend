# Stage 1: Development
FROM node:20-alpine AS development

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and other files
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Start Vite dev server on host 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# Stage 2: Build
FROM development AS build

# Build the frontend application
RUN npm run build


# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (required for vite preview)
RUN npm install

# Copy compiled files from build stage
COPY --from=build /app/dist ./dist

# Expose Vite preview port
EXPOSE 5173

# Start Vite preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
