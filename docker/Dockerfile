# Dockerfile for yasl-firebase web app
# Build a lightweight static web server image without firebaseConfig.js

FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy built app files from dist (not web), but exclude firebaseConfig.js (must be mounted at runtime)
COPY ./dist/ ./
# Copy custom nginx config to listen on port 8080
COPY ./docker/default.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Entrypoint is default: nginx -g 'daemon off;'
