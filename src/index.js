"use strict";

const config = require('./config');
const apiServer = require('./api-server')

for (const client of config.clients) {

  apiServer(client, config.backend)
  
}
