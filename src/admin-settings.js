// This file contains the CONFIDENTIAL credentials to Keycloak.
// Do not commit on Github.

var creds = {
    username: 'admin' || process.env.ADMIN_LOGIN,
    password: 'admin' || process.env.ADMIN_PASS,
}
module.exports = creds;
