"use strict";

const server = require('./server');
const app = server.app;
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = server.access;
const request = require('request');
const url = require('url');
const config = require('config');

const methodAccess = {
    GET: AccessLevel.VIEW,
    POST: AccessLevel.EDIT,
    PUT: AccessLevel.EDIT,
    DELETE: AccessLevel.EDIT
};

function proxyOrion(method, path, req, res) {
    const reqUrl = url.parse(req.url);
    const orionHost = config.get('orion-url');
    //v2/entities
    const proxyUrl = `${orionHost}${path}${reqUrl.search || ''}`; 
    console.log('path:', path);
    console.log('method:', method);
    console.log('req.body:', req.body);
    console.log('proxyUrl:', proxyUrl);
    
    const options = {
        method,
        url: proxyUrl,
        headers: {
            'Fiware-Service': req.headers['fiware-service'],
            'Fiware-ServicePath': req.headers['fiware-servicepath']
        }
    };

    //GET method gives error if req has a body  || req.body !== {}
    if(method !== 'GET' && method !== 'DELETE') {
        if(!!req.body && Object.values(req.body).length !== 0)
            options.body = req.body;
        options.json = true;
    }
    
    request(options).pipe(res);       
}

function install(router, baseUrl) {
    for (const method in methodAccess) {
        const accessLevel = methodAccess[method];

        router[method.toLowerCase()](baseUrl, servicePathProtection(accessLevel, getServicePathFromHeader), (req, res) => {
            proxyOrion(method, '', req, res)
        });

        router[method.toLowerCase()](baseUrl + '/*', servicePathProtection(accessLevel, getServicePathFromHeader), (req, res) => {
            proxyOrion(method, '/' + req.params[0], req, res)
        });
    }
}

module.exports = {
    install
};
