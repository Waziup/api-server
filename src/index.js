"use strict";

const Promise = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const orionProxy = require('./lib/orion-proxy');
const elsProxy = require('./lib/els-proxy');
const mongoProxy = require('./lib/mongo-proxy');
const cors = require('cors');
const config = require('./config');
const Keycloak = require('keycloak-connect');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const url = require('url');

//importing individual routes
const usersRoute = require('./routes/users/user.route');

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
    next();
});

//Add keycloak middleware to handle request authentication
const keycloak = new Keycloak({
      url: config.keycloakUrl,
      realm: config.realm,
      clientId: config.clientId,
      bearerOnly: true 
    });

//app.use(keycloak.middleware();

//install routes
//app.get('/env/:var', (req, res) => res.send(process.env[req.params.var]))
app.use('/api/v1', router);
router.use('/users', usersRoute);
orionProxy.install(router, keycloak);
//elsProxy.install(router, keycloak);
mongoProxy.install(router, keycloak);

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
    await new Promise(resolve => app.listen(config.port, () => resolve()));
    console.log('Listening on port ', config.port);
}

run();
