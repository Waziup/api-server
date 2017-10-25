module.exports = {

    // Node.js app
    port: process.env.SERVER_PORT || 3000,

    // API URL to be used in the server-side code
    serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 3000}`,

    keycloakUrl: process.env.KEYCLOAK_URL || 'http://aam.waziup.io/auth',
    realm: 'waziup',
    clientId: 'api-server',
    orionUrl: process.env.ORION_URL || 'http://broker.waziup.io',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://elasticsearch.waziup.io',
    mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/waziup_history'
};