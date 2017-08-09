
WAZIUP API SERVER
=================

This application implements the API server for Waziup.

Install
-------

```
npm install
```

Test
----

Start the server:
```
sudo node index.js
```

Start keycloak:
```
cd ..
docker-compose up keycloak
```

In order to test the API server, you need to retrieve an access token from keycloak.
Make sure that the user "waziup" exists in Keycloak and that he has the attributes "Service", "ServicePath" and "permissions" correctly set.
Also make sure the client "waziup" exists and that it has mappers for the attributes above.
Retrieve the token:
```
TOKEN=`curl --data "grant_type=password&client_id=waziup&username=waziup&password=waziup" http://localhost:8080/auth/realms/waziup/protocol/openid-connect/token | jq ".access_token" -r`

```

Then, you can test each access point using curl commands:
```
curl localhost:80/api/v1/orion/v2/entities -H 'Fiware-Service:waziup' -H 'Fiware-ServicePath:/#' -H "Authorization: Bearer $TOKEN" | jq ".[].id"
```
The command above should yeld a list of sensor names.

Debug
-----

In order to see the details of the token generated, do:
```
echo $TOKEN | cut -d "." -f2 | base64 -d | jq "."
```
The data inside the token should match the keycloak.json configuration precisely.


You can also use docker-compose to start the api-server:
```
docker-compose up api-server keycloak
```
However in this case you need to declare your own machine as an alias for keycloak:
```
echo "127.0.0.1 keycloak" >> /etc/hosts
```
And create the token using this alias:
```
TOKEN=`curl --data "grant_type=password&client_id=waziup&username=waziup&password=waziup" http://keycloak:8080/auth/realms/waziup/protocol/openid-connect/token | jq ".access_token" -r`
```
Otherwise the token will have the wrong ISS.
