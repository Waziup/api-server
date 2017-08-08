const express = require('express');
const server = require('../lib/server');

const { AccessLevel, keycloak, servicePathProtection, extractPermissions } = server.access;

const routerAuthz = express.Router();

routerAuthz.get('/permissions', keycloak.protect(), function (req, res) {
    res.json({
        permissions: extractPermissions(req)
    });
});

routerAuthz.get('/test1', servicePathProtection(AccessLevel.VIEW, req => req.query.sp), (req, res) => {
    res.json({
        result: 'OK'
    });
});

module.exports = routerAuthz;