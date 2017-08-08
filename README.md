
WAZIUP API SERVER
=================

This application implements the API server for Waziup.

Install
-------

TBD.

Test
----

In order to test the API server, you need to retrieve an access token from keycloak.

```
RESULT=`curl --data "grant_type=password&client_id=waziup&username=waziup&password=waziup" http://localhost:8080/auth/realms/waziup/protocol/openid-connect/token`

TOKEN=`echo $RESULT | sed 's/.*access_token":"//g' | sed 's/".*//g'`
```

Then, you can test each access point using curl commands:
```
curl localhost:80/api/v1/orion/entities --header 'Fiware-Service:waziup' --header 'Fiware-ServicePath:/#' -H 'Authorization: Bearer $TOKEN' -L
```
