"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');

async function getHistory(req, res) {

  const reqUrl = url.parse(req.url);
  const domain = req.params.domain;
  const ELSUrl = config.backend.elasticsearchUrl;
  const path = req.params[0];
  const proxyUrl = `${ELSUrl}/${config.elsPrefix}-${domain}/${path}${reqUrl.search || ''}`; 

  const options = {
     url: proxyUrl
  }
  request(options).pipe(res);   
}

module.exports = {
   getHistory
};
