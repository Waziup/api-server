const config = require('../../config');
var settings = {
    baseUrl: config.keycloakUrl,
    username: 'admin',
    password: 'admin',
    grant_type: 'password',
    client_id: 'admin-cli'
}
module.exports = settings;
