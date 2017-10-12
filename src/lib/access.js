"use strict";

const config = require('../config');
const Keycloak = require('keycloak-connect');
const CircularJSON = require('circular-json');

const AccessLevel = {
    VIEW: 0,
    EDIT: 1
};


function getServicePathFromHeader(req) {
    return req.headers['fiware-servicepath'];
}

/*
 This extracts the "permissions" field from the access token and transforms it in the following way:

 "admin ; advisor : /FARM1;advisor:/FARM2 ; farmer : /FARM2;"

 =>

 {
 admin: [],
 advisor: [ '/FARM1', '/FARM2' ],
 farmer: [ '/FARM2' ]
 }
 */
function extractPermissions(req) {
    const permString = req.kauth.grant.access_token.content.permissions;
    const permissions = {};

    if (permString === undefined)
        return permissions;
    const permPairs = permString.split(/\s*;\s*/).map(permPair => permPair.split(/\s*:\s*/));

    for (const permPair of permPairs) {
        const key = permPair[0];
        let value;
        if (!!permPair[1])
            value = permPair[1].toUpperCase();

        if (!(key in permissions)) {
            permissions[key] = [];
        }

        if (value !== undefined) {
            permissions[key].push(value);
        }
    }

    return permissions;
}

function _servicePathIncluded(permissions, reqServicePath) {
    //let reqServicePath = reqServicePath.toUpperCase();
    //console.log("permissions: ", permissions, "reqServicePath: ", reqServicePath);
    return permissions && permissions.some(sp => reqServicePath.toUpperCase() === sp.toUpperCase() || reqServicePath.toUpperCase().startsWith(sp.toUpperCase()));
}

/*
 Allows access to a handler only if the user has permission admin or advisor/farmer with a service path
 which equals is is a parent to the requested service path.

 Parameter "getServicePath" is a function (request => servicePath) that extracts the service path from the request.
 Returns: function(req, res, next)
 The function returned can be used as middleware in express app
 */
function servicePathProtection(accessLevel, getServicePath, keycloak) {
    console.log(accessLevel);

    //isAuthorized takes a token and a request and returns a boolean
    const isAuthorized = (token, req) => {
        const permissions = extractPermissions(req);
        const servicePath = getServicePath(req).toUpperCase();
        console.log("permissions:" + JSON.stringify(permissions));
        console.log("servicePath:" + servicePath);
        console.log("accessLevel:" + accessLevel);


        const result =
            servicePath && (

                !!permissions['admin'] ||

                (accessLevel === AccessLevel.EDIT && !!permissions['advisor'] &&
                    _servicePathIncluded(permissions['advisor'], servicePath)) ||

                (accessLevel === AccessLevel.VIEW && (
                    (!!permissions['advisor'] && _servicePathIncluded(permissions['advisor'], servicePath)) ||
                    (!!permissions['farmer']  && _servicePathIncluded(permissions['farmer'], servicePath))
                ))
            )

        console.log("auth result:" + result);
        return result;
    };

    // keycloak protect takes a "spec" function
    // and returns a function(req, res, next)
    return keycloak.protect(isAuthorized);
}

//FIXME
function adminProtection(keycloak) {
    return keycloak.protect((token, req) => {
        const permissions = extractPermissions(req);
        const result = !!permissions['admin'] || !!permissions['advisor'] || !!permissions['farmer'];
        return result;
    });
}


module.exports = {
        AccessLevel,
        extractPermissions,
        servicePathProtection,
        getServicePathFromHeader,
        adminProtection
}
