"use strict";

const util = require('util');
const log = require('./log');

module.exports.dump = (obj) => {
    log.debug(util.inspect(obj, false, null));
};

module.exports.safeHandler = (handler) => {
    return function(req, res) {
        handler(req, res).catch(error => res.status(500).send(error.message));
    };
}

