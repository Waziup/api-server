"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const config = require('../config.js');
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');

//get all values for a sensor measurement
async function getSensorMeasurementValues(domain, sensorID, measID) {
  var docs = await mongoRequest(domain, col => col.find({entityID: sensorID, attributeID: measID}).toArray());
  return docs.map(getMeasurement)
}

//insert all datapoints for a new sensor
async function postSensorMongo(domain, sensor) {
  var docs = getSensorDatapoints(sensor);
  console.log("postSensorMongo:" + JSON.stringify(docs));
  mongoRequest(domain, col => col.insertMany(docs));
}

//insert all datapoints for a new sensor
async function postSensorMeasMongo(domain, sensorID, meas) {
  var docs = getSensorMeasDatapoints(sensorID, meas);
  mongoRequest(domain, col => col.insertMany(docs));
}

//delete all datapoints belonging to a sensor
async function deleteSensorMongo(domain, sensorID) {
  mongoRequest(domain, col => col.deleteMany({entityID: sensorID}));
}

//create one datapoint for a sensor measurement
async function postDatapointMongo(domain, sensorID, measID, datapoint) {
  var doc = getMongoDocument(sensorID, measID, datapoint);
  mongoRequest(domain, col => col.insert(doc));
}

//delete all datapoints for a sensor measurement
async function deleteMeasMongo(domain, sensorID, measID) {
  mongoRequest(domain, col => col.deleteMany({entityID: sensorID, attributeID: measID}));
}

//performs a request into Mongo database
async function mongoRequest(domain, request) {
  const db = await MongoClient.connect(config.backend.mongoDBUrl);
  var res = request(db.collection(config.mongoPrefix + '-' + domain));
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
