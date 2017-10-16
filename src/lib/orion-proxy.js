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

  router.get( '/domains/:domain/sensors', getSensors);
  router.post('/domains/:domain/sensors', postSensor);
  router.get( '/domains/:domain/sensors/:sensorID', getSensor);
  router.delete( '/domains/:domain/sensors/:sensorID', deleteSensor);

}

async function getSensors(req, res) {

  sendRequest('/v2/entities', 'GET', null, entitiesToSensors, req, res);
}

async function postSensor(req, res) {
  
  sendRequest('/v2/entities', 'POST', sensorToEntity, null, req, res);
}

function getSensor(req, res) {

  sendRequest('/v2/entities/' + req.params.sensorID, 'GET', null, entityToSensor, req, res);
}

function deleteSensor(req, res) {

  sendRequest('/v2/entities/' + req.params.sensorID, 'DELETE', null, null, req, res);
}

async function sendRequest(orionPath, method, prePro, postPro, req, res) {
 
  try {
    var url = 'http://broker.waziup.io' + orionPath;
    var service = req.params.domain.split("-")[0];
    var headers = {'Fiware-Service': service};
    //pre-process the data from Waziup to Orion format
    var data = prePro? prePro(req.body) : null;
    var axiosConf = {method: method,
                     url: url,
                     data: data,
                     headers: headers,
                     params: {limit: 100}}
    console.log("Orion request: " + method + " on: " + url + "\n with headers: " + JSON.stringify(headers));
    
    //perform request to Orion
    var orionResp = await axios(axiosConf);
    //pro-process the data from Orion to Waziup format
    var waziupResp = postPro? postPro(orionResp.data): orionResp.data;
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

  var measurements = []
  for (var attrID in entity) {
    const attr = entity[attrID];

    if (attr.type == 'Measurement') {
      measurements.push(getMeasurement(attr, attrID));
    }
  }
  return measurements;
}

function getMeasurement(attr, attrID) {

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
  if (sensor.gateway_id) {
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

function getMeasAttrs(measurement) {
  var attr = {
    type: 'Measurement',
    metadata: {}
  }
  if (measurement.values[0]) {
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
