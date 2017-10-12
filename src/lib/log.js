"use strict";

const winston = require('winston');

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: 'silly'
        }),
        new (winston.transports.File)({
            filename: 'server.log',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            level: 'debug'
        })
    ]
});

module.exports = logger;