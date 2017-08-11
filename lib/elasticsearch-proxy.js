"use strict";

const Promise = require('bluebird');
const express = require('express');
const request = require('request');
const path = require('path');
const bodyParser = require('body-parser');
//const config = require('../lib/config.js');
const defaultConfig = require('config');
const elasticsearch = require('elasticsearch');
//const safeHandler = require('../lib/handlers');
const server = require('../lib/server');

const { AccessLevel, keycloak, servicePathProtection, getServicePathFromHeader } = server.access;

const esConfig = defaultConfig.apiserver

const methodAccess = {
    GET: AccessLevel.VIEW,
    POST: AccessLevel.EDIT,
    PUT: AccessLevel.EDIT,
    DELETE: AccessLevel.EDIT
};

function install(router, baseUrl) {
 console.log("Installing elastic search at: ", baseUrl);
 
 //proxy all API server
 router.get( '/elasticsearch/*', function( req, res ){
   console.log("callback ", req.params[0]) 
   req.pipe( request({
       url: 'http://localhost:9200/' + req.params[0],
       qs: req.query,
       method: req.method
   })).pipe( res );
 });


//    for (const method in methodAccess) {
//        const accessLevel = methodAccess[method];
//
//        router[method.toLowerCase()](baseUrl, servicePathProtection(accessLevel, getServicePathFromHeader), (req, res, next) => {
//            //proxyOrion(method, '', req, res)
//            next();
//        });
//
//        router[method.toLowerCase()](baseUrl + '/*', servicePathProtection(accessLevel, getServicePathFromHeader), (req, res, next) => {
//            //proxyOrion(method, '/' + req.params[0], req, res)
//            next();
//        });
//    }
}

module.exports = {install};
