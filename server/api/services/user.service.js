import l from '../../common/logger';
var request = require('request');

var url = '/realms/master/protocol/openid-connect/token';
var baseUrl = 'http://127.0.0.1:8080/auth';
var users = {};
export class UserService {
    all(accessToken) {
        //get users of specific group
        //console.log(accessToken);
        var auth = {
            bearer: accessToken
        };

        return new Promise(function(resolve, reject) {
            request({
                url: `${baseUrl}/admin/realms/waziup/users`,
                auth: auth
            }, function(err, response, body) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                if (body != "Bearer") {
                    users = JSON.parse(body);
                    resolve(users);
                } else resolve("Access Denied, " + body);
            });
        });

    }
    byId(id, accessToken) {
        //get specific user
        var auth = {
            bearer: accessToken
        };
        return new Promise(function(resolve, reject) {
            request({
                url: `${baseUrl}/admin/realms/waziup/users/${id}`,
                auth: auth
            }, function(err, response, body) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                try {
                    var user = JSON.parse(body);
                    resolve(user);
                } catch (e) {
                    console.log(e);
                    resolve("Access Denied, " + body);
                }
            });
        });

    }
    update(id, user, accessToken) {
        //get specific user
        var auth = {
            bearer: accessToken
        };

        return new Promise(function(resolve, reject) {
            request.put({
                url: `${baseUrl}/admin/realms/waziup/users/${id}`,
                auth: auth,
                body: user
            }, function(err, resp, body) {
                if (err) {
                    console.log(err);
                    return;
                }
                var jsonBody = JSON.parse(body);
                //console.log(accessToken);
                if (jsonBody)
                    resolve(jsonBody);
                else resolve("Wrong credentials, Please try again");
            });
        });

    }
}
export default new UserService();