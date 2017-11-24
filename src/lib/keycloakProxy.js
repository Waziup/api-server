const axios = require('axios');
const admin_creds = require('../admin-settings');
const config = require('../config.js');
const querystring = require('querystring');

// Perform a request to Keycloak
async function keycloakRequest(realm, path, method, data, query, isAdmin, token, contentType) {
 
   var url = config.backend.keycloakUrl + (isAdmin? '/admin': '') + '/realms/' + realm + '/' + path;
   var headers = {} 
   if(token) {
      headers['Authorization'] = 'Bearer ' + token
   } 
   if(contentType) {
      headers['Content-Type'] = contentType
   } 
   
   var axiosConf = {method: method,
                    url: url,
                    data: data,
                    headers: headers,
                    params: query}
   console.log("Keycloak request " + method + " on: " + url);
   //console.log(" headers: " + JSON.stringify(headers));
   console.log(" query: " + query);
   console.log(" data: " + JSON.stringify(data));
    
   //perform request
   var resp = await axios(axiosConf);
   return resp.data;
}


module.exports = {
  keycloakRequest
  } 
