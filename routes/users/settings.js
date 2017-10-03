const config = require('config');
var settings = {
    baseUrl: config.get('keycloak.host') + ':' + config.get('keycloak.port') + '/auth',
    username: 'admin',
    password: 'admin',
    grant_type: 'password',
    client_id: 'admin-cli'
}
module.exports = settings;