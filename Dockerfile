FROM node:18-slim
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci && npm run postinstall
COPY backend/ ./backend/
EXPOSE 10000
CMD ["node", "backend/server.js"]
