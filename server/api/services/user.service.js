import l from '../../common/logger';
var request = require('request');

var url = '/realms/master/protocol/openid-connect/token';
var baseUrl = 'http://127.0.0.1:8080/auth';
var users={};
export class UserService {
  all(accessToken){
 //get users of specific group
 //console.log(accessToken);
 var auth = {
    bearer: accessToken
  };

return new Promise(function(resolve , reject ){
  request({
      url: `${baseUrl}/admin/realms/waziup/groups/4592bd9b-9841-47b1-b7df-a8daa9affef7/members`,
      auth: auth
    }, function (err, response, body) {
      if (err) {
        console.log(err);
        reject(err);
      }
 
     if(body!="Bearer"){
users=JSON.parse(body);
resolve(users);
     } 

else resolve("Access Denied, "+body);
});
});
  
}
}
export default new UserService();