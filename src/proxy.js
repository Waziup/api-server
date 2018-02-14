"use strict";

const request = require('request');
const http = require('http');
const url = require('url');
const config = require('./config.js');
const axios = require('axios');
const querystring = require('querystring');
const mongoProxy    = require('./lib/mongo-proxy.js');
const orionProxy    = require('./lib/orion-proxy.js');
const elsProxy      = require('./lib/els-proxy.js');
const socialsProxy  = require('./lib/social-proxy.js');
const notifsProxy   = require('./lib/notif-proxy.js');
const domainsProxy  = require('./lib/domain-proxy.js');
const usersProxy    = require('./routes/users/user.route.js');
const entitiesProxy = require('./routes/entities/entities.route.js');
const authN   = require('./auth/authN.js');
const authZ   = require('./auth/authZ.js');
const log = require('./log.js');
const bodyParser = require('body-parser');

function install(router, keycloak) {
  
  //install all routes
  installAuth(    router, keycloak)
  installSensors( router, keycloak)
  installHistory( router, keycloak)
  installSocials( router, keycloak)
  installNotifs(  router, keycloak)
  installUsers(   router, keycloak)
  installEntities(router, keycloak)

  //This route should be last because it is shorter
  installDomains( router, keycloak)

  //install error handler
  router.use(proxyError);
}

function installDomains(router, keycloak) {
 
  //protect endpoints
  router.all(    '/domains/:domain*', proxy(req => authProtect(req.method, req.params.domain, req.params.domain, authZ.RESOURCE_DOMAINS, req.kauth))) // protect single domain
  router.all(    '/domains',          proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_DOMAINS, authZ.RESOURCE_DOMAINS, req.kauth))) // generic protect domains

  //routes to backend components
  router.get(    '/domains',          proxy(req => domainsProxy.getDomains(), true));
  router.post(   '/domains',          proxy(req => domainsProxy.postDomains(req.body)),
                                      proxy(req => authZ.createDomainResource(req.body, req.kauth), true)); 
  router.get(    '/domains/:domain',  proxy(req => domainsProxy.getDomain(req.params.domain), true));
  router.delete( '/domains/:domain',  proxy(req => domainsProxy.deleteDomain(req.params.domain)),
                                      proxy(req => authZ.deleteResource(req.params.domain), true)); 
}

