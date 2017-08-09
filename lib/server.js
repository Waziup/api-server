"use strict";

const express = require('express');
const accessSetup = require('./access');

const app = express();
const access = accessSetup(app);

module.exports = {
    app,
    access
};