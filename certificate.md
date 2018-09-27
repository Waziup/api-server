Certificate install
-------------------

This is the procedure to install certificates on the online instance.
Be careful that the port 80 should be free, so you might need to kill some containers on the host (i.e. api-server)

```
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
sudo ./certbot-auto --debug certonly --standalone -d waziup.io -d www.waziup.io -d api.waziup.io -d dashboard.waziup.io -d keycloak.waziup.io -d dev.waziup.io -d api.staging.waziup.io -d dashboard.staging.waziup.io -d keycloak.staging.waziup.io -d iot-catalogue.waziup.io
crontab -e
//Add this line to crontab:
52 0,12 * * * root /home/ec2-user/certbot-auto renew --quiet
```