function installSensors(router, keycloak) {
 
  //protect endpoints
  router.all(    '/domains/:domain/sensors/:sensorID*',                                proxy(req => authProtect(req.method, req.params.domain, req.params.sensorID, authZ.RESOURCE_SENSORS, req.kauth))) // protect single sensor
  router.all(    '/domains/:domain/sensors',                                           proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_SENSORS, authZ.RESOURCE_SENSORS, req.kauth))) // generic protect sensors

  //routes to backend components
  router.get(    '/domains/:domain/sensors',                                           proxy(req => orionProxy.getSensorsOrion(           req.params.domain, req.query), true));
  router.post(   '/domains/:domain/sensors',                                           proxy(req => orionProxy.postSensorOrion(           req.params.domain, req.body)), 
                                                                                       proxy(req => mongoProxy.postSensorMongo(           req.params.domain, req.body)),
                                                                                       proxy(req => authZ.createSensorResource(           req.params.domain, req.body, req.kauth), true));

  router.get(    '/domains/:domain/sensors/:sensorID',                                 proxy(req => orionProxy.getSensorOrion(            req.params.domain, req.params.sensorID, query), true))
  router.delete( '/domains/:domain/sensors/:sensorID',                                 proxy(req => orionProxy.deleteSensor(              req.params.domain, req.params.sensorID)),
                                                                                       proxy(req => mongoProxy.deleteEntityMongo(         req.params.domain, req.params.sensorID, "SensingDevice")),
                                                                                       proxy(req => authZ.deleteResource(                 req.params.sensorID), true));

  router.put(    '/domains/:domain/sensors/:sensorID/owner',                           proxy(req => orionProxy.putSensorOwner(            req.params.domain, req.params.sensorID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/location',                        proxy(req => orionProxy.putSensorLocation(         req.params.domain, req.params.sensorID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/name',                            proxy(req => orionProxy.putSensorName(             req.params.domain, req.params.sensorID, req.body), true));

  router.get(    '/domains/:domain/sensors/:sensorID/measurements',                    proxy(req => orionProxy.getSensorMeasurements(     req.params.domain, req.params.sensorID, query), true));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements',                    proxy(req => orionProxy.postSensorMeasurement(     req.params.domain, req.params.sensorID, req.body)),
                                                                                       proxy(req => mongoProxy.postSensorMeasMongo(       req.params.domain, req.params.sensorID, req.body), true));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID',            proxy(req => orionProxy.getSensorMeasurement(      req.params.domain, req.params.sensorID, req.params.measID, query), true));
  router.delete( '/domains/:domain/sensors/:sensorID/measurements/:measID',            proxy(req => orionProxy.deleteSensorMeasurement(   req.params.domain, req.params.sensorID, req.params.measID)),
                                                                                       proxy(req => mongoProxy.deleteEntityMeasMongo(     req.params.domain, req.params.sensorID, "SensingDevice", req.params.measID), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/name',       proxy(req => orionProxy.putSensorMeasurementName(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/dimension',  proxy(req => orionProxy.putSensorMeasurementDim(   req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/unit',       proxy(req => orionProxy.putSensorMeasurementUnit(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/sensor_kind',proxy(req => orionProxy.putSensorMeasurementKind(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID/values',     proxy(req => mongoProxy.getSensorMeasurementValues(req.params.domain, req.params.sensorID, req.params.measID, req.query), true));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements/:measID/values',     proxy(req => orionProxy.putSensorMeasurementValue( req.params.domain, req.params.sensorID, req.params.measID, req.body)),
                                                                                       proxy(req => mongoProxy.postDatapointMongo(        req.params.domain, req.params.sensorID, "SensingDevice", req.params.measID, req.body), true));
}

function installEntities(router, keycloak) {

  //router.all(    '/domains/:domain/entities*', proxyAuth((req, roles) => protect(roles, req.method, req.params.domain, 'users')))
  
  //users endpoint
  router.post(   '/domains/:domain/entities',                 proxy(req => entitiesProxy.createEntity(         req.params.domain, req.body), true));
  router.get(    '/domains/:domain/entities/types',           proxy(req => entitiesProxy.getEntityTypes(       req.params.domain), true));
  
  router.get(    '/domains/:domain/entities/:type',           proxy(req => entitiesProxy.getEntities(          req.params.domain, req.params.type), true));
  router.get(    '/domains/:domain/entities/:type/:id',       proxy(req => entitiesProxy.getEntity(            req.params.domain, req.params.type, req.params.id), true));
  router.delete( '/domains/:domain/entities/:type/:id',       proxy(req => entitiesProxy.deleteEntity(         req.params.domain, req.params.type, req.params.id)),
                                                              proxy(req => mongoProxy.deleteEntityMongo(       req.params.domain, req.params.id, req.params.type), true));
  
  router.get(    '/domains/:domain/entities/:type/:id/:attr', proxy(req => entitiesProxy.getEntityAttribute(   req.params.domain, req.params.type, req.params.id, req.params.attr), true));
  
  router.put(    '/domains/:domain/entities/:type/:id/:attr', proxy(req => entitiesProxy.putEntityAttribute(   req.params.domain, req.params.type, req.params.id, req.params.attr, req.body), true));
  
  router.post(   '/domains/:domain/entities/:type/:id/:attr', proxy(req => entitiesProxy.postEntityAttribute(  req.params.domain, req.params.type, req.params.id, req.params.attr, req.body), true));
                                                              
  router.delete( '/domains/:domain/entities/:type/:id/:attr', proxy(req => entitiesProxy.deleteEntityAttribute(req.params.domain, req.params.type, req.params.id, req.params.attr)),
                                                              proxy(req => mongoProxy.deleteEntityMeasMongo(   req.params.domain, req.params.id, req.params.type, req.params.attr), true));

}

function installHistory(router, keycloak) {

  //protect endpoints
  router.all(    '/history/*', proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_HISTORY, authZ.RESOURCE_HISTORY, req.kauth)))
  //history endpoint
  router.all(    '/history/*', bodyParser.text({type: '*/*'}), proxy(req => elsProxy.elsRequest(req), true));
}

function installSocials(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/socials*', proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_SOCIALS, authZ.RESOURCE_SOCIALS, req.kauth)))
  
  //socials endpoint
  router.get(    '/domains/:domain/socials',        proxy(req => socialsProxy.getSocialMsgs(     req.params.domain), true));
  router.post(   '/domains/:domain/socials',        proxy(req => socialsProxy.postSocialMsg(     req.params.domain, req.body), true));
  router.get(    '/domains/:domain/socials/:msgID', proxy(req => socialsProxy.getSocialMsg(      req.params.domain, req.params.msgID), true));
  router.delete( '/domains/:domain/socials/:msgID', proxy(req => socialsProxy.deleteSocialMsg(   req.params.domain, req.params.msgID), true));
  router.post(   '/domains/:domain/socials/batch',  proxy(req => socialsProxy.postSocialMsgBatch(req.params.domain, req.body), true));
}

function installNotifs(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/notifications*', proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_NOTIFICATIONS, authZ.RESOURCE_NOTIFICATIONS, req.kauth)))
  
  //notifications endpoint
  router.get(    '/domains/:domain/notifications',          proxy(req => notifsProxy.getNotifsOrion(  req.params.domain), true));
  router.post(   '/domains/:domain/notifications',          proxy(req => notifsProxy.postNotifOrion(  req.params.domain, req.body), true));
  router.get(    '/domains/:domain/notifications/:notifID', proxy(req => notifsProxy.getNotifOrion(   req.params.domain, req.params.notifID), true));
  router.delete( '/domains/:domain/notifications/:notifID', proxy(req => notifsProxy.deleteNotifOrion(req.params.domain, req.params.notifID), true));

}

function installUsers(router, keycloak) {

  //protect endpoints
  router.all(    '/domains/:domain/users*', proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_USERS, authZ.RESOURCE_USERS, req.kauth)))
  
  //users endpoints
  router.get(    '/domains/:domain/users',          proxy(req => usersProxy.getUsers(   req.params.domain), true));
  router.post(   '/domains/:domain/users',          proxy(req => usersProxy.createUser( req.params.domain, req.body), true));
  router.get(    '/domains/:domain/users/:userID',  proxy(req => usersProxy.getUser(    req.params.domain, req.params.userID), true));
  router.delete( '/domains/:domain/users/:userID',  proxy(req => usersProxy.deleteUser( req.params.domain, req.params.userID), true));
  router.put(    '/domains/:domain/users/:userID',  proxy(req => usersProxy.putUser(    req.params.domain, req.params.userID), true));

}

function installAuth(router, keycloak) {

  //auth endpoint
  router.post(   '/auth/token', proxy(req => usersProxy.postAuth(  req.body), true));
}

//Perform requests to backend components and send back results to user
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
      next(err)
    }
  }
}

//middleware in case of error
function proxyError(err, req, res, next) {

  if (err.response) {
    // The request was made and the server responded with a status code
    // We forward it to the user
    res.status(err.response.status);
    res.send(err.response.data); 
    log.error('Proxy response error:', err.response.status);
    if (err.response.data) log.warn(' msg:', err.response.data);
  } else if (err.request) {
    // The request was made but no response was received
    log.error('Proxy error, no response received');
    res.status(503);
    res.send('Proxy error: backend service unavailable');
  } else {
    // Something happened in setting up the request that triggered an Error
    log.error('Proxy error:', err);
    if(err.stack) {
      log.warn('Proxy error:', err.stack);
    }
    res.status(500);
    res.send(err);
    res.send(err.stack);

  }
}

//authorization middleware
async function authProtect(method, domain, resourceName, resourceType, kauth) {
    
    var token = ''
    //check that token is recognised
    if (kauth && kauth.grant) {
      token = kauth.grant.access_token.token
    } else { //if no token, use default permissions
      token = await authN.getUserAuthToken({username: 'guest', password: 'guest'})
    }
    var auth = await authZ.authorize(resourceName, resourceType, method, token);
    log.info("Auth result positive")
    return; 
};

module.exports = { 
  install,
  proxyError
} 
