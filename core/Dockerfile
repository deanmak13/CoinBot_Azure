FROM node:lts-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY ["./core/package.json", "./core/package-lock.json*", "./core/npm-shrinkwrap.json*", "./"]

# Copying
COPY ./config /app/config

RUN npm install --production --silent && mv node_modules ../

# Create and set permissions for the log directory
RUN mkdir -p /home/LogFiles && chown -R node:node /home/LogFiles

COPY ./core .

EXPOSE 3000

RUN chown -R node /app

USER node

CMD ["node", "src/app.js"]
