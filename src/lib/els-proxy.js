"use strict";

const access = require('./access.js');
const { AccessLevel, servicePathProtection, getServicePathFromHeader } = access;
const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');
const querystring = require('querystring');


function install(router, keycloak) {

//  router.get(    '/domains/:domain/history',    getHistory);
  router.get(    '/domains/:domain/sensors/:sensorID/measurements/:measID/values', (req, res) => elsProxy(getSensorMeasurementValues(req.params.domain, req.params.sensorID, req.params.measID, req.body), req, res));
  router.post(   '/domains/:domain/sensors/:sensorID/measurements/:measID/values', (req, res) => elsProxy(postSensorMeasurementValue(req.params.domain, req.params.sensorID, req.params.measID, req.body), req, res));

}

//const getHistory                    = async (req, res) => elsProxy('/' + req.params.domain + '/sensingNumber/_search', req.params.query, 'GET'   , null             , null  , req, res);
const getSensorMeasurementValues = (domain, sensorID, measID, data) => elsProxy2('/' + domain + '/sensingNumber/_search?q=sensorID:' + sensorID + '%20AND%20attributeID:' + measID, null, 'GET'   , null             , getMeasurementValues, data);
//const getSensorMeasurementValues    = async (req, res) => elsProxy('/' + req.params.domain + '/sensingNumber/_search',{q: 'sensorID:' + req.params.sensorID + '%20AND%20attributeID:' + req.params.measID},'GET'   , null             , getMeasurementValues  , req, res);
const postSensorMeasurementValue = (domain, sensorID, measID, data) => elsProxy2('/' + domain + '/sensingNumber/', null, 'POST'  , getMeasAttrValue.bind(null, sensorID, measID) , null, data);


async function elsProxy(elsReq, req, res) {

  try {
    // get processed data from ELS
    var waziupResp = await elsReq
    
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

// Perform a request to Orion
async function elsRequest(path, method, query, data) {
 
    var url = 'http://elasticsearch.waziup.io' + path;
    var axiosConf = {method: method,
                     url: url,
                     data: data,
                     params: query}
    console.log("ELS request " + method + " on: " + url + "\n query: " + JSON.stringify(query));
    console.log(" data: " + JSON.stringify(data));
    
    //perform request to ELS
    return axios(axiosConf);
}

function getMeasurementValues(docs) {
  return docs.hits.hits.map(getMeasurementValue)
}

function getMeasurementValue(doc) {

  return {
    timestamp: doc._source.timestamp,
    value: doc._source.value
  }
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
    install,
    getSensorMeasurementValues 
};
