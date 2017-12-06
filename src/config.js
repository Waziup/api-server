module.exports = {
  // Node.js app
  httpEnabled: (process.env.HTTP_ENABLED=="true" || process.env.HTTP_ENABLED=="yes" || process.env.HTTP_ENABLED=="1" || true) &&
    ! (process.env.HTTP_ENABLED=="false" || process.env.HTTP_ENABLED=="no" || process.env.HTTP_ENABLED=="0"),
  httpPort: process.env.HTTP_PORT || 3000,
  httpUrl: process.env.HTTP_URL || `http://localhost:${process.env.HTTP_PORT || 3000}`,
  
  // Node.js secure app
  httpsEnabled: (process.env.HTTPS_ENABLED=="true" || process.env.HTTPS_ENABLED=="yes" || process.env.HTTPS_ENABLED=="1"),
  httpsPort: process.env.HTTPS_PORT || 3001,
  httpsTlsCert: process.env.HTTPS_TLS_CRT || "",
  httpsTlsKey: process.env.HTTPS_TLS_KEY || "",
  httpsTlsChain: process.env.HTTPS_TLS_CHAIN || "",
  httpsUrl: process.env.HTTPS_URL || `http://localhost:${process.env.HTTPS_PORT || 3001}`,
  
  // API URL to be used in the server-side code
  keycloakRealm: 'waziup',
  keycloakClientId: 'api-server',
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

