FROM node:18-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy source files
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/database.sqlite

EXPOSE 4000

CMD ["node", "backend/src/server.js"]
