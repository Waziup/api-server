"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');
const querystring = require('querystring');

const methodAccess = {
    GET: AccessLevel.VIEW,
    POST: AccessLevel.EDIT,
    PUT: AccessLevel.EDIT,
    DELETE: AccessLevel.EDIT
};

function proxyOrion(method, path, req, res) {
    const reqUrl = url.parse(req.url);
    const orionHost = config.orionUrl;
    //v2/entities
    const proxyUrl = `${orionHost}${path}${reqUrl.search || ''}`; 
    console.log('path:', path);
    console.log('method:', method);
    console.log('req.body:', req.body);
    console.log('proxyUrl:', proxyUrl);
    console.log('fiware-servicePath in Orion request:' + req.headers['fiware-servicepath']);

    const options = {
        method,
        url: proxyUrl,
        headers: {
            'Fiware-Service': req.headers['fiware-service'],
            'Fiware-ServicePath': req.headers['fiware-servicepath']
        }
    };

    //GET method gives error if req has a body  || req.body !== {}
    if(method !== 'GET' && method !== 'DELETE') {
        if(!!req.body && Object.values(req.body).length !== 0)
            options.body = req.body;
        options.json = true;
    }
    
    request(options).on('response', getSensors).pipe(res);       
}

function install(router, keycloak) {

  router.get(    '/domains/:domain/sensors',                       getSensors);
  router.post(   '/domains/:domain/sensors',                       postSensor);
  router.get(    '/domains/:domain/sensors/:sensorID',             getSensor);
  router.delete( '/domains/:domain/sensors/:sensorID',             deleteSensor);
  router.put(    '/domains/:domain/sensors/:sensorID/owner',       putSensorOwner);
  router.put(    '/domains/:domain/sensors/:sensorID/location',    putSensorLocation);
  router.put(    '/domains/:domain/sensors/:sensorID/name',        putSensorName);
  router.put(    '/domains/:domain/sensors/:sensorID/sensor_kind', putSensorKind);
  router.get(    '/domains/:domain/sensors/:sensorID/measurements', getSensorMeasurements);
  router.post(   '/domains/:domain/sensors/:sensorID/measurements', postSensorMeasurement);
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID', getSensorMeasurement);
  router.delete( '/domains/:domain/sensors/:sensorID/measurements/:measID', deleteSensorMeasurement);
  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/name', putSensorMeasurementName);
//  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/dimension', putMeasDimension);
//  router.put(    '/domains/:domain/sensors/:sensorID/measurements/:measID/unit', putMeasUnit);

}

const getSensors               = async (req, res) => orionProxy('/v2/entities'                                              , 'GET'   , null             , entitiesToSensors, req, res);
const postSensor               = async (req, res) => orionProxy('/v2/entities'                                              , 'POST'  , sensorToEntity   , null             , req, res);
const getSensor                = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID                       , 'GET'   , null             , entityToSensor   , req, res);
const deleteSensor             = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID                       , 'DELETE', null             , null             , req, res);
const putSensorOwner           = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/owner'      , 'PUT'   , getStringAttr    , null             , req, res);
const putSensorLocation        = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/location'   , 'PUT'   , getEntityLocation, null             , req, res);
const putSensorName            = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/name'       , 'PUT'   , getStringAttr    , null             , req, res);
const putSensorKind            = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/sensor_kind', 'PUT'   , getStringAttr    , null             , req, res);
const getSensorMeasurements    = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID, 'GET'   , null             , getMeasurements, req, res);
const postSensorMeasurement    = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs', 'POST'   , getMeasAttr, null, req, res);
const getSensorMeasurement     = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/' + req.params.measID, 'GET'   , null  , getMeasurement.bind(null, req.params.measID), req, res);
const deleteSensorMeasurement  = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/' + req.params.measID, 'DELETE'   , null  , null, req, res);
const putSensorMeasurementName = async (req, res) => orionProxy('/v2/entities/' + req.params.sensorID + '/attrs/' + req.params.measID, 'PUT', getMetadata.bind(null, 'name', req), null, req, res);
//;async (req, res) => updateMetadataName(req, res);


