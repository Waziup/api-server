const axios = require('axios');
const admin_creds = require('./admin-settings');
const config = require('../../config.js');
const querystring = require('querystring');
const keycloakProxy = require('./keycloakProxy')

async function getUserAuthToken(cred) {
   const settings = {
     username: cred.username,
     password: cred.password,
     grant_type: 'password',
     client_id: config.keycloakClientId 
   }
   return getAuthToken(config.keycloakRealm, settings);
}

async function getAdminAuthToken() {
   const settings = {
     username: admin_creds.username,
     password: admin_creds.password,
     grant_type: 'password',
     client_id: 'admin-cli'
   }
   return getAuthToken('master', settings);
}

async function getAuthToken(realm, settings) {
   const path = 'protocol/openid-connect/token';

   //perform request to Keycloak
   const resp = await keycloakProxy.keycloakRequest(realm, path, 'POST', querystring.stringify(settings), null, false);
   return resp.access_token;
}

module.exports = {
  getUserAuthToken,
  getAdminAuthToken
  } 
