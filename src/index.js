"use strict";

const Promise = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const proxy = require('./lib/proxy');
const cors = require('cors');
const config = require('./config');
const Keycloak = require('keycloak-connect');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const url = require('url');
const session = require('express-session');

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
    console.log('%s URI: %s PATH: %s', req.method, req.url, req.path);
    console.log('  Headers:' + JSON.stringify(req.headers));
    next();
});

//Add keycloak middleware to handle request authentication
const keycloak = new Keycloak({}, {
    serverUrl: config.backend.keycloakUrl,
    realm: config.realm,
    clientId: config.clientId,
    bearerOnly: true,
    public: true
});

app.use(keycloak.middleware());

//install routes
app.use('/api/v1', router);
proxy.install(router, keycloak);

// var swaggerTools = require('swagger-tools');
// var YAML = require('yamljs');
// var swaggerDoc = YAML.load('./swagger/swagger.yaml');
// //Initialize Swagger
// swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
//     // Serve the Swagger documents and Swagger UI
//     app.use(middleware.swaggerUi());
// });
var swaggerDocument = YAML.load('./swagger/swagger.yaml');
const host = url.parse(config.serverUrl).host;
swaggerDocument.host = host;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

async function run() {
    await app.listen(config.port);
    console.log('Listening on port ', config.port);
}

run();
