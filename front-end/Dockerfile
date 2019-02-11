FROM node:10.3.0 as builder
COPY . /app
WORKDIR /app
RUN npm install && npm run build

FROM nginx:1.15.2-alpine
COPY --from=builder /app/build /app/build
COPY ./nginx etc/nginx
COPY ./ssl/myssl.pem /etc/letsencrypt/live/fullchain.pem
COPY ./ssl/myssl.key /etc/letsencrypt/live/privkey.pem
EXPOSE 80
