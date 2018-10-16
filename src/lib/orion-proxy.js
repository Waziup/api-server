"use strict";

const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');
const querystring = require('querystring');
const authZ = require('../auth/authZ.js');
const log = require('../log.js');
const users = require('../routes/users/user.service.js')

async function getSensorsOrion(query, auth) {
  let entities = await orionRequest('/v2/entities', 'GET', null, query);
  let perms = await authZ.getPermissions(auth, [authZ.SCOPE_SENSORS_VIEW])
  let sensors = await getSensors(entities);
  let sensorsFiltered = sensors.filter(s => perms.findIndex(p => p.resource === s.id) != -1)
  return sensorsFiltered
}

async function postSensorOrion(sensor, kauth) {
  const username = kauth && kauth.grant ? kauth.grant.access_token.content.preferred_username : 'guest'
  let resp = await orionRequest('/v2/entities', 'POST', getEntity(sensor, username));
  return resp.replace('/v2/entities/', '').replace('?type=SensingDevice', '');
}

async function getSensorOrion(sensorID, query) {
  let entity = await orionRequest('/v2/entities/' + sensorID, 'GET', null);
  return getSensor(sensorID, entity);
}

async function deleteSensor(sensorID) {
  let resp = orionRequest('/v2/entities/' + sensorID, 'DELETE', null);
  return resp;
}

async function putSensorLocation(sensorID, location) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/location', 'PUT', getEntityLocation(location));
  return resp;
}

async function putSensorName(sensorID, name) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/name', 'PUT', getStringAttr(name));
  return resp;
}

async function putSensorGatewayId(sensorID, gateway_id) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/gateway_id', 'PUT', getStringAttr(gateway_id));
  return resp;
}

async function putSensorVisibility(sensorID, visibility) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/visibility', 'PUT', getStringAttr(visibility));
  return resp;
}

async function getSensorMeasurements(sensorID, query) {
  let attrs = await orionRequest('/v2/entities/' + sensorID + '/attrs', 'GET', null, query);
  return getMeasurements(sensorID, attrs)
}

async function postSensorMeasurement(sensorID, meas) {
  let resp = await orionRequest('/v2/entities/' + sensorID + '/attrs', 'POST', getMeasAttr(meas));
  return resp;
}

async function getSensorMeasurement(sensorID, measID, query) {
  let attr = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'GET', null)
  return getMeasurement(sensorID, measID, attr, query);
}

async function deleteSensorMeasurement(sensorID, measID) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'DELETE', null);
  return resp;
}

async function putSensorMeasurementName(sensorID, measID, name) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', await getMetadata('name', sensorID, measID, name));
  return resp;
}

async function putSensorMeasurementSD(sensorID, measID, sd) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', await getMetadata('sensing_device', sensorID, measID, sd));
  return resp;
}

async function putSensorMeasurementQK(sensorID, measID, qk) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', await getMetadata('quantity_kind', sensorID, measID, qk));
  return resp;
}

async function putSensorMeasurementUnit(sensorID, measID, unit) {
  let resp = orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', await getMetadata('unit', sensorID, measID, unit));
  return resp;
}

async function putSensorMeasurementValue(sensorID, measID, datapoint) {

  var contentType = null
  if(typeof datapoint.value == "object") {
     contentType = "application/json";
  } else {
     contentType = "text/plain";
  }

  let resp = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID + '/value', 'PUT', JSON.stringify(datapoint.value), null, contentType);
  if(datapoint.timestamp) {
    orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', await getMetadata('timestamp', sensorID, measID, datapoint.timestamp));
  } else {
    orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'PUT', await deleteMetadata('timestamp', sensorID, measID));
  }
  return resp;
}


// Perform a request to Orion
async function orionRequest(path, method, data, query, contentType) {
 
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
   if(method === "POST") {
     return resp.headers.location;
   } else {
     return resp.data;
   }
}

//get the full metadata before modify it (Orion doesn't support PUT method on specific metadata fields)
async function getMetadata(metadataField, sensorID, measID, newValue) {

  let attr = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'GET', null)
  attr.metadata[metadataField] = getStringAttr(newValue);
  return attr;
}

//get the full metadata before modify it (Orion doesn't support PUT method on specific metadata fields)
async function deleteMetadata(metadataField, sensorID, measID) {

  let attr = await orionRequest('/v2/entities/' + sensorID + '/attrs/' + measID, 'GET', null)
  delete attr.metadata[metadataField];
  return attr;
}

function getStringAttr(attr) {
  return {
    type: 'String',
    value: attr
  }
}

function getSensors(entities) {
  var sensors = [];
  for (let e of entities) {
    var s = getSensor(e.id, e);
    sensors.push(s);
  }
  return sensors
}

function getSensor(sensorID, entity) {

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
  if (entity.owner) {
    sensor.owner = entity.owner.value;
  }
  if (entity.visibility) {
    sensor.visibility = entity.visibility.value;
  }

  // Retrieve values from historical database
  sensor.measurements = getMeasurements(sensorID, entity);

  return sensor;
}

function getMeasurements(sensorID, attrs) {

  var measurements = []
  for (var attrID in attrs) {
    const attr = attrs[attrID];

    if (attr.type == 'Measurement') {
      measurements.push(getMeasurement(sensorID, attrID, attr));
    }
  }
  return measurements;
}


function getMeasurement(sensorID, attrID, attr) {
 
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
    if (metadata.timestamp) {
      lastValue.timestamp = metadata.timestamp.value;
    }        
    if (metadata.dateModified) {
      lastValue.date_received = metadata.dateModified.value;
    }        
  }
  return lastValue;
}

function getEntity(sensor, username) {

  var entity = {
    id: sensor.id,
    type: 'SensingDevice'
  }
    entity.gateway_id = {type: 'String', value: sensor.gateway_id? sensor.gateway_id: ''};
    entity.name       = {type: 'String', value: sensor.name? sensor.name: ''};
    entity.owner      = {type: 'String', value: username};
    entity.domain     = {type: 'String', value: sensor.domain? sensor.domain: ''};
    entity.visibility = {type: 'String', value: sensor.visibility? sensor.visibility: ''};
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
 putSensorLocation,       
 putSensorName,           
 putSensorGatewayId,           
 putSensorVisibility,           
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
