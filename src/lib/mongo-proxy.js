"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const config = require('../config.js');

var MongoClient = require('mongodb').MongoClient, assert = require('assert');

//get all values for a sensor measurement
async function getSensorMeasurementValues(domain, sensorID, measID) {
  var docs = await mongoRequest(db => db.collection(domain).find({entityID: sensorID, attributeID: measID}).toArray());
  return docs.map(getMeasurement)
}

//insert all datapoints for a new sensor
async function postSensorMongo(domain, sensor) {
  var docs = getSensorDatapoints(sensor);
  console.log("postSensorMongo:" + JSON.stringify(docs));
  mongoRequest(db => db.collection(domain).insertMany(docs));
}

//insert all datapoints for a new sensor
async function postSensorMeasMongo(domain, sensorID, meas) {
  var docs = getSensorMeasDatapoints(sensorID, meas);
  mongoRequest(db => db.collection(domain).insertMany(docs));
}

//delete all datapoints belonging to a sensor
async function deleteSensorMongo(domain, sensorID) {
  mongoRequest(db => db.collection(domain).deleteMany({entityID: sensorID}));
}

//create one datapoint for a sensor measurement
async function postDatapointMongo(domain, sensorID, measID, datapoint) {
  var doc = getMongoDocument(sensorID, measID, datapoint);
  mongoRequest(db => db.collection(domain).insert(doc));
}

//delete all datapoints for a sensor measurement
async function deleteMeasMongo(domain, sensorID, measID) {
  mongoRequest(db => db.collection(domain).deleteMany({entityID: sensorID, attributeID: measID}));
}

//performs a request into Mongo database
async function mongoRequest(request) {
  const db = await MongoClient.connect(config.mongoDBUrl);
  var res = request(db);
  db.close();
  return res;
}

// ## Helper functions ##

function getSensorDatapoints(sensor) {

  var datapoints = []
  for(let meas of sensor.measurements) {
    let dts = getSensorMeasDatapoints(sensor.id, meas);
    dts.forEach(a => datapoints.push(a))
  }
  return datapoints
}

function getSensorMeasDatapoints(sensorID, meas) {
  var datapoints = []
  for(let val of meas.values) {
     console.log('val:' + JSON.stringify(val));
     datapoints.push(getMongoDocument(sensorID, meas.id, val))
  }
  return datapoints;
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

function getMongoDocument(sensorID, measID, datapoint) {

  return {
    entityID: sensorID,
    attributeID: measID,
    timestamp: datapoint.timestamp,
    value: datapoint.value
  }
}

module.exports = {
   getSensorMeasurementValues,
   postSensorMongo,
   postSensorMeasMongo,
   deleteSensorMongo,
   postDatapointMongo,
   deleteMeasMongo
};
