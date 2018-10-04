FROM node:alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .
COPY src src/
COPY swagger swagger/

RUN yarn install

EXPOSE 4000
HEALTHCHECK CMD curl --fail http://localhost:800/api/v1/domains/waziup/sensors || exit 1

CMD [ "node", "src/index.js" ]

