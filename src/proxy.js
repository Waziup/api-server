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


  //install error handler
  router.use(proxyError);
}

function installSensors(router, keycloak) {

  router.all('/sensors/*', function(req, res) {
    // Process the data received in req.bodyi
    console.log("path: " + JSON.stringify(req.originalUrl));
    //var newPath = "/api/v1/" + req.originalUrl.split('/').slice(5);
    console.log("new path: " + JSON.stringify(newPath));
    res.redirect(newPath);
  });

  //routes to sensors
  router.get(    '/sensors',                                               proxy(req => orionProxy.getSensorsOrion(req.query, req.kauth), true));
  router.post(   '/sensors',                                               proxy(req => authProtect('',            authZ.SCOPE_SENSORS_CREATE, req.kauth)),
                                                                           proxy(req => orionProxy.postSensorOrion(req.body, req.kauth)), 
                                                                           proxy(req => authZ.createSensorResource(req.body, req.kauth), true));

  router.get(    '/sensors/:sensorID',                                     proxy(req => authProtect(req.params.sensorID,authZ.SCOPE_SENSORS_VIEW, req.kauth)),
                                                                           proxy(req => orionProxy.getSensorOrion(      req.params.sensorID, req.query), true))
  router.delete( '/sensors/:sensorID',                                     proxy(req => authProtect(req.params.sensorID,authZ.SCOPE_SENSORS_DELETE, req.kauth)),
                                                                           proxy(req => orionProxy.deleteSensor(        req.params.sensorID)),
                                                                           proxy(req => mongoProxy.deleteEntityMongo(   req.params.sensorID, "SensingDevice")),
                                                                           proxy(req => authZ.deleteResource(           req.params.sensorID), true));
  
  router.put(    '/sensors/:sensorID/location',                            proxy(req => authProtect(req.params.sensorID, authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorLocation(    req.params.sensorID, req.body), true));
  router.put(    '/sensors/:sensorID/name',                                proxy(req => authProtect(req.params.sensorID, authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorName(        req.params.sensorID, req.body), true));
  router.put(    '/sensors/:sensorID/gateway_id',                          proxy(req => authProtect(req.params.sensorID, authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorGatewayId(   req.params.sensorID, req.body), true));
  router.put(    '/sensors/:sensorID/visibility',                          proxy(req => authProtect(req.params.sensorID, authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorVisibility(  req.params.sensorID, req.body)),
                                                                           proxy(req => authZ.setResourceVisibility(     req.params.sensorID, req.body), true));

  //routes to measurements
  router.get(    '/sensors/:sensorID/measurements',                        proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_VIEW, req.kauth)),
                                                                           proxy(req => orionProxy.getSensorMeasurements(     req.params.domain, req.params.sensorID, req.query), true));
  router.post(   '/sensors/:sensorID/measurements',                        proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.postSensorMeasurement(     req.params.domain, req.params.sensorID, req.body), true));
  router.get(    '/sensors/:sensorID/measurements/:measID',                proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_VIEW, req.kauth)),
                                                                           proxy(req => orionProxy.getSensorMeasurement(      req.params.domain, req.params.sensorID, req.params.measID, req.query), true));
  router.delete( '/sensors/:sensorID/measurements/:measID',                proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.deleteSensorMeasurement(   req.params.domain, req.params.sensorID, req.params.measID)),
                                                                           proxy(req => mongoProxy.deleteEntityMeasMongo(     req.params.domain, req.params.sensorID, "SensingDevice", req.params.measID), true));
  router.put(    '/sensors/:sensorID/measurements/:measID/name',           proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorMeasurementName(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/sensors/:sensorID/measurements/:measID/sensing_device', proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorMeasurementSD(    req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/sensors/:sensorID/measurements/:measID/quantity_kind',  proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorMeasurementQK(    req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
  router.put(    '/sensors/:sensorID/measurements/:measID/unit',           proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_UPDATE, req.kauth)),
                                                                           proxy(req => orionProxy.putSensorMeasurementUnit(  req.params.domain, req.params.sensorID, req.params.measID, req.body), true));
 
  //routes to sensor data
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID/values',         proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_DATA_VIEW, req.kauth)),
                                                                                           proxy(req => mongoProxy.getSensorMeasurementValues(req.params.domain, req.params.sensorID, req.params.measID, req.query), true));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements/:measID/values',         proxy(req => authProtect(req.params.sensorID,      authZ.SCOPE_SENSORS_DATA_CREATE, req.kauth)),
                                                                                           proxy(req => orionProxy.putSensorMeasurementValue( req.params.domain, req.params.sensorID, req.params.measID, req.body)),
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
  //router.all(    '/domains/:domain/socials*', proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_SOCIALS, authZ.RESOURCE_SOCIALS, req.kauth)))
  
  //socials endpoint
  router.get(    '/domains/:domain/socials',        proxy(req => authProtect(authZ.RESOURCE_SOCIALS,      authZ.SCOPE_SOCIALS_VIEW, req.kauth)),
                                                    proxy(req => socialsProxy.getSocialMsgs(  req.params.domain), true));
  router.post(   '/domains/:domain/socials',        proxy(req => authProtect(authZ.RESOURCE_SOCIALS,      authZ.SCOPE_SOCIALS_CREATE, req.kauth)),
                                                    proxy(req => socialsProxy.postSocialMsg(  req.params.domain, req.body), true));
  router.get(    '/domains/:domain/socials/:msgID', proxy(req => authProtect(authZ.RESOURCE_SOCIALS,      authZ.SCOPE_SOCIALS_VIEW, req.kauth)),
                                                    proxy(req => socialsProxy.getSocialMsg(   req.params.domain, req.params.msgID), true));
  router.delete( '/domains/:domain/socials/:msgID', proxy(req => authProtect(authZ.RESOURCE_SOCIALS,      authZ.SCOPE_SOCIALS_DELETE, req.kauth)),
                                                    proxy(req => socialsProxy.deleteSocialMsg(req.params.domain, req.params.msgID), true));
  router.post(   '/domains/:domain/socials/batch',  proxy(req => authProtect(authZ.RESOURCE_SOCIALS,      authZ.SCOPE_SOCIALS_CREATE, req.kauth)),
                                                    proxy(req => socialsProxy.postSocialMsgBatch(req.params.domain, req.body), true));
}

