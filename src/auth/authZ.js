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
const SCOPE_SENSORS_DATA_CREATE  = 'sensors-data:create'
const SCOPE_SENSORS_DATA_VIEW    = 'sensors-data:view'
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
const RESOURCE_DOMAINS       = 'Domains'
const RESOURCE_HISTORY       = 'History'
const RESOURCE_NOTIFICATIONS = 'Notifications'
const RESOURCE_SOCIALS       = 'Socials'

async function authorize(resourceName, scope, usertoken) {

    var resourceId = null
    
    if(resourceName == '') {
      resourceId = ''
    } else {
      resourceId = await getResourceId(resourceName)
    }
    const data = "grant_type=urn:ietf:params:oauth:grant-type:uma-ticket&audience=" + config.keycloakClientId + (scope != ''? "&permission=" + resourceId + "#" + scope: '')
    return keycloakProxy.keycloakRequest(config.keycloakRealm, 'protocol/openid-connect/token/', 'POST', data, null, false, usertoken, null)
}

async function permissions(scope, token) {
    auth = await authorize('', scope, token)
    var tok = auth.access_token.split('.')[1]
    var buf = Buffer.from(tok, 'base64').toString()
    var perms = JSON.parse(buf).authorization.permissions
    log.debug("Permissions result:" + JSON.stringify(perms))
    var perms2 = perms.map(p => {return {resource: p.rsname, scopes: p.scopes}})
    return perms2; 
  }
  
 
function getPerms(name, scopes) {
  let perms = {
    permissions: [{
      "resource_set_name" : name,
      "scopes" : scopes
    }]
  }
  return perms;
}

async function createResource(name, type, uri, scopes, username, visibility) {
   const res = {
     name: name,
     type: type,
     uri: uri,
     scopes: scopes,
     owner: username,
     ownerManagedAccess: true
   }
   console.log("Visibility:" + visibility)
   if(typeof visibility !== 'undefined') {
     res.attributes = { visibility: visibility}
   }
   const token = await authN.getClientAuthToken()
   return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set', 'POST', res, null, false, token, 'application/json')
}

async function createSensorResource(domain, sensor, kauth) {

  const guest = await users.findByName('guest')
  const id = kauth && kauth.grant ? kauth.grant.access_token.content.sub : guest.id
  return createResource(sensor.id, 'domain:' + domain, '/sensors/' + sensor.id, 
                        [SCOPE_SENSORS_VIEW, SCOPE_SENSORS_UPDATE, SCOPE_SENSORS_DELETE, SCOPE_SENSORS_DATA_CREATE, SCOPE_SENSORS_DATA_VIEW], id, sensor.visibility) 
}

async function createDomainResource(domain, kauth) {

  const guest = await users.findByName('guest')
  const id = kauth && kauth.grant ? kauth.grant.access_token.content.sub : guest.id
  return createResource(domain.id, 'domain:' + domain.id, '/domains/' + domain.id, [SCOPE_DOMAINS_CREATE, SCOPE_DOMAINS_VIEW, SCOPE_DOMAINS_UPDATE, SCOPE_DOMAINS_DELETE], id) 
}

async function deleteResource(name) {
  const token = await authN.getClientAuthToken()
  const id = await getResourceId(name, token)
  log.debug('delete resource ID=' + id)
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set/' + id, 'DELETE', null, null, false, token, null)
}

async function getResourceByName(name) {

  const token = await authN.getClientAuthToken()
  const ids = await getResourceId(name, token)
  return await keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set/' + ids[0], 'GET', null, null, false, token, null)
}

async function getResourceId(name, token) {

  if(!token) {
    token = await authN.getClientAuthToken()
  }
  return await keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set?name=' + name, 'GET', null, null, false, token, null)
}

async function getResourceOwner(name) {
  const res = await getResourceByName(name)
  return users.find("waziup", {ownerId: res.owner.id})
}

async function setResourceVisibility(name, visibility) {
  console.log("name:" + name)
  const token = await authN.getClientAuthToken()
  const res = await getResourceByName(name)
  res.attributes = {visibility: visibility}
  return keycloakProxy.keycloakRequest(config.keycloakRealm, 'authz/protection/resource_set/' + res._id, 'PUT', res, null, false, token, 'application/json')
}

module.exports = {
  authorize,
  permissions,
  createSensorResource,
  createDomainResource,
  deleteResource,
  getResourceByName,
  setResourceVisibility,
  RESOURCE_USERS,
  RESOURCE_DOMAINS,
  RESOURCE_HISTORY,
  RESOURCE_NOTIFICATIONS,
  RESOURCE_SOCIALS,
  SCOPE_USERS_CREATE,        
  SCOPE_USERS_VIEW,          
  SCOPE_USERS_UPDATE,        
  SCOPE_USERS_DELETE,        
  SCOPE_SENSORS_CREATE,      
  SCOPE_SENSORS_VIEW,        
  SCOPE_SENSORS_UPDATE,      
  SCOPE_SENSORS_DELETE,      
  SCOPE_SENSORS_DATA_CREATE,      
  SCOPE_SENSORS_DATA_VIEW,        
  SCOPE_DOMAINS_CREATE,      
  SCOPE_DOMAINS_VIEW,        
  SCOPE_DOMAINS_UPDATE,      
  SCOPE_DOMAINS_DELETE,      
  SCOPE_SOCIALS_CREATE,      
  SCOPE_SOCIALS_VIEW,        
  SCOPE_SOCIALS_UPDATE,      
  SCOPE_SOCIALS_DELETE,      
  SCOPE_NOTIFICATIONS_CREATE,
  SCOPE_NOTIFICATIONS_VIEW,  
  SCOPE_NOTIFICATIONS_UPDATE,
  SCOPE_NOTIFICATIONS_DELETE,
  SCOPE_HISTORY_CREATE,      
  SCOPE_HISTORY_VIEW,        
  SCOPE_HISTORY_UPDATE,      
  SCOPE_HISTORY_DELETE
}
