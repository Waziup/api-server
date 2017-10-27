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


function install(router, keycloak) {

  router.get(    '/domains/:domain/sensors',                                          (req, res) => proxy([orionProxy.getSensorsOrion], req, res));
  router.post(   '/domains/:domain/sensors',                                          (req, res) => proxy([orionProxy.postSensorOrion, mongoProxy.postSensorMongo], req, res));
  router.get(    '/domains/:domain/sensors/:sensorID',                                (req, res) => proxy([orionProxy.getSensorOrion], req, res));
  router.delete( '/domains/:domain/sensors/:sensorID',                                (req, res) => proxy([orionProxy.deleteSensor, mongoProxy.deleteSensorMongo], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/owner',                          (req, res) => proxy([orionProxy.putSensorOwner], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/location',                       (req, res) => proxy([orionProxy.putSensorLocation], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/name',                           (req, res) => proxy([orionProxy.putSensorName], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/sensor_kind',                    (req, res) => proxy([orionProxy.putSensorKind], req, res));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements',                   (req, res) => proxy([orionProxy.getSensorMeasurements], req, res));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements',                   (req, res) => proxy([orionProxy.postSensorMeasurement], req, res));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID',           (req, res) => proxy([orionProxy.getSensorMeasurement], req, res));
  router.delete( '/domains/:domain/sensors/:sensorID/measurements/:measID',           (req, res) => proxy([orionProxy.deleteSensorMeasurement], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/name',      (req, res) => proxy([orionProxy.putSensorMeasurementName], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/dimension', (req, res) => proxy([orionProxy.putSensorMeasurementDim], req, res));
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/unit',      (req, res) => proxy([orionProxy.putSensorMeasurementUnit], req, res));
   
  router.get(    '/domains/:domain/history/*', elsProxy.getHistory);
  
  router.get(    '/domains/:domain/socials',        (req, res) => proxy([socialsProxy.getSocialMsgs], req, res));
  router.post(   '/domains/:domain/socials',        (req, res) => proxy([socialsProxy.postSocialMsg], req, res));
  router.get(    '/domains/:domain/socials/:msgID', (req, res) => proxy([socialsProxy.getSocialMsg], req, res));
  router.delete( '/domains/:domain/socials/:msgID', (req, res) => proxy([socialsProxy.deleteSocialMsg], req, res));
}

//Perform a request to Orion and handle data transformation to/from waziup format
async function proxy(callbacks, req, res) {

  try {
    for (let callback of callbacks) {
      var resp = await callback(req)

      const CircularJSON = require('circular-json');
      console.log(CircularJSON.stringify(resp));
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
      console.log('Error', err.stack);
    }
  }
}

module.exports = { install } 
