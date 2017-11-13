"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');
const querystring = require('querystring');
const mongoProxy   = require('./mongo-proxy.js');
const orionProxy   = require('./orion-proxy.js');
const elsProxy     = require('./els-proxy.js');
const socialsProxy = require('./social-proxy.js');
const notifsProxy  = require('./notif-proxy.js');
const domainsProxy  = require('./domain-proxy.js');
const usersProxy   = require('../routes/users/user.route.js');

function install(router, keycloak) {
  
  //install all routes
  installDomains(router, keycloak)
  installSensors(router, keycloak)
  installHistory(router, keycloak)
  installSocials(router, keycloak)
  installNotifs( router, keycloak)
  installUsers(  router, keycloak)

  //install error handler
  router.use(proxyError);
}

function installDomains(router, keycloak) {
 
  //routes to backend components
  router.get(    '/domains',          proxy(req => domainsProxy.getDomains(), true));
  router.post(   '/domains',          proxy(req => domainsProxy.postDomains(req.body), true)); 
  router.get(    '/domains/:domain',  proxy(req => domainsProxy.getDomain(req.params.domain), true));
  router.delete( '/domains/:domain',  proxy(req => domainsProxy.deleteDomain(req.params.domain), true));
}

function installSensors(router, keycloak) {
 
  //protect endpoints
  router.all(    '/domains/:domain/sensors*',                                          proxyAuth((req, roles) => protect(roles, req.method, req.params.domain, 'sensors')))

  //routes to backend components
  router.get(    '/domains/:domain/sensors',                                           proxy(req => orionProxy.getSensorsOrion(           req.params.domain, req.query), true));
  router.post(   '/domains/:domain/sensors',                                           proxy(req => orionProxy.postSensorOrion(           req.params.domain, req.body)), 
                                                                                       proxy(req => mongoProxy.postSensorMongo(           req.params.domain, req.body), true));
  router.get(    '/domains/:domain/sensors/:sensorID',                                 proxy(req => orionProxy.getSensorOrion(            req.params.domain, req.params.sensorID), true))
  router.delete( '/domains/:domain/sensors/:sensorID',                                 proxy(req => orionProxy.deleteSensor(              req.params.domain, req.params.sensorID)),
                                                                                       proxy(req => mongoProxy.deleteSensorMongo(         req.params.domain, req.params.sensorID), true));
  router.put(    '/domains/:domain/sensors/:sensorID/owner',                           proxy(req => orionProxy.putSensorOwner(            req.params.domain, req.params.sensorID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/location',                        proxy(req => orionProxy.putSensorLocation(         req.params.domain, req.params.sensorID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/name',                            proxy(req => orionProxy.putSensorName(             req.params.domain, req.params.sensorID, req.body), true));

  router.get(    '/domains/:domain/sensors/:sensorID/measurements',                    proxy(req => orionProxy.getSensorMeasurements(     req.params.domain, req.params.sensorID), true));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements',                    proxy(req => orionProxy.postSensorMeasurement(     req.params.domain, req.params.sensorID, req.body)),
                                                                                       proxy(req => mongoProxy.postSensorMeasMongo(       req.params.domain, req.params.sensorID, req.body), true));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID',            proxy(req => orionProxy.getSensorMeasurement(      req.params.domain, req.params.sensorID, req.params.measID), true));
  router.delete( '/domains/:domain/sensors/:sensorID/measurements/:measID',            proxy(req => orionProxy.deleteSensorMeasurement(   req.params.domain, req.params.sensorID, req.params.measID)),
                                                                                       proxy(req => mongoProxy.deleteMeasMongo(           req.params.domain, req.params.sensorID, req.params.measID), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/name',       proxy(req => orionProxy.putSensorMeasurementName(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/dimension',  proxy(req => orionProxy.putSensorMeasurementDim(   req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/unit',       proxy(req => orionProxy.putSensorMeasurementUnit(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/sensor_kind',proxy(req => orionProxy.putSensorMeasurementKind(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID/values',     proxy(req => mongoProxy.getSensorMeasurementValues(req.params.domain, req.params.sensorID, req.params.measID), true));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements/:measID/values',     proxy(req => orionProxy.getSensorMeasurement(      req.params.domain, req.params.sensorID, req.params.measID)),
                                                                                       proxy(req => mongoProxy.postDatapointMongo(        req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
}

function installHistory(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/history/*', proxyAuth((req, roles) => protect(roles, req.method, req.params.domain, 'history')))
  //history endpoint
  router.get(    '/domains/:domain/history/*', elsProxy.getHistory);
}

function installSocials(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/socials*', proxyAuth((req, roles) => protect(roles, req.method, req.params.domain, 'socials')))
  
  //socials endpoint
  router.get(    '/domains/:domain/socials',        proxy(req => socialsProxy.getSocialMsgs(     req.params.domain), true));
  router.post(   '/domains/:domain/socials',        proxy(req => socialsProxy.postSocialMsg(     req.params.domain, req.body), true));
  router.get(    '/domains/:domain/socials/:msgID', proxy(req => socialsProxy.getSocialMsg(      req.params.domain, req.params.msgID), true));
  router.delete( '/domains/:domain/socials/:msgID', proxy(req => socialsProxy.deleteSocialMsg(   req.params.domain, req.params.msgID), true));
  router.post(   '/domains/:domain/socials/batch',  proxy(req => socialsProxy.postSocialMsgBatch(req.params.domain, req.body), true));
}

function installNotifs(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/notifications*', proxyAuth((req, roles) => protect(roles, req.method, req.params.domain, 'notifications')))
  
  //notifications endpoint
  router.get(    '/domains/:domain/notifications',          proxy(req => notifsProxy.getNotifsOrion(  req.params.domain), true));
  router.post(   '/domains/:domain/notifications',          proxy(req => notifsProxy.postNotifOrion(  req.params.domain, req.body), true));
  router.get(    '/domains/:domain/notifications/:notifID', proxy(req => notifsProxy.getNotifOrion(   req.params.domain, req.params.notifID), true));
  router.delete( '/domains/:domain/notifications/:notifID', proxy(req => notifsProxy.deleteNotifOrion(req.params.domain, req.params.notifID), true));

}

function installUsers(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/users*', proxyAuth((req, roles) => protect(roles, req.method, req.params.domain, 'users')))
  
  //users endpoint
  router.post(   '/domains/:domain/auth',           proxy(req => usersProxy.postAuth(  req.body), true));
  router.get(    '/domains/:domain/users',          proxy(req => usersProxy.getUsers(  req.params.domain), true));
  router.post(   '/domains/:domain/users',          proxy(req => usersProxy.postUsers( req.params.domain), true));
  router.get(    '/domains/:domain/users/:userID',  proxy(req => usersProxy.getUser(   req.params.domain, req.params.userID), true));
  router.delete( '/domains/:domain/users/:userID',  proxy(req => usersProxy.deleteUser(req.params.domain, req.params.userID), true));
  router.put(    '/domains/:domain/users/:userID',  proxy(req => usersProxy.putUser(   req.params.domain, req.params.userID), true));

}

//Perform one or several requests to backend components and send back results to user
function proxy(request, isFinal) {
  return async (req, res, next) => { 
    try {
      var resp = await request(req)
      //send the result back to the user
      if(isFinal) {
        res.send(resp);
      } else {
        next();
      }
    } catch(err) {
      console.log('catch error')
      next(err)
    }
  }
}

function proxyError(err, req, res, next) {

  if (err.response) {
    // The request was made and the server responded with a status code
    // We forward it to the user
    res.status(err.response.status);
    res.send(err.response.data); 
    console.log('Proxy response error:', err.response.status);
    if (err.response.data) console.log(' msg:', err.response.data);
  } else if (err.request) {
    // The request was made but no response was received
    console.log('Proxy error, no response received');
    res.status(503);
    res.send('Proxy error: backend service unavailable');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Proxy error:', err);
    console.log('Proxy error:', err.stack);
    res.status(500);
    res.send(err.stack);

  }
}

function proxyAuth(protect) {
  return async (req, res, next) => {
    
    var roles = {}
    var kauth = req.kauth
    //check that token is recognised
    if (kauth && kauth.grant) {

      roles = kauth.grant.access_token.content.realm_access.roles
    } else { //if no token, use default permissions
      try {
         roles = await usersProxy.getRoles('guest')
         console.log('Roles:' + JSON.stringify(roles))
      } catch(err) {
         console.log('Error in Keycloak protect')
         next(err)
      }
    } 
    if (protect(req, roles)) {
      console.log('Access granted')
      next('route');
    } else {
      res.status(403);
      res.send('Access denied');
    }
  }
};

function protect(roles, method, domain, resourceType) {

  console.log('roles: ' + JSON.stringify(roles))
  const accs = roles.map(r => hasAccess(method, domain, resourceType, r))
  return accs.some(a => a == true) 
}

function hasAccess(method, domain, resType, role) {

   const roleElems = splitRole(role)
   const permAccess = isPermAccess(method, roleElems.perm)
   const domainAccess = domain == roleElems.domain
   const resTypeAccess = resType? resType == roleElems.resourceType : true

   console.log('access role ' + JSON.stringify(roleElems))
   console.log('access perm ' + permAccess)
   console.log('access domain ' + domainAccess)
   console.log('access res type ' + resTypeAccess)
   return permAccess && domainAccess && resTypeAccess
}

// view/manage permission level
function isPermAccess(method, perm) {

  switch(perm) {
    case 'manage': return true;
    case 'view': {
      if (method == 'GET') {
        return true;
      } else {
        return false;
      }
    }
    default: return false;
  }
}

//Splits the roles.
//Roles should have the shape <view|manage>:<domain>:<resType>, for example view:farm1:sensors
function splitRole(role) {
  const s = role.split(':')
  return {
    perm: s[0],
    domain: s[1]? s[1]: null,
    resourceType: s[2]? s[2]: null,
    resource: s[3]? s[3]: null
  }

}

module.exports = { 
  install,
  proxyError
} 
