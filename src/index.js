"use strict";

const Promise = require('bluebird');
const express = require('express');
//const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const elasticsearch = require('./elasticsearch');
const accessSetup = require('./authorization/lib/access');

function safeHandler(handler) {
    return function(req, res) {
        handler(req, res).catch(error => res.status(500).send(error.message));
    };
}

const app = express();
const memoryStore = new session.MemoryStore();

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

// app.use(express.static(path.join(__dirname, 'public')));
var cors = require('cors')
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const access = accessSetup(app, memoryStore);
const { AccessLevel, extractPermissions, protectByAuthentication, protectByServicePath, protectByServicePathParam } = access;

//The top-level express object has a Router() method that creates a new router object.
const router = express.Router();
// simple logger for this router's requests
// all requests to this router will first hit this middleware
router.use(function(req, res, next) {
  console.log('%s %s %s', req.method, req.url, req.path);
  next();
});

// does not work: blocks router.use(protectByAuthentication());
router.all('*', protectByAuthentication());
//This method is extremely useful for mapping “global” logic for specific path prefixes or arbitrary matches. For example, if you placed the following route at the top of all other route definitions, it would require that all routes from that point on would require authentication, and automatically load a user. Keep in mind that these callbacks do not have to act as end points; loadUser can perform a task, then call next() to continue matching subsequent routes.
//router.all('*', requireAuthentication, loadUser);

//You can then use a router for a particular root URL in this way separating your routes into files or even
// mini-apps.
//Middleware is like a plumbing pipe: requests start at the first middleware function defined and work their way “down” 
//the middleware stack processing for each path they match.

app.use('/api/v1', router);

//Once you’ve created a router object, you can add middleware and HTTP method routes 
//(such as get, put, post, and so on) to it just like an application.
router.get('/search/:farmid', safeHandler(elasticsearch));

router.get('/authorization/permissions', function (req, res) {
    res.json({
        permissions: extractPermissions(req)
    });
});

//A list of roles for a user can be obtained as follows. 
//This function can be used to get a list of service paths to list farms and sensors in the UI.


/*
 	{
 	advisor: [ '/FARM1', '/FARM2' ],
 	farmer: [ '/FARM2' ]
 	}
*/


//Securing endpoints
// http://.../test?sp=/FARM1
router.get('/test', protectByServicePath(AccessLevel.VIEW, req => req.query.sp), function (req, res) {
    res.json({
        result: 'OK'
    });
});

// http://.../orion/FARM1
router.get('/orion/*', protectByServicePathParam(AccessLevel.VIEW), function (req, res) {
    res.json({
        result: 'OK'
    });
});

// http://.../orion/FARM1
router.post('/orion/*', protectByServicePathParam(AccessLevel.EDIT), function (req, res) {
    res.json({
        result: 'OK'
    });
});

async function run() {
    await new Promise(resolve => app.listen(4000, () => resolve()));
    console.log('Listening on port 4000');
}

run();
// app.listen(3000, function () {
//     console.log("Listening at port 3000.");
// });