const axios = require('axios');
const admin_creds = require('../admin-settings');
const config = require('../config.js');
const querystring = require('querystring');
const keycloakProxy = require('../lib/keycloakProxy')

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

async function getClientAuthToken() {
   const settings = {
     grant_type: 'client_credentials',
     client_id: config.keycloakClientId, 
     client_secret: config.keycloakClientSecret
   }
   return getAuthToken(config.keycloakRealm, settings);
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

async function createResource(name, type, uri, scopes, username) {
   const res = {
    name: name,
    type: type,
    uri: uri,
    scopes: scopes,
    owner: username
   } 
   const token = await getClientAuthToken()
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set', 'POST', res, null, false, token, 'application/json')
}

async function createSensorResource(domainName, sensor, kauth) {

  const username = kauth && kauth.grant ? kauth.grant.access_token.username : 'guest'
  return createResource(sensor.id, 'domain:' + domainName, '/sensors/' + sensor.id, ["sensors:view", "sensors:create", "sensors:delete", "sensors:update"], username) 
}

async function createDomainResource(domain, kauth) {

  const username = kauth && kauth.grant ? kauth.grant.access_token.username : 'guest'
  return createResource(domain.name, 'domain:' + domain.id, '/domains/' + domain.id, ["domains:view", "domains:create", "domains:delete", "domains:update"], username) 
}

async function deleteResource(name) {
  const token = await getClientAuthToken()
  const id = await getResourceByName(name)
  console.log('delete resource ID=' + id)
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set/' + id, 'DELETE', null, null, false, token, null)
}

async function getResourceByName(name) {

  const token = await getClientAuthToken()
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set?filter=name=' + name, 'GET', null, null, false, token, null)
}

module.exports = {
  getUserAuthToken,
  getAdminAuthToken,
  getClientAuthToken
  } 
