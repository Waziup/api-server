const express = require('express');
const server = require('../lib/server');

//const app = server.app;
const {AccessLevel, protectByAuthentication, protectByServicePath, extractPermissions} = server.access;

//A list of roles for a user can be obtained as follows. 
//This function can be used to get a list of service paths to list farms and sensors in the UI.


/*
 	{
 	advisor: [ '/FARM1', '/FARM2' ],
 	farmer: [ '/FARM2' ]
 	}
*/

const routerAuthz = express.Router();
routerAuthz.get('/permissions', protectByAuthentication(), function (req, res) {
    res.json({
        permissions: extractPermissions(req)
    });
});

//Securing endpoints
// http://.../test?sp=/FARM1
routerAuthz.get('/test', protectByServicePath(AccessLevel.VIEW, req => req.query.sp), function (req, res) {
    res.json({
        result: 'OK'
    });
});

module.exports = routerAuthz;