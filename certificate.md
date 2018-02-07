Certificate install
-------------------

This is the procedure to install certificates on the online instance.

```
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
sudo ./certbot-auto --debug certonly --standalone -d dev.waziup.io
crontab -e
//Add this line to crontab:
52 0,12 * * * root /home/ec2-user/certbot-auto renew --quiet
```
