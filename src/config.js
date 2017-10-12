
module.exports = {
  // Node.js app
  port: process.env.PORT || 8000,

  // API Gateway
  api: {
    // API URL to be used in the server-side code
    serverUrl:
      process.env.API_SERVER_URL ||
      `http://localhost:${process.env.PORT || 3000}`,
  },

  keycloakUrl: 'http://aam.waziup.io/auth',
  realm: 'waziup',
  clientId: 'api-server',
  orionUrl: 'http://broker.waziup.io',
  elasticsearchUrl: 'http://elasticsearch.waziup.io'
};