function installNotifs(router, keycloak) {

  //protect endpoints
  //router.all(    '/domains/:domain/notifications*', proxy(req => authProtect(authZ.RESOURCE_NOTIFICATIONS, authZ.RESOURCE_NOTIFICATIONS, req.kauth)))
  
  //notifications endpoint
  router.get(    '/domains/:domain/notifications',          proxy(req => authProtect(authZ.RESOURCE_NOTIFICATIONS,      authZ.SCOPE_NOTIFICATIONS_VIEW, req.kauth)),
                                                            proxy(req => notifsProxy.getNotifsOrion(  req.params.domain), true));
  router.post(   '/domains/:domain/notifications',          proxy(req => authProtect(authZ.RESOURCE_NOTIFICATIONS,      authZ.SCOPE_NOTIFICATIONS_CREATE, req.kauth)),
                                                            proxy(req => notifsProxy.postNotifOrion(  req.params.domain, req.body), true));
  router.get(    '/domains/:domain/notifications/:notifID', proxy(req => authProtect(authZ.RESOURCE_NOTIFICATIONS,      authZ.SCOPE_NOTIFICATIONS_VIEW, req.kauth)),
                                                            proxy(req => notifsProxy.getNotifOrion(   req.params.domain, req.params.notifID), true));
  router.delete( '/domains/:domain/notifications/:notifID', proxy(req => authProtect(authZ.RESOURCE_NOTIFICATIONS,      authZ.SCOPE_NOTIFICATIONS_DELETE, req.kauth)),
                                                            proxy(req => notifsProxy.deleteNotifOrion(req.params.domain, req.params.notifID), true));

}

function installUsers(router, keycloak) {

  //protect endpoints
  //router.all(    '/domains/:domain/users*', proxy(req => authProtect(req.method, req.params.domain, authZ.RESOURCE_USERS, authZ.RESOURCE_USERS, req.kauth)))
  
  //users endpoints
  router.get(    '/domains/:domain/users',          proxy(req => authProtect(authZ.RESOURCE_USERS,      authZ.SCOPE_USERS_VIEW, req.kauth)),
                                                    proxy(req => usersProxy.getUsers(   req.params.domain), true));
  router.post(   '/domains/:domain/users',          proxy(req => authProtect(authZ.RESOURCE_USERS,      authZ.SCOPE_USERS_CREATE, req.kauth)),
                                                    proxy(req => usersProxy.createUser( req.params.domain, req.body), true));
  router.get(    '/domains/:domain/users/:userID',  proxy(req => authProtect(authZ.RESOURCE_USERS,      authZ.SCOPE_USERS_VIEW, req.kauth)),
                                                    proxy(req => usersProxy.getUser(    req.params.domain, req.params.userID), true));
  router.delete( '/domains/:domain/users/:userID',  proxy(req => authProtect(authZ.RESOURCE_USERS,      authZ.SCOPE_USERS_DELETE, req.kauth)),
                                                    proxy(req => usersProxy.deleteUser( req.params.domain, req.params.userID), true));
  router.put(    '/domains/:domain/users/:userID',  proxy(req => authProtect(authZ.RESOURCE_USERS,      authZ.SCOPE_USERS_UPDATE, req.kauth)),
                                                    proxy(req => usersProxy.putUser(    req.params.domain, req.params.userID, req.body), true));
}

function installAuth(router, keycloak) {

  //auth endpoint
  router.post('/auth/token',       proxy(req => usersProxy.postAuth(  req.body), true));
  router.get( '/auth/permissions', proxy(req => authZ.getPermissions(req.kauth), true));
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
    res.send({error:'Service unavailable', description: 'Proxy error: backend service unavailable'});
  } else {
    // Something happened in setting up the request that triggered an Error
    log.error('Proxy error:', err.message);
    if(err.stack) {
      log.error('Proxy error:', err.stack);
    }
    res.status(500);
    res.send({error:'Internal Server Error', description: err.message});

  }
}

//authorization middleware
async function authProtect(resourceName, scope, kauth) {
    
    var token = ''
    //check that token is recognised
    if (kauth && kauth.grant) {
      token = kauth.grant.access_token.token
    } else { //if no token, use default permissions
      token = await authN.getUserAuthToken({username: 'guest', password: 'guest'})
    }
    //check that resource is authorized
    await authZ.authorize(resourceName, scope, token);
    log.info("Auth result positive")
    return; 
};


module.exports = { 
  install,
  proxyError
} 
