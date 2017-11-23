const axios = require('axios');
const admin_creds = require('../admin-settings');
const config = require('../config.js');
const querystring = require('querystring');
const keycloakProxy = require('../lib/keycloakProxy')
const authN = require('./authN')

async function authorize(resourceName, resourceType, method, token) {
  const scope = getScope(resourceType, method)
  var perms = getPerms(resourceName, [scope])
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/entitlement/waziup', 'POST', perms, null, false, token, 'application/json')
}

function getScope(resourceType, method) {
   switch(method) {
     case 'POST':   return resourceType + ':create';
     case 'PUT':    return resourceType + ':update';
     case 'DELETE': return resourceType + ':delete';
     default:       return resourceType + ':view';
   }
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
   const token = await authN.getClientAuthToken()
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set', 'POST', res, null, false, token, 'application/json')
}

async function createSensorResource(domain, sensor, kauth) {

  const username = kauth && kauth.grant ? kauth.grant.access_token.username : 'guest'
  return createResource(sensor.id, 'domain:' + domain, '/sensors/' + sensor.id, ["view", "create", "delete", "update"], username) 
}

async function createDomainResource(domain, kauth) {

  const username = kauth && kauth.grant ? kauth.grant.access_token.username : 'guest'
  return createResource(domain.id, 'domain:' + domain.id, '/domains/' + domain.id, ["view", "create", "delete", "update"], username) 
}

async function deleteResource(name) {
  const token = await authN.getClientAuthToken()
  const id = await getResourceByName(name)
  console.log('delete resource ID=' + id)
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set/' + id, 'DELETE', null, null, false, token, null)
}

async function getResourceByName(name) {

  const token = await authN.getClientAuthToken()
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set?filter=name=' + name, 'GET', null, null, false, token, null)
}


module.exports = {
  authorize,
  createSensorResource,
  createDomainResource,
  deleteResource
  } 
