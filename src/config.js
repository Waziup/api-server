module.exports = {
  backend: {  
    keycloakUrl:      process.env.KEYCLOAK_URL      || 'http://localhost:8080/auth',
    orionUrl:         process.env.ORION_URL         || 'http://localhost:1026',
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    mongoDBUrl:       process.env.MONGODB_URL       || 'mongodb://localhost:27017/waziup_history',
    socialsUrl:       process.env.SOCIALS_URL       || 'http://localhost:9123'
  },
  clients: [{
    name: 'waziup',
    // API-server port 
    port: process.env.SERVER_PORT || 3000,
    // API-server URL 
    serverUrl:        process.env.SERVER_URL        || `http://localhost:${process.env.SERVER_PORT || 3000}`,
    realm: 'waziup',
    clientId: 'api-server',
    FIWAREService: 'waziup',
    MongoPrefix: 'waziup'
  }]
};

