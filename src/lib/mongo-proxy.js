"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const config = require('../config.js');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');

async function putDatapointMongo(domain, sensorID, measID, data) {

  const db = await MongoClient.connect(config.mongoDBUrl);

  var data2 = getMeasAttrValue(sensorID, measID, data);
  // insert the document
  db.collection(domain).insert(data2);

  db.close();
}

async function getSensorMeasurementValuesMongo(domain, sensorID, measID) {

  const db = await MongoClient.connect(config.mongoDBUrl);

  // Get the documents collection
  var docs = await db.collection(domain).find({entityID: sensorID, attributeID: measID}).toArray();

  db.close();
  
  return docs.map(getMeasurement)

}

async function getDatapointsMongo(domain) {

  const db = await MongoClient.connect(config.mongoDBUrl);

  // Get the documents collection
  var docs = await db.collection(domain).find().toArray();

  db.close();
  
  return docs
}

async function postSensorMongo(req) {
  putSensorMongo(req.params.domain, req.body);
}

async function putSensorMongo(domain, sensor) {
  
  const db = await MongoClient.connect(config.mongoDBUrl);

  var data2 = getDatapoints(sensor);

  // insert the documents
  db.collection(domain).insertMany(data2);

  db.close();
}

async function deleteSensorMongo(req) {
  deleteSensorMongo2(req.params.domain, req.body);
}

async function deleteSensorMongo2(domain, sensor) {
  
  const db = await MongoClient.connect(config.mongoDBUrl);

  var data2 = getDatapoints(sensor);

  // insert the documents
  db.collection(domain).deleteMany(data2);

  db.close();
}

function getDatapoints(sensor) {

  var datapoints = []
  for(let meas of sensor.measurements) {
    for(let val of meas.values) {
       console.log('val:' + JSON.stringify(val));
       datapoints.push(getMeasAttrValue(sensor.id, meas.id, val))
    }
  }
  return datapoints
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
   getSensorMeasurementValuesMongo,
   postSensorMongo,
   deleteSensorMongo
};
