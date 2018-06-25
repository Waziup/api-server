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
  return getSensors(domain, entities);
}

async function postSensorOrion(domain, sensor) {
  let resp = orionRequest('/v2/entities', 'POST', domain, getEntity(domain, sensor));
  return resp;
}

async function getSensorOrion(domain, sensorID, query) {
  let entity = await orionRequest('/v2/entities/' + sensorID, 'GET', domain, null);
  return getSensor(domain, sensorID, entity);
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

async function putSensorGatewayId(domain, sensorID, gateway_id) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/gateway_id', 'PUT', domain, getStringAttr(gateway_id));
  return resp;
}

async function getSensorMeasurements(domain, sensorID, query) {
  let attrs = await orionRequest('/v2/entities/' + sensorID + '/attrs', 'GET', domain, null, query);
  return getMeasurements(domain, sensorID, attrs)
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

async function putSensorMeasurementSD(domain, sensorID, measID, sd) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('sensing_device', domain, sensorID, measID, sd));
  return resp;
}

async function putSensorMeasurementQK(domain, sensorID, measID, qk) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('quantity_kind', domain, sensorID, measID, qk));
  return resp;
}

async function putSensorMeasurementUnit(domain, sensorID, measID, unit) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('unit', domain, sensorID, measID, unit));
  return resp;
}

async function putSensorMeasurementValue(domain, sensorID, measID, datapoint) {

  var contentType = null
  if(typeof datapoint.value == "object") {
     contentType = "application/json";
  } else {
     contentType = "text/plain";
  }

  let resp = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID + '/value', 'PUT', domain, JSON.stringify(datapoint.value), null, contentType);
  if(datapoint.timestamp) {
    orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await getMetadata('timestamp', domain, sensorID, measID, datapoint.timestamp));
  } else {
    orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', domain, await deleteMetadata('timestamp', domain, sensorID, measID));
  }
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
   var params = {
     ...query,
     attrs: "dateModified,dateCreated,*",
     metadata: "dateModified,dateCreated,*"
   }
   var axiosConf = {method: method,
                    url: url,
                    data: data,
                    headers: headers,
                    params: params}
   log.info("Orion request " + method + " on: " + url)
   log.debug(" headers: " + JSON.stringify(headers));
   log.debug(" query: " + JSON.stringify(params));
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

//get the full metadata before modify it (Orion doesn't support PUT method on specific metadata fields)
async function deleteMetadata(metadataField, domain, sensorID, measID) {

  let attr = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'GET', domain, null)
  delete attr.metadata[metadataField];
  return attr;
}

function getStringAttr(attr) {
  return {
    type: 'String',
    value: attr
  }
}

async function getSensors(domain, entities) {
  var sensors = [];
  for (let e of entities) {
    var s = await getSensor(domain, e.id, e);
    sensors.push(s);
  }
  return sensors
}

async function getSensor(domain, sensorID, entity) {

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
    sensor.date_created = entity.dateCreated.value;
  }
  if (entity.dateModified) {
    sensor.date_modified = entity.dateModified.value;
  }
  if (entity.domain) {
    sensor.domain = entity.domain.value;
  }

  // Retrieve values from historical database
  sensor.measurements = await getMeasurements(domain, sensorID, entity);

  return sensor;
}

async function getMeasurements(domain, sensorID, attrs) {

  var measurements = []
  for (var attrID in attrs) {
    const attr = attrs[attrID];

    if (attr.type == 'Measurement') {
      measurements.push(await getMeasurement(domain, sensorID, attrID, attr));
    }
  }
  return measurements;
}


function getMeasurement(domain, sensorID, attrID, attr) {
 
  var meas = { 
    id: attrID,
  }
  if (attr.hasOwnProperty('value') && attr.value != null) {
    meas.last_value = getLastValue(attr);
  }
  let metadata = attr.metadata;
  if (metadata.name) {
    meas.name = metadata.name.value;
  }        
  if (metadata.sensing_device) {
    meas.sensing_device = metadata.sensing_device.value;
  }
  if (metadata.quantity_kind) {
    meas.quantity_kind = metadata.quantity_kind.value;
  }        
  if (metadata.unit) {
    meas.unit = metadata.unit.value;
  }       
  return meas;
}

function getLastValue(attr) {
 
  var lastValue = {}

  if (attr.hasOwnProperty('value')) {
    lastValue.value = attr.value;

    let metadata = attr.metadata;
    console.log("val:" + JSON.stringify(metadata))
    if (metadata.timestamp) {
      lastValue.timestamp = metadata.timestamp.value;
    }        
    if (metadata.dateModified) {
      lastValue.date_received = metadata.dateModified.value;
    }        
  }
  return lastValue;
}

function getEntity(domain, sensor) {

  var entity = {
    id: sensor.id,
    type: 'SensingDevice'
  }
    entity.gateway_id = {type: 'String', value: sensor.gateway_id? sensor.gateway_id: ''};
    entity.name       = {type: 'String', value: sensor.name? sensor.name: ''};
    entity.owner      = {type: 'String', value: sensor.owner? sensor.owner: ''};
    entity.domain     = {type: 'String', value: domain? domain: ''};
    entity.location   = getEntityLocation(sensor.location)

  if(sensor.measurements) {
    for (let meas of sensor.measurements) {
      entity[meas.id] = getMeasAttrs(meas);
    }
  }
  return entity;
}

function getEntityLocation(loc) {

  var entityLoc = {type: 'String', value: ''}
  if(loc) {
    entityLoc = {
      type: 'geo:json',
      value: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude]
      }
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
  if (measurement.name) {
    attr.metadata.name = {
      type: 'String',
      value: measurement.name
    }
  }
  if (measurement.sensing_device) {
    attr.metadata.sensing_device = {
      type: 'String',
      value: measurement.sensing_device
    }
  }
  if (measurement.quantity_kind) {
    attr.metadata.quantity_kind = {
      type: 'String',
      value: measurement.quantity_kind
    }
  }
  if (measurement.unit) {
    attr.metadata.unit = {
      type: 'String',
      value: measurement.unit
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
 putSensorGatewayId,           
 getSensorMeasurements,   
 postSensorMeasurement,   
 getSensorMeasurement ,   
 deleteSensorMeasurement, 
 putSensorMeasurementName,
 putSensorMeasurementSD,
 putSensorMeasurementQK, 
 putSensorMeasurementUnit,
 putSensorMeasurementValue,
 orionRequest}
