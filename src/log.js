const winston = require('winston');
const config = require('./config');

var logger = new (winston.Logger)({
  level: config.logLevel, //set to debug for more traces
  transports: [
    new winston.transports.Console({ json: false, timestamp: true }),
    new winston.transports.File({ filename: './debug.log', json: false })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({ json: false, timestamp: true }),
    new winston.transports.File({ filename: './exceptions.log', json: false })
  ],
  exitOnError: false
});

module.exports = logger;
