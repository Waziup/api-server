"use strict";

const config = require('config');
const helpers = require('./helpers');

config.getOrElse = (key, defaultValue) => {
    if (config.has(key)) {
        return config.get(key);
    } else {
        return defaultValue;
    }
}

config.mergeWith = (obj, key) => {
    return Object.assign({}, config.getOrElse(key, {}), obj || {});
}

if (process.env.API_SERVER_EXTRA_CONFIG_DIR) {
    const extraConfig = config.util.loadFileConfigs(process.env.API_SERVER_EXTRA_CONFIG_DIR);
    config.util.extendDeep(config, extraConfig)
}

module.exports = config;