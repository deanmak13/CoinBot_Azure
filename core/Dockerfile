FROM node:lts-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY ["./core/package.json", "./core/package-lock.json*", "./core/npm-shrinkwrap.json*", "./"]

# Copying
COPY ./config /app/config

RUN npm install --production --silent && mv node_modules ../

RUN npm i -g concurrently

# Create and set permissions for the log directory
RUN mkdir -p /home/LogFiles && chown -R node:node /home/LogFiles

COPY ./core .

EXPOSE 3000
EXPOSE 3013

RUN chown -R node /app

USER node

CMD ["npm", "start"]
