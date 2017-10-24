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

  router.get(    '/domains/:domain/history',    getHistory);
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID/values', (req, res) => mongoProxy(readMongoValues(req.params.domain, req.params.sensorID, req.params.measID, req.body), req, res));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements/:measID/values', (req, res) => mongoProxy(insertMongoValue(req.params.domain, req.params.sensorID, req.params.measID, req.body), req, res));

}

async function insertMongoValue(domain, sensorID, measID, data) {

  const db = await MongoClient.connect('mongodb://localhost:27017/waziup_history');

  var data2 = getMeasAttrValue(sensorID, measID, data);
  // Get the documents collection
  var collection = db.collection('domain');
  // Insert some documents
  await collection.insert(data2);

  db.close();
}

async function readMongoValues(domain, sensorID, measID) {

  const db = await MongoClient.connect(config.mongoDBUrl);

  var collection = db.collection(domain);
  // Get the documents collection
  var docs = await collection.find().toArray();

  db.close();

  return docs;
}



async function mongoProxy(mongoReq, req, res) {

  try {
    // get processed data from ELS
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


//Perform a request to els and handle data transformation to/from waziup format
async function elsProxy2(path, query, method, preProc, postProc, data) {

  //pre-process the data from Waziup to els format
  var data2 = preProc? await preProc(data) : null;
  
  //get data from els
  var elsResp = await elsRequest(path, method, query, data2)
 
  console.log("ELS response: " + JSON.stringify(elsResp.data));

  //pro-process the data from els to Waziup format
  var waziupResp = postProc? await postProc(elsResp.data): elsResp.data;

  return waziupResp;
}


function getMeasAttrValue(sensorID, measID, datapoint) {

  return {
    sensorID: sensorID,
    attributeID: measID,
    timestamp: datapoint.timestamp,
    value: datapoint.value
  }
}


module.exports = {
    install
};
