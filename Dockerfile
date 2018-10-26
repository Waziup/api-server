FROM node:10-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .

# First install all dependencies
# this makes further builds faster
RUN yarn install

COPY src src/
COPY swagger swagger/

RUN yarn install

EXPOSE 4000
HEALTHCHECK CMD curl --fail http://localhost:800/api/v1/sensors || exit 1

CMD [ "node", "src/index.js" ]

