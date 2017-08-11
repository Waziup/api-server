"use strict";

const Promise = require('bluebird');
const express = require('express');
const request = require('request');
const path = require('path');
const bodyParser = require('body-parser');
const defaultConfig = require('config');
const elasticsearch = require('elasticsearch');
const server = require('../lib/server');
const config = require('config');

const { AccessLevel, keycloak, servicePathProtection, getServicePathFromHeader } = server.access;

const esConfig = defaultConfig.apiserver

const methodAccess = {
    GET: AccessLevel.VIEW,
    POST: AccessLevel.EDIT,
    PUT: AccessLevel.EDIT,
    DELETE: AccessLevel.EDIT
};

function proxy( req, res) {

   const forwardURL = config.elasticsearchurl + '/' + req.params[0];
   console.log("forwarding call to", forwardURL);

   const options = {url: forwardURL, 
                    qs: req.query, 
                    method: req.method}

   const errorHandler = (err) => {
       console.error('Exception while connecting: ', err);
       res.status(500).send('Connection refused')
   }

   var myRequest = request(options).on('error', errorHandler)
   req.pipe( myRequest).pipe( res );
}

function install(router, baseUrl) {
    console.log("Installing elastic search at: ", baseUrl);
    
    //proxy elasticsearch queries
    router.get( baseUrl + '/*', proxy);
}

module.exports = {install};
