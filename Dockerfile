FROM docker.io/node:24.4-alpine3.21

RUN apk update
RUN apk add openjdk21
RUN apk add rcon

WORKDIR /App

COPY src/ src/
COPY server_defaults/ server_defaults/
COPY public/ public/
COPY package.json package.json
COPY astro.config.mjs astro.config.mjs

VOLUME servers/

RUN npm i 
RUN npm run build

EXPOSE 4444

CMD ["node", "dist/server/entry.mjs"]


