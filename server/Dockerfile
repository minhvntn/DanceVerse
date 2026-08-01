FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY server ./server

RUN npm install
RUN npm run build --prefix server

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/server/package*.json ./server/
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/node_modules ./server/node_modules

EXPOSE 3001
CMD ["node", "server/dist/server/src/index.js"]
