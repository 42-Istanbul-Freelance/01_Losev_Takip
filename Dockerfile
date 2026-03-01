FROM node:18-alpine

WORKDIR /app

# Copy and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy source files
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Single port - backend serves frontend static files too
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "backend/src/server.js"]
