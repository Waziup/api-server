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
CMD [ "node", "src/index.js" ]
