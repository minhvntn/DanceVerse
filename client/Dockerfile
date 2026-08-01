FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY client ./client

RUN npm install
RUN npm run build --prefix client

FROM nginx:alpine AS runtime
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