async function orionProxy(path, method, preProc, postProc, req, res) {

  try {
    var service = req.params.domain.split("-")[0];
    //pre-process the data from Waziup to Orion format
    var data = preProc? await preProc(req.body) : null;
    
    //get data from Orion
    var orionResp = await orionRequest(path, method, service, data)

    //pro-process the data from Orion to Waziup format
    var waziupResp = postProc? await postProc(orionResp.data): orionResp.data;
    //send the result back to the user
    res.send(waziupResp);

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
async function orionRequest(path, method, service, data) {
 
    var url = 'http://broker.waziup.io' + path;
    var headers = {'Fiware-Service': service};
    var axiosConf = {method: method,
                     url: url,
                     data: data,
                     headers: headers,
                     params: {limit: 100}}
    console.log("Orion request " + method + " on: " + url + "\n headers: " + JSON.stringify(headers));
    console.log(" data: " + JSON.stringify(data));
    
    //perform request to Orion
    return axios(axiosConf);
}

async function getMetadata(metadataField, req) {

  var path = '/v2/entities/' + req.params.sensorID + '/attrs/' + req.params.measID;
  var service = req.params.domain.split("-")[0];
  var orionResp = await orionRequest(path, 'GET', service, null);
  
  var attr = orionResp.data;
  attr.metadata[metadataField] = getStringAttr(req.body);
  return attr;
}

function getStringAttr(attr) {
  
  return {
    type: 'String',
    value: attr
  }
}

function entitiesToSensors(entities) {
  return entities.map(entityToSensor);
}

function entityToSensor(entity) {

  console.log(JSON.stringify(entity));
  var sensor = {
    id: entity.id
  }
  if (entity.gateway_id) {
    sensor.gateway_id = entity.gateway_id.value;
  }
  if (entity.name) {
    sensor.name = entity.name.value;
  }
  if (entity.owner) {
    sensor.owner = entity.owner.value;
  }
  if (entity.sensor_kind) {
    sensor.sensor_kind = entity.sensor_kind.value;
  }
  if (entity.location && entity.location.value && entity.location.value.coordinates) {
    sensor.location = {latitude:  entity.location.value.coordinates[1],
                       longitude: entity.location.value.coordinates[0]};
  }

  sensor.measurements = getMeasurements(entity);

  return sensor;
}

function getMeasurements(entity) {

//  console.log('entity: ' + JSON.stringify(entity));
  var measurements = []
  for (var attrID in entity) {
    const attr = entity[attrID];

    if (attr.type == 'Measurement') {
      measurements.push(getMeasurement(attrID, attr));
    }
  }
  return measurements;
}


function getMeasurement(attrID, attr) {
 
  console.log('attr:' + JSON.stringify(attr) + ' attrID: ' + attrID)
  var meas = { 
    id: attrID
  }
  let metadata = attr.metadata;
  if (metadata.name) {
    meas.name = metadata.name.value;
  }        
  if (metadata.dimension) {
    meas.dimension = metadata.dimension.value;
  }        
  if (metadata.timestamp) {
    meas.timestamp = metadata.timestamp.value;
  }        
  if (metadata.unit) {
    meas.unit = metadata.unit.value;
  }        
  return meas;
}

function sensorToEntity(sensor) {

  var entity = {
    id: sensor.id,
    type: 'SensingDevice'
  }
  if (sensor.gateway_id) {
    entity.gateway_id = {type: 'String', value: sensor.gateway_id};
  }
  if (sensor.name) {
    entity.name = {type: 'String', value: sensor.name};
  }
  if (sensor.owner) {
    entity.owner = {type: 'String', value: sensor.owner};
  }
  if (sensor.sensor_kind) {
    entity.sensor_kind = {type: 'String', value: sensor.sensor_kind};
  }
  if (sensor.location) {
    entity.location = getEntityLocation(sensor.location)
  }

  for (let meas of sensor.measurements) {

    entity[meas.id] = getMeasAttrs(meas);
  }

  return entity;
}

function getEntityLocation(loc) {

  var entityLoc = {
    type: 'geo:json',
    value: {
      type: 'Point',
      coordinates: [loc.longitude, loc.latitude]
    }
  }

  return entityLoc;

}

function getMeasAttr(measurement) {

  return {
    [measurement.id] : getMeasAttrs(measurement)
  }
}

function getMeasAttrs(measurement) {
  var attr = {
    type: 'Measurement',
    metadata: {}
  }
  if (measurement.values) {
    attr.value = measurement.values[0].value;
    attr.metadata.timestamp = {
      type: 'DateTime',
      value: measurement.values[0].timestamp
    }
  }
  if (measurement.name) {
    attr.metadata.name = {
      type: 'String',
      value: measurement.name
    }
  }
  if (measurement.unit) {
    attr.metadata.unit = {
      type: 'String',
      value: measurement.unit
    }
  }
  if (measurement.dimension) {
    attr.metadata.dimension = {
      type: 'String',
      value: measurement.dimension
    }
  }
  return attr;
}

module.exports = {
    install
};
