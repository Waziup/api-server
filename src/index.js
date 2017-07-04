"use strict";

const Promise = require('bluebird');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const server = require('./lib/server');
//importing individual routes
const sensorDataRoute = require('./routes/sensorData');
const authzRoute = require('./routes/authorization');

const app = server.app;

var cors = require('cors')
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//below code for integration with client
//app.use(express.static(path.join(__dirname, 'build')));
//However, the path that you provide to the express.static function is relative to the directory from where you launch your node process.



//FIXME 
const router = express.Router();

//The top-level express object has a Router() method that creates a new router object.
// simple logger for this router's requests all requests to this router will first hit this middleware
//FIXME 
router.use(function(req, res, next) {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();
});

// does not work: blocks router.use(protectByAuthentication());
//FIXME 

/*const {protectByAuthentication} = server.access;
app.use('/index.html', protectByAuthentication)*/
app.use(express.static("../../client/build"));

/*app.get('/index.html',function(req,res) {
    res.sendFile(path.join(__dirname,"../../waziup-dashboard/build/index.html"));
});*/

//FIXME 
//router.all('*', protectByAuthentication());
//This method is extremely useful for mapping “global” logic for specific path prefixes or arbitrary matches. For example, if you placed the following route at the top of all other route definitions, it would require that all routes from that point on would require authentication, and automatically load a user. Keep in mind that these callbacks do not have to act as end points; loadUser can perform a task, then call next() to continue matching subsequent routes.
//router.all('*', requireAuthentication, loadUser);

//You can then use a router for a particular root URL in this way separating your routes into files or even
// mini-apps.
//Middleware is like a plumbing pipe: requests start at the first middleware function defined and work their way “down” 
//the middleware stack processing for each path they match.

app.use('/api/v1', router);
//  .../search/:farmid
router.use('/sensorData', sensorDataRoute);
//  .../permissions .../test
router.use('/authorization', authzRoute);

async function run() {
    await new Promise(resolve => app.listen(4000, () => resolve()));
    console.log('Listening on port 4000');
}

run();