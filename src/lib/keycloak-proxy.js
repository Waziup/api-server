"use strict";

const server = require('./server');
const app = server.app;
const { AccessLevel, keycloak } = server.access;
const request = require('request');
const url = require('url');
const config = require('config');
const methodAccess = {
    GET: AccessLevel.VIEW,
    POST: AccessLevel.EDIT,
    PUT: AccessLevel.EDIT,
    DELETE: AccessLevel.EDIT
};

function proxyKeycloak(method, path, req, res) {
    const reqUrl = url.parse(req.url);
    const keycloakHost = config.get('keycloak-url');
    const proxyUrl = `${keycloakHost}${path}${reqUrl.search || ''}`;
    console.log('path:', path);
    console.log('method:', method);
    console.log('req.body:', req.body);
    console.log('proxyUrl:', proxyUrl);

    const options = {
        method,
        url: proxyUrl,
        headers: req.headers
            /*headers: {
                'Fiware-Service': req.headers['fiware-service'],
                'Fiware-ServicePath': req.headers['fiware-servicepath']
            }*/
    };

    //GET method gives error if req has a body  || req.body !== {}
    if (method !== 'GET' && method !== 'DELETE') {
        if (!!req.body && Object.values(req.body).length !== 0)
            options.body = req.body;
        options.json = true;
    }

    request(options).pipe(res);
}

function install(router, baseUrl) {
    console.log('Installing KC at:', baseUrl);

    for (const method in methodAccess) {
        //const accessLevel = methodAccess[method];
        router[method.toLowerCase()](baseUrl, (req, res) => {
            proxyKeycloak(method, '', req, res)
        });

        router[method.toLowerCase()](baseUrl + '/*', (req, res) => {
            proxyKeycloak(method, '/' + req.params[0], req, res)
        });
    }
}

module.exports = {
    install
};
