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
const usersProxy   = require('../routes/users/user.route.js');


function install(router, keycloak) {

  router.get(    '/domains/:domain/sensors',                                          proxy([orionProxy.getSensorsOrion]));
  router.post(   '/domains/:domain/sensors',                                          proxy([orionProxy.postSensorOrion, mongoProxy.postSensorMongo]));
  router.get(    '/domains/:domain/sensors/:sensorID',                                proxy([orionProxy.getSensorOrion]));
  router.delete( '/domains/:domain/sensors/:sensorID',                                proxy([orionProxy.deleteSensor, mongoProxy.deleteSensorMongo]));
  router.put(    '/domains/:domain/sensors/:sensorID/owner',                          proxy([orionProxy.putSensorOwner]));
  router.put(    '/domains/:domain/sensors/:sensorID/location',                       proxy([orionProxy.putSensorLocation]));
  router.put(    '/domains/:domain/sensors/:sensorID/name',                           proxy([orionProxy.putSensorName]));
  router.put(    '/domains/:domain/sensors/:sensorID/sensor_kind',                    proxy([orionProxy.putSensorKind]));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements',                   proxy([orionProxy.getSensorMeasurements]));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements',                   proxy([orionProxy.postSensorMeasurement]));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID',           proxy([orionProxy.getSensorMeasurement]));
  router.delete( '/domains/:domain/sensors/:sensorID/measurements/:measID',           proxy([orionProxy.deleteSensorMeasurement]));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/name',      proxy([orionProxy.putSensorMeasurementName]));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/dimension', proxy([orionProxy.putiensorMeasurementDim]));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/unit',      proxy([orionProxy.putSensorMeasurementUnit]));
   
  router.get(    '/domains/:domain/history/*', elsProxy.getHistory);
  
  router.get(    '/domains/:domain/socials',        proxy([socialsProxy.getSocialMsgs]));
  router.post(   '/domains/:domain/socials',        proxy([socialsProxy.postSocialMsg]));
  router.get(    '/domains/:domain/socials/:msgID', proxy([socialsProxy.getSocialMsg]));
  router.delete( '/domains/:domain/socials/:msgID', proxy([socialsProxy.deleteSocialMsg]));
  router.post(   '/domains/:domain/socials/batch',  proxy([socialsProxy.postSocialMsgBatch]));

  router.post(   '/domains/:domain/auth',           proxy([usersProxy.postAuth]));
  router.get(    '/domains/:domain/users',          proxy([usersProxy.getUsers]));
  router.post(   '/domains/:domain/users',          proxy([usersProxy.postUsers]));
  router.get(    '/domains/:domain/users/:userid',  proxy([usersProxy.getUser]));
  router.delete( '/domains/:domain/users/:userid',  proxy([usersProxy.deleteUser]));
  router.put(    '/domains/:domain/users/:userid',  proxy([usersProxy.putUser]));
}

//Perform one or several requests to backend components and send back results to user
function proxy(requests) {
  return async (req, res) => {
    try {
      for (let request of requests) {
        var resp = await request(req)
      }
      //send the result back to the user
      res.send(resp);

    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // We forward it to the user
        res.status(err.response.status);
        res.send(err.response.data); 
      } else if (err.request) {
        // The request was made but no response was received
        console.log(err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Waziup proxy error:', JSON.stringify(err));
      }
    }
  }
}

module.exports = { install } 
