FROM node:alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY package.json .
COPY src src/
COPY swagger swagger/

RUN yarn install

EXPOSE 4000
CMD [ "node", "src/index.js" ]
