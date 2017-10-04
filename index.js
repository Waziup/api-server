"use strict";

const Promise = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const orionProxy = require('./lib/orion-proxy');
const keycloakProxy = require('./lib/keycloak-proxy');
const elasticsearchProxy = require('./lib/elasticsearch-proxy');
const server = require('./lib/server');

var cors = require('cors');



//importing individual routes
const authzRoute = require('./routes/authorization');
const usersRoute = require('./routes/users/user.route');
const config = require('config');

const app = server.app;
app.use(cors());
const router = express.Router();

//FIXME 
router.use(function(req, res, next) {
    console.log('%s URI: %s PATH: %s', req.method, req.url, req.path);
    next();
});

//serve the client
app.use(express.static(path.join(__dirname, "../client/build")));
/* baseUrl: process.env.REACT_APP_KC_URL,
 username: process.env.REACT_APP_ADMIN_USER,
 password: process.env.REACT_APP_ADMIN_PASS,*/

app.get('/env/:var', (req, res) => res.send(process.env[req.params.var]))
    //production deployment
    //app.use(express.static("/opt/app/client"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api/v1', router);

//  .../permissions .../test
router.use('/authorization', authzRoute);
router.use('/users', usersRoute);
///removed entities to support other services such as subscriptions
orionProxy.install(router, '/orion');

keycloakProxy.install(router, '/keycloak');

elasticsearchProxy.install(router, '/elasticsearch');

// //Swagger configuration
// var swaggerTools = require('swagger-tools');
// var YAML = require('yamljs');
// var swaggerDoc = YAML.load('./swagger/swagger.yaml');
// //Initialize Swagger
// swaggerTools.initializeMiddleware(swaggerDoc, function(middleware) {
//     // Serve the Swagger documents and Swagger UI
//     app.use(middleware.swaggerUi());
// });
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger/swagger.yaml');

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

async function run() {
    await new Promise(resolve => app.listen(config.serverport, () => resolve()));
    console.log('Listening on port ', config.serverport);
}

run();