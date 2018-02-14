"use strict";

const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');
const querystring = require('querystring');
const mongoProxy = require('./mongo-proxy.js');
const log = require('../log.js');

async function getSensorsOrion(domain, query) {
  let entities = await orionRequest('/v2/entities', 'GET', domain, null, query);
  return getSensors(domain, entities, query);
}

async function postSensorOrion(domain, sensor) {
  let resp = orionRequest('/v2/entities', 'POST', domain, getEntity(domain, sensor));
  return resp;
}

async function getSensorOrion(domain, sensorID, query) {
  let entity = await orionRequest('/v2/entities/' + sensorID, 'GET', domain, null);
  return getSensor(domain, sensorID, entity, query);
}

async function deleteSensor(domain, sensorID) {
  let resp = orionRequest('/v2/entities/' + sensorID, 'DELETE', domain, null);
  return resp;
}

async function putSensorOwner(domain, sensorID, owner) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/owner', 'PUT', domain, getStringAttr(owner));
  return resp;
}

async function putSensorLocation(domain, sensorID, location) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/location', 'PUT', domain, getEntityLocation(location));
  return resp;
}

async function putSensorName(domain, sensorID, name) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/name', 'PUT', domain, getStringAttr(name));
  return resp;
}

async function getSensorMeasurements(domain, sensorID, query) {
  let attrs = await orionRequest('/v2/entities/' + sensorID + '/attrs', 'GET', domain, null);
  return getMeasurements(domain, sensorID, attrs, query)
}

async function postSensorMeasurement(domain, sensorID, meas) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs', 'POST', domain, getMeasAttr(meas));
  return resp;
}

async function getSensorMeasurement(domain, sensorID, measID, query) {
  let attr = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'GET', domain, null)
  return getMeasurement(domain, sensorID, measID, attr, query);
}

async function deleteSensorMeasurement(domain, sensorID, measID) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'DELETE', domain, null);
  return resp;
}

async function putSensorMeasurementName(domain, sensorID, measID, name) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('name', domain, sensorID, measID, name));
  return resp;
}

async function putSensorMeasurementDim(domain, sensorID, measID, dim) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('dimension', domain, sensorID, measID, dim));
  return resp;
}

async function putSensorMeasurementUnit(domain, sensorID, measID, unit) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('unit', domain, sensorID, measID, unit));
  return resp;
}

async function putSensorMeasurementKind(domain, sensorID, measID, kind) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('sensor_kind', domain, sensorID, measID, kind));
  return resp;
}

async function putSensorMeasurementValue(domain, sensorID, measID, datapoint) {
  await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID + '/value', 'PUT', domain, datapoint.value, null, 'text/plain');
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('timestamp', domain, sensorID, measID, datapoint.timestamp));
  return resp;
}


// Perform a request to Orion
async function orionRequest(path, method, domain, data, query, contentType) {
 
   var url = config.backend.orionUrl + path;
   var headers = {}
   if(contentType) {
      headers['Content-Type'] = contentType;
   }
   headers['Fiware-Service'] = config.fiwareService;
   var myQuery = {};
   if(query) {
     myQuery = query;
   }
   myQuery['attrs'] = "dateModified,dateCreated,*";
   var axiosConf = {method: method,
                    url: url,
                    data: data,
                    headers: headers,
                    params: myQuery}
   log.info("Orion request " + method + " on: " + url)
   log.debug("  headers: " + JSON.stringify(headers));
   log.debug(" query: " + JSON.stringify(query));
   log.debug(" data: " + JSON.stringify(data));
    
   //perform request to Orion
   var resp = await axios(axiosConf);
   return resp.data;
}

//get the full metadata before modify it (Orion doesn't support PUT method on specific metadata fields)
async function getMetadata(metadataField, domain, sensorID, measID, newValue) {

  let attr = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'GET', domain, null)
  attr.metadata[metadataField] = getStringAttr(newValue);
  return attr;
}

function getStringAttr(attr) {
  return {
    type: 'String',
    value: attr
  }
}

async function getSensors(domain, entities, query) {
  var sensors = [];
  for (let e of entities) {
    var s = await getSensor(domain, e.id, e, query);
    sensors.push(s);
  }
  return sensors
}

async function getSensor(domain, sensorID, entity, query) {

  log.debug(JSON.stringify(entity));
  var sensor = {
    id: entity.id
  }
  if (entity.gateway_id) {
    sensor.gateway_id = entity.gateway_id.value;
  }
  if (entity.name) {
    sensor.name = entity.name.value;
  }
  if (entity.subservice) {
    sensor.subservice = entity.subservice.value;
  }
  if (entity.owner) {
    sensor.owner = entity.owner.value;
  }
  if (entity.location && entity.location.value && entity.location.value.coordinates) {
    sensor.location = {latitude:  entity.location.value.coordinates[1],
                       longitude: entity.location.value.coordinates[0]};
  }
  if (entity.dateCreated) {
    sensor.dateCreated = entity.dateCreated.value;
  }
  if (entity.dateModified) {
    sensor.dateModified = entity.dateModified.value;
  }
  if (entity.domain) {
    sensor.domain = entity.domain.value;
  }

  // Retrieve values from historical database
  sensor.measurements = await getMeasurements(domain, sensorID, entity, query);

  return sensor;
}

async function getMeasurements(domain, sensorID, attrs, query) {

  var measurements = []
  for (var attrID in attrs) {
    const attr = attrs[attrID];

    if (attr.type == 'Measurement') {
      measurements.push(await getMeasurement(domain, sensorID, attrID, attr, query));
    }
  }
  return measurements;
}


async function getMeasurement(domain, sensorID, attrID, attr, query) {
 
  var meas = { 
    id: attrID,
  }
  if (attr.value) {
    meas.last_value = attr.value;
  }
  let metadata = attr.metadata;
  if (metadata.timestamp) {
    meas.timestamp = metadata.timestamp.value;
  }        
  if (metadata.name) {
    meas.name = metadata.name.value;
  }        
  if (metadata.dimension) {
    meas.dimension = metadata.dimension.value;
  }        
  if (metadata.unit) {
    meas.unit = metadata.unit.value;
  }       
  if (metadata.sensor_kind) {
    meas.sensor_kind = metadata.sensor_kind.value;
  }
  console.log("Queery:" + JSON.stringify(query))
  meas.values = await mongoProxy.getSensorMeasurementValues(domain, sensorID, attrID, query);
  return meas;
}

function getEntity(domain, sensor) {

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
  if (domain) {
    entity.domain = {type: 'String', value: domain};
  }
  if (sensor.location) {
    entity.location = getEntityLocation(sensor.location)
  }
  if(sensor.measurements) {
    for (let meas of sensor.measurements) {
      entity[meas.id] = getMeasAttrs(meas);
    }
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
  if (measurement.sensor_kind) {
    attr.metadata.sensor_kind = {
      type: 'String',
      value: measurement.sensor_kind
    }
  }

  return attr;
}

module.exports = {
 getSensorsOrion, 
 postSensorOrion,         
 getSensorOrion,          
 deleteSensor,            
 putSensorOwner,          
 putSensorLocation,       
 putSensorName,           
 getSensorMeasurements,   
 postSensorMeasurement,   
 getSensorMeasurement ,   
 deleteSensorMeasurement, 
 putSensorMeasurementName,
 putSensorMeasurementDim, 
 putSensorMeasurementUnit,
 putSensorMeasurementKind,
 putSensorMeasurementValue,
 orionRequest}
