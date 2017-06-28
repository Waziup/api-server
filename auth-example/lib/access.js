"use strict";

const Keycloak = require('keycloak-connect');

const AccessLevel = {
    VIEW: 0,
    EDIT: 1
};

function setup(app, sessionStore) {

    const keycloak = new Keycloak({ store: sessionStore });

    /*
     This extracts the "permissions" field from the access token and transforms it in the following way:

     "admin ; advisor : /FARM1;advisor:/FARM2 ; farmer : /FARM2"

     =>

     {
     admin: [],
     advisor: [ '/FARM1', '/FARM2' ],
     farmer: [ '/FARM2' ]
     }
     */
    function extractPermissions(req) {
	
        const permString = req.kauth.grant.access_token.content.permissions;
        //check if permissions does not exist
        if (permString === undefined)
	        return {};
	    //process.stdout.write(permString);
        const permPairs = permString.split(/\s*;\s*/).map(permPair => permPair.split(/\s*:\s*/));

        const permissions = {};

        for (const permPair of permPairs) {
            const key = permPair[0];
            const value = permPair[1];

            if (!(key in permissions)) {
                permissions[key] = [];
            }

            if (value !== undefined) {
                permissions[key].push(value);
            }
        }

        return permissions;
    }

    function _servicePathIncluded(permission, servicePath) {
	//check sp permission.some.sp (/home/mehdi/git/it21/auth-example/lib/access.js:53:85)
        return servicePath && permission && permission.some(sp => servicePath === sp || servicePath.startsWith(sp + '/'));
    }

    /*
     Allows access to a handler only if the user has permission admin or advisor/farmer with a service path
     which equals is is a parent to the requested service path.

     Parameter "getServicePath" is a function (request => servicePath) that extracts the service path from the request.
     */
    function protectByServicePath(accessLevel, getServicePath) {
        return keycloak.protect((token, req) => {
            const permissions = extractPermissions(req);
            const servicePath = getServicePath(req);

            //should we put control here? to check permissions and servicePath or ..

            const result =
                !!permissions['admin'] ||

                (accessLevel === AccessLevel.EDIT &&
                _servicePathIncluded(permissions['advisor'], servicePath)) ||

                (accessLevel === AccessLevel.VIEW && (
                    _servicePathIncluded(permissions['advisor'], servicePath) ||
                    _servicePathIncluded(permissions['farmer'], servicePath)
                ))
            ;

            return result;
        });
    }


    /*
     The same as protectByServicePath. Only it assumes urls of type /.../* where "*" is the actual service path.
     */
    function protectByServicePathParam(accessLevel) {
        return protectByServicePath(accessLevel, req => '/' + req.params[0]);
    }


    app.use(keycloak.middleware());

    app.use(keycloak.middleware({
        logout: '/logout',
        admin: '/'
    }));

    return {
        AccessLevel,
        keycloak,
        extractPermissions,
        protectByServicePath,
        protectByServicePathParam
    }
}

module.exports = setup;

