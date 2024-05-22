# build environment
FROM node:lts-alpine as build
ARG release='prd'
WORKDIR /app

# RUN echo 'release:$release'
COPY package*.json ./
RUN npm install
COPY . .
# COPY nginx.conf ./nginx.conf
RUN npm run build

FROM nginx:alpine
ARG release='prd'
COPY --from=build /app/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/. /etc/nginx/html

RUN ls /etc/nginx/*

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]