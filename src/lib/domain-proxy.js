"use strict";

const request = require('request');
const http = require('http');
const url = require('url');
const config = require('../config.js');
const axios = require('axios');
const querystring = require('querystring');
const MongoClient = require('mongodb').MongoClient


async function getDomains() {
  let entities = await orionRequest('/v2/entities', 'GET', null, {'type':'Domain'});
  return entities;
}

async function postDomains(domain) {
  domain.type = 'Domain'
  let resp = await orionRequest('/v2/entities', 'POST', domain, null);
  return resp;
}

async function getDomain(domainName) {
  let entity = await orionRequest('/v2/entities/' + domainName, 'GET', null, {'type':'Domain'});
  return entity;
}

async function deleteDomain(domainName) {
  let resp = await orionRequest('/v2/entities/' + domainName, 'DELETE', null, {'type':'Domain'});
  return resp;
}

//performs a request into Mongo database
async function mongoRequest(request) {
  const db = await MongoClient.connect(config.backend.mongoDBUrl);
  var res = request(db.collection('domains'));
  db.close();
  return res;
}

// Perform a request to Orion
async function orionRequest(path, method, data, query) {
 
   var url = config.backend.orionUrl + path;
   var headers = {'Fiware-Service': config.fiwareService};
   var axiosConf = {method: method,
                    url: url,
                    data: data,
                    headers: headers,
                    params: query}

   console.log("Orion request " + method + " on: " + url + "\n headers: " + JSON.stringify(headers));
   console.log(" query: " + JSON.stringify(query));
   console.log(" data: " + JSON.stringify(data));
    
   //perform request to Orion
   var resp = await axios(axiosConf);
   return resp.data;
}

module.exports = {
  getDomains,
  postDomains,
  getDomain,
  deleteDomain}
