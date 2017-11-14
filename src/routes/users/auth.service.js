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
     client_id: config.keycloakClientId, 
     client_secret: config.keycloakClientSecret
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
   console.log(JSON.stringify(settings))
   //perform request to Keycloak
   const resp = await keycloakProxy.keycloakRequest(realm, path, 'POST', querystring.stringify(settings), null, false, null, 'application/x-www-form-urlencoded');
   return resp.access_token;
}

async function authz(name, scopes, token) {
  var perms = getPerms(name, scopes)
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/entitlement/waziup', 'POST', perms, null, false, token, 'application/json')
}

function getPerms(name, scopes) {
  let perms = {
     permissions: [
        {
            "resource_set_name" : name,
            "scopes" : scopes
        }
    ]
  }
  return perms;
}

module.exports = {
  getUserAuthToken,
  getAdminAuthToken,
  authz
  } 
