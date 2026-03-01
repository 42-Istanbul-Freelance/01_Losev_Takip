FROM node:18-slim

WORKDIR /app

# Single port for API + static frontend
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/database.sqlite

# Install dependencies first (cache layer)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Persistence for SQLite
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "backend/src/server.js"]
