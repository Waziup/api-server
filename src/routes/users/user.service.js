var jwt = require('jsonwebtoken');
const request = require('request');
const settings = require('./admin-settings');
const config = require('../../config.js');
const axios = require('axios');
const auth = require('./auth.service');
const keycloakProxy = require('./keycloakProxy')

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

  var token = await auth.getAdminAuthToken()
  options = options || {};
  var path;
  var queryString = null;
  if (options.userId) {
      path = `users/${options.userId}`;
  } else {
      path = `users`;
      queryString = options;
  }
  
  return keycloakProxy.keycloakRequest(config.keycloakRealm, path, 'GET', null, queryString, true, token);
}

/**
  A function to update a user for a realm
  @param {string} realmName - The name of the realm(not the realmID) - ex: master,
  @param {object} user - The JSON representation of the fields to update for the user - This must include the user.id field.
  @returns {Promise} A promise that resolves.
 */
function update(accessToken, realmName, user) {
  return new Promise((resolve, reject) => {
    user = user || {};
    const req = {
      url: `${settings.baseUrl}/admin/realms/${realmName}/users/${user.id}`,
      auth: {
          bearer: accessToken
      },
      json: true,
      method: 'PUT',
      body: user
    };
    console.log(req);
    request(req, (err, resp, body) => {
      console.log(resp.statusCode);
      if (err) {
        console.log(err);
        return reject(err);
      }

      // Check that the status cod
      if (resp.statusCode !== 204) {
        console.log(body);
        return reject(body);
      }

      return resolve(body);
    });
  });
};
module.exports = {
    find: find,
    update: update
};
