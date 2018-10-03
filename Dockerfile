FROM node:9.4

RUN mkdir /usr/src/app
VOLUME ["/app"]
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app

RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 4000
HEALTHCHECK CMD curl --fail http://localhost:800/api/v1/domains/waziup/sensors || exit 1

CMD [ "node", "src/index.js" ]

