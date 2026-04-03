# Use Node.js for building (Vite requires Node 20+)
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Use Nginx to serve the built frontend
FROM nginx:alpine

# Copy custom nginx config if we had one, otherwise use defaults
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
