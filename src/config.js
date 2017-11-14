module.exports = {
  // Node.js app
  port: process.env.SERVER_PORT || 3000,
  // API URL to be used in the server-side code
  serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.SERVER_PORT || 3000}`,
  keycloakRealm: 'waziup',
  keycloakClientId: 'waziup',
  fiwareService: 'waziup',
  mongoPrefix: 'waziup',
  elsPrefix: 'waziup',
  keycloakClientSecret: "4e9dcb80-efcd-484c-b3d7-1e95a0096ac0",
  backend: {
    keycloakUrl:      process.env.KEYCLOAK_URL      || 'http://localhost:8080/auth',
    orionUrl:         process.env.ORION_URL         || 'http://localhost:1026',
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    mongoDBUrl:       process.env.MONGODB_URL       || 'mongodb://localhost:27017/waziup_history',
    socialsUrl:       process.env.SOCIALS_URL       || 'http://localhost:9123',
  }
};

