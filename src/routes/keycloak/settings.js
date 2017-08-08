const config = require('config');
var settings = {
    baseUrl: config.get('keycloak-url'),
    username: 'admin',
    password: 'admin',
    grant_type: 'password',
    client_id: 'admin-cli'
}
module.exports = settings;
