import l from '../../common/logger';
var request = require('request');

var url = '/realms/master/protocol/openid-connect/token';
var baseUrl = 'http://127.0.0.1:8080/auth';
var config = {
  username: 'admin',
  password: 'admin',
  grant_type: 'password',
  client_id: 'admin-cli'
};

export class AuthService {
  getAccess(){


return new Promise(function(resolve , reject ){
  request.post({url: baseUrl + url, form: config}, function (err, resp, body) {
  if (err) {
    console.log(err);
    return;
  }

  var jsonBody = JSON.parse(body);
  var accessToken = jsonBody.access_token;
  //console.log(accessToken);
  if(accessToken)
resolve(accessToken);
else reject(jsonBody);
});
    });
}

}

export default new AuthService();