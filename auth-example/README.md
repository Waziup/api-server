### Keycloak setup

- Create a new client (e.g. "dashboard")
  - Setup the root URL to the root URL of the dashboard server
  - Configure Mappers. Add there a mapper as follows:
    - Name: permissions
    - Mapper Type: User Attribute
    - User Attribute: permissions
    - Token claim name: permissions
    - Claim JSON Type: String
    - Add to ID token: ON
    - Add to access token: ON
    - Add to userinfo: ON

  - Download config under Clients/dashboard/Installation
    - Select "Keycloak OIDC JSON"
    - Copy the text to "keycloak.json" in the project

- Setup a user
  - Create a user as usual
  - Create a new attribute "permissions" in Attributes. 
  
The specification of permissions in "permissions" attribute has
the following format: 

```admin; advisor: /FARM1; advisor: /FARM2; farmer: /FARM2```
    
Permissions are separated by semicolon. For "advisor" and "farmer",
a service path is supposed to follow after the colon. Advisor and farmer
can appear any number of times with different service path.

The service path is treated hierarchically, thus `/FARM1` would match
 also a request to `/FARM1/XXX`.


### Express setup

The Express webserver is supposed to be create this way:
 
```
const server = require('./lib/server');

const app = server.app;
const { AccessLevel, extractPermissions, protectByServicePath, protectByServicePathParam } = server.access;
```

Then `app` can be configured as needed.

Individual routes are protected as:

```
// http://.../test?sp=/FARM1
app.get('/test', protectByServicePath(AccessLevel.VIEW, req => req.query.sp), function (req, res) {
    res.json({
        result: 'OK'
    });
});
```

```
// http://.../orion/FARM1
app.get('/orion/*', protectByServicePathParam(AccessLevel.VIEW), function (req, res) {
    res.json({
        result: 'OK'
    });
});
```

```
// http://.../orion/FARM1
app.post('/orion/*', protectByServicePathParam(AccessLevel.EDIT), function (req, res) {
    res.json({
        result: 'OK'
    });
});

```