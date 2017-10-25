"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const config = require('../config.js');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/waziup_history';

function install(router, keycloak) {

  router.get(    '/domains/:domain/history',                                       (req, res) => mongoProxy(getDatapoints(req.params.domain), req, res));
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID/values', (req, res) => mongoProxy(getSensorMeasurementValues(req.params.domain, req.params.sensorID, req.params.measID, req.body), req, res));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements/:measID/values', (req, res) => mongoProxy(insertMongoDatapoint(req.params.domain, req.params.sensorID, req.params.measID, req.body), req, res));

}

async function insertMongoDatapoint(domain, sensorID, measID, data) {

  const db = await MongoClient.connect('mongodb://localhost:27017/waziup_history');

  var data2 = getMeasAttrValue(sensorID, measID, data);
  // insert the document
  db.collection(domain).insert(data2);

  db.close();
}

async function getSensorMeasurementValues(domain, sensorID, measID) {

  const db = await MongoClient.connect(config.mongoDBUrl);

  // Get the documents collection
  var docs = await db.collection(domain).find({entityID: sensorID, attributeID: measID}).toArray();

  db.close();
  
  return docs.map(getMeasurement)

}

async function getDatapoints(domain) {

  const db = await MongoClient.connect(config.mongoDBUrl);

  // Get the documents collection
  var docs = await db.collection(domain).find().toArray();

  db.close();
  
  return docs

}


async function mongoProxy(mongoReq, req, res) {

  try {
    // get processed data from Mongo
    var waziupResp = await mongoReq
    
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

function getMeasurements(docs) {

   return docs.map(getMeasurement);
}

function getMeasurement(doc) {

  return {
     timestamp: doc.timestamp,
     value: doc.value
   }
}

function getMeasAttrValue(sensorID, measID, datapoint) {

  return {
    entityID: sensorID,
    attributeID: measID,
    timestamp: datapoint.timestamp,
    value: datapoint.value
  }
}


module.exports = {
   install,
   getSensorMeasurementValues
};
