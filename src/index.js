"use strict";

const Promise = require('bluebird');
const express = require('express');
//const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const elasticsearch = require('./elasticsearch');
const accessSetup = require('./authorization/lib/access');
//const server = require('./lib/server');

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
const { AccessLevel, extractPermissions, protectByServicePath, protectByServicePathParam } = access;


const router = express.Router();
router.get('/search/:farmid', safeHandler(elasticsearch));

app.use('/api/v1', router);


//Securing endpoints
// http://.../test?sp=/FARM1
app.get('/test', protectByServicePath(AccessLevel.VIEW, req => req.query.sp), function (req, res) {
    res.json({
        result: 'OK'
    });
});

// http://.../orion/FARM1
app.get('/orion/*', protectByServicePathParam(AccessLevel.VIEW), function (req, res) {
    res.json({
        result: 'OK'
    });
});

// http://.../orion/FARM1
app.post('/orion/*', protectByServicePathParam(AccessLevel.EDIT), function (req, res) {
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
