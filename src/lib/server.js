"use strict";

const express = require('express');
const session = require('express-session');
const accessSetup = require('./access');


const app = express();

const memoryStore = new session.MemoryStore();

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    store: memoryStore
}));

const access = accessSetup(app, memoryStore);

module.exports = {
    app,
    access
};