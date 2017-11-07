const axios = require('axios');
const admin_creds = require('./admin-settings');
const config = require('../../config.js');
const querystring = require('querystring');

async function getAuthToken(domain, cred) {
   var url = config.keycloakUrl + '/realms/' + domain + '/protocol/openid-connect/token';
   var headers = {'Content-type': 'application/x-www-form-urlencoded'};
   settings = {
     username: cred.username,
     password: cred.password,
     grant_type: 'password',
     client_id: 'admin-cli'
   }

   var axiosConf = {method: 'POST',
                    url: url,
                    data: querystring.stringify(settings),
                    headers: headers}
   console.log("Keycloak auth request on: " + url + "\n headers: " + JSON.stringify(headers));
   console.log(" data: " + JSON.stringify(settings));
    
   //perform request to Keycloak
   var resp = await axios(axiosConf);
   return resp.data.access_token;
}

async function getAdminAuthToken() {
    return getAuthToken('master', {username: admin_creds.username, password: admin_creds.password });
}

module.exports = {
  getAuthToken,
  getAdminAuthToken
  } 
