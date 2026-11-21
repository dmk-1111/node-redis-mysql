# Pull node image
FROM node:22.21.0

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 3000

CMD [ "node", "server.js" ]