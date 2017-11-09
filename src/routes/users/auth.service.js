const axios = require('axios');
const admin_creds = require('./admin-settings');
const config = require('../../config.js');
const querystring = require('querystring');

async function getUserAuthToken(domain, cred) {
   const settings = {
     username: cred.username,
     password: cred.password,
     grant_type: 'password',
     client_id: 'waziup'
   }
   return getAuthToken(domain, settings);
}

async function getAdminAuthToken() {
   const settings = {
     username: admin_creds.username,
     password: admin_creds.password,
     grant_type: 'password',
     client_id: 'admin-cli'
   }
   return getAuthToken('master', settings);
}

async function getAuthToken(domain, settings) {
   const path = '/protocol/openid-connect/token';

   //perform request to Keycloak
   const resp = await keycloakRequest(domain, path, 'POST', querystring.stringify(settings));
   return resp.access_token;
}

// Perform a request to Keycloak
async function keycloakRequest(realm, path, method, data, query) {
 
   var url = config.backend.keycloakUrl + '/realms/' + realm + path;
   const headers = {'Content-type': 'application/x-www-form-urlencoded'};
   var axiosConf = {method: method,
                    url: url,
                    data: data,
                    headers: headers,
                    params: query}
   console.log("Keycloak request " + method + " on: " + url + "\n headers: " + JSON.stringify(headers));
   console.log(" query: " + query);
   console.log(" data: " + JSON.stringify(data));
    
   //perform request
   var resp = await axios(axiosConf);
   return resp.data;
}
module.exports = {
  getUserAuthToken,
  getAdminAuthToken
  } 
