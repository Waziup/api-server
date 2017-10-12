"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');


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

}

async function getSensors(req, res) {

  try{
    var entities = await axios.get('http://broker.waziup.io/v2/entities',
                                 {headers: {'Fiware-Service': 'cdupont'}});
    var sensors = entitiesToSensors(entities.data);
    res.send(sensors);
  
  } catch(err) {
    console.log('error ' + err);
  }

}

function entitiesToSensors(entities) {

  console.log(entities);

  var sensors = entities.map(entityToSensor);
  console.log("sensors:" + JSON.stringify(sensors));
  return sensors;
 
}

function entityToSensor(entity) {

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
  if (entity.sensorKind) {
    sensor.sensorKind = entity.sensorKind.value;
  }
  if (entity.location && entity.location.value && entity.location.value.coordinates) {
    sensor.location = {latitude:  entity.location.value.coordinates[1],
                       longitude: entity.location.value.coordinates[0]};
  }
  //getMeasurements(entity);

  return sensor;
}

async function postSensor(req, res) {
  
  var entity = sensorToEntity(req.body);
  try {
    var res2 = await axios.post('http://broker.waziup.io/v2/entities',
                                 entity,
                                {headers: {'Fiware-Service': 'cdupont'}});
    res.send(res2.data);
  
  } catch(err) {
    res.status(err.response.status);
    res.send(err.response.data); 
  }
}

function sensorToEntity(sensor) {

  var entity = {
    id: sensor.id
  }

  return entity;
}


module.exports = {
    install
};
