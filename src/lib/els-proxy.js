"use strict";

const config = require('../config.js');
const log = require('../log.js');
const axios = require('axios');

// Perform a request to ELS
async function elsRequest(req) {
 
   const path = req.params[0];
   const url = config.backend.elasticsearchUrl + '/' + path;
   const headers = req.headers;
   const query = req.qs;
   const method = req.method;
   const data = req.body;
   var axiosConf = {method: method,
                    url: url,
                    data: data,
                    headers: headers,
                    params: query}
   log.info("ELS request " + method + " on: " + url);
   log.debug("  headers: " + JSON.stringify(headers));
   log.debug("  query: " + JSON.stringify(query));
   log.debug("  data: " + JSON.stringify(data));
    
   //perform request to ELS
   var resp = await axios(axiosConf);
   return resp.data;
}

module.exports = {
   elsRequest
};
