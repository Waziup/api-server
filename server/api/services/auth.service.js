import l from '../../common/logger';
var request = require('request');

var url = '/realms/master/protocol/openid-connect/token';
var baseUrl = 'http://127.0.0.1:8080/auth';
var config = {
    username: 'admin23',
    password: 'admin23',
    grant_type: 'password',
    client_id: 'admin-cli'
};

export class AuthService {
    getAccess(credentials) {

        config.username = credentials.username;
        config.password = credentials.password;
        console.log(config);
        return new Promise(function(resolve, reject) {
            request.post({ url: baseUrl + url, form: config }, function(err, resp, body) {
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

export default new AuthService();