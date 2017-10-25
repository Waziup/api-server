module.exports = {

    // Node.js app
    port: process.env.SERVER_PORT || 3000,

    // API URL to be used in the server-side code
    serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 3000}`,
    keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080/auth',
    realm: 'waziup',
    clientId: 'api-server',
    orionUrl: process.env.ORION_URL || 'http://localhost:1026',
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    mongoDBUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/waziup_history'
};

