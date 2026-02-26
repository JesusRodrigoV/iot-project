FROM oven/bun:latest as bun

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

EXPOSE 4200

CMD ["bun", "run","ng", "serve", "-host", "0.0.0.0"]

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=bun /app/dist/iot-project/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
