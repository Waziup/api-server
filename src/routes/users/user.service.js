var jwt = require('jsonwebtoken');
const request = require('request');
const config = require('../../config.js');
const axios = require('axios');
const User = require('../../models/user.js');
const auth = require('../../auth/authN');
const keycloakProxy = require('../../lib/keycloakProxy')
const log = require('../../log.js');

/**
  A function to get the list of users or a user for a realm.
  @param {string} realmName - The name of the realm(not the realmID) - ex: master
  @param {object} [options] - The options object
  @param {string} [options.userId] - use this options to get a user by an id. If this value is populated, it overrides the querystring param options
  @param {string} [options.username] - the querystring param to search based on username
  @param {string} [options.firstName] - the querystring param to search based on firstName
  @param {string} [options.lastName] - the querystring param to search based on lastName
  @param {string} [options.email] - the querystring param to search based on email
  @returns {Promise} A promise that will resolve with an Array of user objects or just the 1 user object if userId is used
  
 */
async function find(domain, options) {
    var token = await auth.getAdminAuthToken();
    options = options || {};
    var path;
    var queryString = null;
    if (options.userId) {
        path = `users/${options.userId}`;
    } else {
        path = `users`;
        queryString = options;
    }
    var data = await keycloakProxy.keycloakRequest(config.keycloakRealm, path, 'GET', null, queryString, true, token);
    log.debug(data);
    var users = [];
    if (data.id) return new User(data);
    else {
        data.forEach(function(k) {
            users.push(new User(k));
        }, this);
        return users;
    }
}

async function findByName(domain, username) {

   const users = await find(domain, { username: username })
   return users[0]
}


/**
  A function to update a user for a realm
  @param {string} realmName - The name of the realm(not the realmID) - ex: master,
  @param {object} user - The JSON representation of the fields to update for the user - This must include the user.id field.
  @returns {Promise} A promise that resolves.
 */
async function update(realmName, user) {
    var token = await auth.getAdminAuthToken();
    return new Promise((resolve, reject) => {
        user = user || {};
        const req = {
            url: `${config.backend.keycloakUrl}/admin/realms/${realmName}/users/${user.id}`,
            auth: {
                bearer: token
            },
            json: true,
            method: 'PUT',
            body: changeToKeycloakBasicUser(user)
        };
        log.debug(req);
        request(req, (err, resp, body) => {
            log.debug(resp.statusCode);
            if (err) {
                log.warn(err);
                return reject(err);
            }

            // Check that the status cod
            if (resp.statusCode !== 204) {
                log.warn(body);
                return reject(body);
            }

            return resolve(body);
        });
    });
};

/**
  A function to update a user for a realm
  @param {string} realmName - The name of the realm(not the realmID) - ex: master,
  @param {object} user - The JSON representation of the fields to update for the user - This must include the user.id field.
  @returns {Promise} A promise that resolves.
 */

async function create(realmName, user) {
    var token = await auth.getAdminAuthToken();
    return new Promise((resolve, reject) => {
        const req = {
            url: `${config.backend.keycloakUrl}/admin/realms/${realmName}/users`,
            auth: {
                bearer: token
            },
            body: changeToKeycloakBasicUser(user),
            method: 'POST',
            json: true
        };

        request(req, (err, resp, body) => {
            if (err) {
                return reject(err);
            }

            if (resp.statusCode !== 201) {
                return reject(body);
            }

            // eg "location":"https://<url>/auth/admin/realms/<realm>/users/499b7073-fe1f-4b7a-a8ab-f401d9b6b8ec"
            const uid = resp.headers.location.replace(/.*\/(.*)$/, '$1');

            // Since the create Endpoint returns an empty body, go get what we just imported.
            // *** Body is empty but location header contains user id ***
            // We need to search based on the userid, since it will be unique
            return resolve(find(realmName, {
                userId: uid
            }));
        });
    });

};
/**
  A function to delete a user in a realm
  @param {string} realmName - The name of the realm(not the realmID) to delete - ex: master,
  @param {string} userId - The id of the user to delete
  @returns {Promise} A promise that resolves.
 */
async function remove(realmName, userId) {
    var token = await auth.getAdminAuthToken();
    return new Promise((resolve, reject) => {
        const req = {
            url: `${config.backend.keycloakUrl}/admin/realms/${realmName}/users/${userId}`,
            auth: {
                bearer: token
            },
            method: 'DELETE'
        };

        request(req, (err, resp, body) => {
            if (err) {
                return reject(err);
            }

            // Check that the status code is a 204
            if (resp.statusCode !== 204) {
                return reject(body);
            }

            return resolve(body);
        });
    });
};

function changeToKeycloakBasicUser(o) {
    var kUser = {};
    try {
        kUser.id = o.id || "";
        kUser.username = o.username || "";
        kUser.firstName = o.firstName || "";
        kUser.lastName = o.lastName || "";
        kUser.email = o.email || "";
        kUser.attributes = {};
        kUser.attributes.subservice = o.subservice || "";
        kUser.attributes.phone = o.phone || "";
        kUser.attributes.facebook = o.facebook || "";
        kUser.attributes.twitter = o.twitter || "";
        kUser.attributes.address = o.address || "";
    } catch (err) {
        log.warn("User Object: wrong format");
    }
    //kUser.roles = o.roles;
    return JSON.parse(JSON.stringify(kUser));
};
module.exports = {
    find: find,
    findByName: findByName,
    update: update,
    create: create,
    remove: remove
};
