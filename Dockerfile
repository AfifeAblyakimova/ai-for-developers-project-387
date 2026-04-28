FROM node:22-alpine AS frontend-build

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN npm --prefix frontend ci

COPY frontend ./frontend
RUN VITE_API_BASE_URL= npm --prefix frontend run build

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY backend ./backend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["npm", "start"]
