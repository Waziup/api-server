"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');

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

  router.get('/domains/:domain/sensors', getSensors);

}

function getSensors(req, res) {

  //console.log(req)
  const orionHost = config.orionUrl;

    const options = {
        method: 'GET',
        host: 'broker.waziup.io',
        port: 80,
        path: '/v2/entities',
        headers: {
            'Fiware-Service': 'waziup',
            'Fiware-ServicePath': '/#'
        },
        json: true
    };

  var newReq = http.request(options, function(newRes) {

   var body = '';
   newRes.on('data', function(chunk) {
     body += chunk;
   });
   newRes.on('end', function() {
     console.log('body: ' + body);

     var newBody = entitiesToSensors(JSON.parse(body));

     console.log("new body = " + newBody);
     res.write(String(JSON.stringify(newBody))); 
   });
  }).on('error', function(err) {
    res.statusCode = 500;
    res.end();
  
  });

  req.pipe(newReq).pipe(res);

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
  if (entity.location && entity.location.value && entity.location.value.coordinates) {
    sensor.location = {latitude: entity.location.value.coordinates[1],
                       longitude: entity.location.value.coordinates[0]};
  }

  return sensor;
}

module.exports = {
    install
};
