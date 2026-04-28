FROM node:18-slim

WORKDIR /app
COPY backend/ ./backend/
RUN cd backend && npm ci && npm run postinstall

EXPOSE 10000

CMD ["node", "backend/server.js"]
