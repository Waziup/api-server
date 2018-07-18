"use strict";

const Promise = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const proxy = require('./proxy');
const cors = require('cors');
const config = require('./config');
const Keycloak = require('keycloak-connect');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const url = require('url');
const session = require('express-session');
const fs = require('fs');
const http = require('http');
const https = require('https');
const log = require('./log.js');

//Create app and router
const app = express();
const router = express.Router();

//use body parser (to decode the body in the request)
app.use(bodyParser.json());
app.use(bodyParser.text());
//Include cors headers responses 
app.use(cors());

//Log every API call 
router.use(function(req, res, next) {
    log.info('API-SERVER received request %s on: %s', req.method, req.url);
    log.info('  with data:' + JSON.stringify(req.body));
    log.info('  with query:' + JSON.stringify(req.query));
    log.debug('  with headers:' + JSON.stringify(req.headers));
    next();
});

//Add keycloak middleware to handle request authentication
const keycloak = new Keycloak({}, {
    serverUrl: config.backend.keycloakUrl,
    realm: config.keycloakRealm,
    clientId: config.keycloakClientId,
    bearerOnly: true,
    credentials: {
       secret: config.keycloakClientSecret
    },
    policyEnforcer: {}
});

app.use(keycloak.middleware());

//install routes
app.use('/api/v1', router);
proxy.install(router, keycloak);

var swaggerDocument = YAML.load('./swagger/swagger.yaml');
const host = url.parse(config.httpUrl || config.httpsUrl).host;
swaggerDocument.host = host;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get("/", (req, res) => {
  res.status(301).redirect('/docs')
})

if(config.httpsEnabled) {

  try {
    
    var credentials = {};
    if(config.httpsTlsKey)
      credentials.key = fs.readFileSync(config.httpsTlsKey, 'utf8');
    if(config.httpsTlsCert)
      credentials.cert = fs.readFileSync(config.httpsTlsCert, 'utf8');
    if(config.httpsTlsChain)
      credentials.ca = fs.readFileSync(config.httpsTlsChain, 'utf8');
 
    https.createServer(credentials, app).listen(config.httpsPort, () => {
      log.info("Listening on %s", config.httpsUrl);
    });
  } catch (err){
    log.warn('Certificates not found! HTTPS disabled.');
  }
}

if(config.httpEnabled) {
  http.createServer(app).listen(config.httpPort, () => {
    log.info("Listening on %s", config.httpUrl);
  });
}
