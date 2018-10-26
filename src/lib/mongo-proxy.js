"use strict";

const request = require('request');
const http = require('http');
const config = require('../config.js');
const MongoClient = require('mongodb').MongoClient
const assert = require('assert');
const log = require('../log.js');
const orionProxy = require('./orion-proxy.js');

//get all values for a sensor measurement
async function getSensorMeasurementValues(sensorID, measID, query) {
 
  var sensor = await orionProxy.getSensorOrion(sensorID);  
  return getEntityMeasurementValues(sensor.domain, sensorID, "SensingDevice", measID, query);
}

async function getEntityMeasurementValues(domain, entityID, entityType, measID, query) {

  const lastN   = query.lastN ? parseInt(query.lastN): undefined
  const hLimit  = query.limit ? parseInt(query.limit): undefined
  const hOffset = query.offset ? parseInt(query.offset): undefined
  const from    = query.dateFrom ? new Date(query.dateFrom): undefined
  const to      = query.dateTo ? new Date(query.dateTo): undefined
  const format  = query.format ? query.format : undefined

  log.debug("query: lastN " + lastN)
  log.debug("query: limit " + hLimit)
  log.debug("query: offset " + hOffset)
  log.debug("query: from " + from)
  log.debug("query: to " + to)

  var findCondition = {
    'entityID': entityID,
    'entityType': entityType,
    'attributeID': measID
  };
  var recvTimeFilter;
  if (from && to) {
    recvTimeFilter = {
      $lte: to,
      $gte: from
    };
  } else if (from) {
    recvTimeFilter = {
      $gte: from
    };
  } else if (to) {
    recvTimeFilter = {
      $lte: to
    };
  }
  if (recvTimeFilter) {
    findCondition['timestamp'] = recvTimeFilter;
  }

  var docs;
  if (lastN || lastN === 0) {
    var docs = await mongoRequest(domain, col => col.find(findCondition).sort({'timestamp': -1}).limit(lastN).toArray());
  } else if (hOffset || hLimit) {
    var docs = await mongoRequest(domain, col => col.find(findCondition).sort({'timestamp': 1}).skip(hOffset || 0).limit(hLimit || 0).toArray());
  } else {
    var docs = await mongoRequest(domain, col => col.find(findCondition).limit(20).toArray());
  }
 
  let res = docs.map(getMeasurement)
  if(format == 'csv') {
    return "timestamp, date_received, value\n" + res.map(doc => doc.timestamp.toISOString() + "," + doc.date_received.toISOString() + "," + doc.value + "\n").join('')
  } else {
    return res
  }
}

//delete all datapoints belonging to a sensor
async function deleteEntityMongo(entityID, entityType) {
  var sensor = await orionProxy.getSensorOrion(entityID);  
  mongoRequest(sensor.domain, col => col.deleteMany({entityID, entityType}));
}

//create one datapoint for a sensor measurement (add the point to the list of measurements)
async function postDatapointMongo(entityID, entityType, measID, datapoint) {
  var sensor = await orionProxy.getSensorOrion(entityID);  
  var doc = getMongoDocument(entityID, entityType, measID, datapoint);
  log.debug("Mongo post datapoint:" + JSON.stringify(doc));
  mongoRequest(sensor.domain, col => col.insert(doc));
}

//performs a request into Mongo database
async function mongoRequest(domain, request) {
  const db = await MongoClient.connect(config.backend.mongoDBUrl);
  var collection = db.collection(config.mongoPrefix + '-' + domain)
  var res = await request(collection);
  db.close();
  return res;
}

// ## Helper functions ##

function getSensorDatapoints(sensor) {

  var datapoints = []
  if (sensor.measurements) {
    for(let meas of sensor.measurements) {
      let dts = getEntityMeasDatapoints(sensor.id, "SensingDevice", meas);
      dts.forEach(a => datapoints.push(a))
    }
  }
  return datapoints
}


function getEntityMeasDatapoints(entityID, entityType, meas) {
  var datapoints = []
  for(let val of meas.values) {
     log.debug('meas val:' + JSON.stringify(val));
     datapoints.push(getMongoDocument(entityID, entityType, meas.id, val.value))
  }
  return datapoints;
}

function getMeasurements(docs) {
   return docs.map(getMeasurement);
}

function getMeasurement(doc, format) {
  return {
     timestamp: doc.timestamp,
     value: doc.value,
     date_received: doc._id.getTimestamp()
  }
}

function getMongoDocument(entityID, entityType, measID, datapoint) {

  var doc = {
    entityID: entityID,
    entityType: entityType,
    attributeID: measID,
    value: datapoint.value
  };
  
  if(datapoint.timestamp)
    doc.timestamp = new Date(datapoint.timestamp);
  
  return doc;
}

module.exports = {
   getSensorMeasurementValues,
   postDatapointMongo,
   getEntityMeasurementValues,
   deleteEntityMongo,
};
