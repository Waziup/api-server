const axios = require('axios');
const admin_creds = require('../admin-settings');
const config = require('../config.js');
const querystring = require('querystring');
const keycloakProxy = require('../lib/keycloakProxy')
const authN = require('./authN')
const users = require('../routes/users/user.service.js')
const log = require('../log.js');


const SCOPE_USERS_CREATE         = 'users:create'
const SCOPE_USERS_VIEW           = 'users:view'
const SCOPE_USERS_UPDATE         = 'users:update'
const SCOPE_USERS_DELETE         = 'users:delete'
const SCOPE_SENSORS_CREATE       = 'sensors:create'
const SCOPE_SENSORS_VIEW         = 'sensors:view'
const SCOPE_SENSORS_UPDATE       = 'sensors:update'
const SCOPE_SENSORS_DELETE       = 'sensors:delete'
const SCOPE_DOMAINS_CREATE       = 'domains:create'
const SCOPE_DOMAINS_VIEW         = 'domains:view'
const SCOPE_DOMAINS_UPDATE       = 'domains:update'
const SCOPE_DOMAINS_DELETE       = 'domains:delete'
const SCOPE_SOCIALS_CREATE       = 'socials:create'
const SCOPE_SOCIALS_VIEW         = 'socials:view'
const SCOPE_SOCIALS_UPDATE       = 'socials:update'
const SCOPE_SOCIALS_DELETE       = 'socials:delete'
const SCOPE_NOTIFICATIONS_CREATE = 'notifications:create'
const SCOPE_NOTIFICATIONS_VIEW   = 'notifications:view'
const SCOPE_NOTIFICATIONS_UPDATE = 'notifications:update'
const SCOPE_NOTIFICATIONS_DELETE = 'notifications:delete'
const SCOPE_HISTORY_CREATE       = 'history:create'
const SCOPE_HISTORY_VIEW         = 'history:view'
const SCOPE_HISTORY_UPDATE       = 'history:update'
const SCOPE_HISTORY_DELETE       = 'history:delete'

const RESOURCE_USERS         = 'Users'
const RESOURCE_SENSORS       = 'Sensors'
const RESOURCE_DOMAINS       = 'Domains'
const RESOURCE_HISTORY       = 'History'
const RESOURCE_NOTIFICATIONS = 'Notifications'
const RESOURCE_SOCIALS       = 'Socials'

async function authorize(resourceName, resourceType, method, token) {
  if (method == 'GET' || method == 'POST' || method == 'PUT' || method == 'DELETE') {
    const scope = getScope(resourceType, method)
    const perms = getPerms(resourceName, [scope])
    return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/entitlement/' + config.keycloakClientId, 'POST', perms, null, false, token, 'application/json')
  } else {
    //Other HTTP methods are allowed.
    return;
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

  const guest = await users.findByName('guest')
  const id = kauth && kauth.grant ? kauth.grant.access_token.content.sub : guest.id
  return createResource(sensor.id, 'domain:' + domain, '/sensors/' + sensor.id, [SCOPE_SENSORS_CREATE, SCOPE_SENSORS_VIEW, SCOPE_SENSORS_UPDATE, SCOPE_SENSORS_DELETE], id) 
}

async function createDomainResource(domain, kauth) {

  const guest = await users.findByName('guest')
  const id = kauth && kauth.grant ? kauth.grant.access_token.content.sub : guest.id
  return createResource(domain.id, 'domain:' + domain.id, '/domains/' + domain.id, [SCOPE_DOMAINS_CREATE, SCOPE_DOMAINS_VIEW, SCOPE_DOMAINS_UPDATE, SCOPE_DOMAINS_DELETE], id) 
}

async function deleteResource(name) {
  const token = await authN.getClientAuthToken()
  const id = await getResourceByName(name)
  log.debug('delete resource ID=' + id)
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set/' + id, 'DELETE', null, null, false, token, null)
}

async function getResourceByName(name) {

  const token = await authN.getClientAuthToken()
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set?filter=name=' + name, 'GET', null, null, false, token, null)
}


function getScope(resourceType, method) {
   
   switch(resourceType) {
     case RESOURCE_DOMAINS: {
       switch(method) {
         case 'POST':   return SCOPE_DOMAINS_CREATE;
         case 'GET':    return SCOPE_DOMAINS_VIEW;
         case 'PUT':    return SCOPE_DOMAINS_UPDATE;
         case 'DELETE': return SCOPE_DOMAINS_DELETE;
         default: throw('unsupported method');
       }
     }
     case RESOURCE_USERS: {
       switch(method) {
         case 'POST':   return SCOPE_USERS_CREATE;
         case 'GET':    return SCOPE_USERS_VIEW;
         case 'PUT':    return SCOPE_USERS_UPDATE;
         case 'DELETE': return SCOPE_USERS_DELETE;
         default: throw('unsupported method');
       }
     }
     case RESOURCE_SENSORS: {
       switch(method) {
         case 'POST':   return SCOPE_SENSORS_CREATE;
         case 'GET':    return SCOPE_SENSORS_VIEW;
         case 'PUT':    return SCOPE_SENSORS_UPDATE;
         case 'DELETE': return SCOPE_SENSORS_DELETE;
         default: throw('unsupported method');
       }
     }
     case RESOURCE_HISTORY: {
       switch(method) {
         case 'POST':   return SCOPE_HISTORY_CREATE;
         case 'GET':    return SCOPE_HISTORY_VIEW;
         case 'PUT':    return SCOPE_HISTORY_UPDATE;
         case 'DELETE': return SCOPE_HISTORY_DELETE;
         default: throw('unsupported method:' + method);
       }
     }
     case RESOURCE_NOTIFICATIONS: {
       switch(method) {
         case 'POST':   return SCOPE_NOTIFICATIONS_CREATE;
         case 'GET':    return SCOPE_NOTIFICATIONS_VIEW;
         case 'PUT':    return SCOPE_NOTIFICATIONS_UPDATE;
         case 'DELETE': return SCOPE_NOTIFICATIONS_DELETE;
         default: throw('unsupported method');
       }
     }
     case RESOURCE_SOCIALS: {
       switch(method) {
         case 'POST':   return SCOPE_SOCIALS_CREATE;
         case 'GET':    return SCOPE_SOCIALS_VIEW;
         case 'PUT':    return SCOPE_SOCIALS_UPDATE;
         case 'DELETE': return SCOPE_SOCIALS_DELETE;
         default: throw('unsupported method');
       }
     }
     default: throw('unsupported resource type');
   }
}

module.exports = {
  authorize,
  createSensorResource,
  createDomainResource,
  deleteResource,
  RESOURCE_USERS,
  RESOURCE_SENSORS,
  RESOURCE_DOMAINS,
  RESOURCE_HISTORY,
  RESOURCE_NOTIFICATIONS,
  RESOURCE_SOCIALS
}
