"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.service.js');
const axios = require('axios');


const getSocialMsgs   = async (req, res) => socialRequest('', 'GET',    null)
const postSocialMsg   = async (req, res) => socialRequest('', 'POST',   req.body)
const getSocialMsg    = async (req, res) => socialRequest(req.params.msgID, 'GET',    null)
const deleteSocialMsg = async (req, res) => socialRequest(req.params.msgID, 'DELETE', null)

const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1M0cxOXg4U2YxWHlnb2RUYjdJbU91NDVsS1NRNUF0MV8yRXJvWVZOZlk4In0.eyJqdGkiOiI2MDY5OGUxYS0xYzA2LTRlZGItOGVjMC05MGQ3OGM2MjVmNWQiLCJleHAiOjE1MDkyNTAzMzUsIm5iZiI6MCwiaWF0IjoxNTA5MjIxNTM1LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWRtaW4tY2xpIiwic3ViIjoiYjlhZTBmMmYtNzgwMy00Zjk5LThiODAtMjBkOTFkNzVmNTYwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWRtaW4tY2xpIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiN2I2YjRhNmQtNmJhMC00MWY2LThiMWMtMDA4MTNmM2RkMDAyIiwiYWNyIjoiMSIsImNsaWVudF9zZXNzaW9uIjoiZWJkNjM3MWItZjQ2Yy00NmVmLWFhOGEtMWI1OGUwNjcyNzcxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZS1yZWFsbSIsImFkbWluIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsid2F0ZXJzZW5zZS1yZWFsbSI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsImNyZWF0ZS1jbGllbnQiLCJtYW5hZ2UtdXNlcnMiLCJ2aWV3LWF1dGhvcml6YXRpb24iLCJtYW5hZ2UtZXZlbnRzIiwibWFuYWdlLXJlYWxtIiwidmlldy1ldmVudHMiLCJ2aWV3LXVzZXJzIiwidmlldy1jbGllbnRzIiwibWFuYWdlLWF1dGhvcml6YXRpb24iLCJtYW5hZ2UtY2xpZW50cyJdfSwid2F6aXVwLXJlYWxtIjp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInZpZXctYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIl19LCJtYXN0ZXItcmVhbG0iOnsicm9sZXMiOlsidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJ2aWV3LXJlYWxtIiwibWFuYWdlLWlkZW50aXR5LXByb3ZpZGVycyIsImltcGVyc29uYXRpb24iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwidmlldy1hdXRob3JpemF0aW9uIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiXX19LCJuYW1lIjoiIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW4ifQ.JrL8MYNdgEvtKrZAyTFFPvoY3-7GjWHuLCP5gSAl5WRCT7lCCo3zTq9F-nY58BZaM26oDHOqyOuw65rC6DaEMdkPuBYEcqnxPgenhB6lszJZhv1LNDCWCO9GeDVN3IAQiDUQ8qDcbY1IKpzIrROAKjimgLyrOm_oJOmvW4RJFaI5Bs74-HVZUZorZxRR0QzHxzfo4XULHDGNDG4oahe_hqPH82Fn8VD3WNff9Cd6oJrlDrZiDtJTbsDxOWL4naqgYoJkRHPSuo_V2OWQ8jmo4qm6S628jBLX-ElX2ks_mUq37L-esn12hdmQHrVs1hzs-f8u3pfZVvUDQfhWK9cK7Q'
async function postSocialMsgBatch(req, res) {

  console.log('body' + JSON.stringify(req.body));
  var msgs = await getMsgs(req.params.domain, req.body)
  console.log('msgs' + JSON.stringify(msgs));
  for (let msg of msgs) {
    await socialRequest('', 'POST', msg)
  }
}

async function getMsgs(domain, socialMsg) {

  var msgs = [] 
  for (let username of socialMsg.usernames) {
  
    var usrs = await users.find(token, domain, {username : username})
    var user = usrs[0];
    console.log('social user:' + JSON.stringify(user));
    console.log('username:' + user.username);
    
    for (let channel of socialMsg.channels) {
    
      var userID; 
      switch(channel.toLowerCase()) {
          case 'facebook':
              userID = user.attributes.facebook[0]; 
              break;
          case 'twitter':
              userID = user.attributes.twitter[0]; 
              break;
          case 'sms':
              userID = user.attributes.phone[0]; 
              break;
          default:
              throw "Unrecognized channel"
      } 
      var msg = {username: user.username, 
                 user_id: userID,
                 channel: channel,
                 message: socialMsg.message}
      msgs.push(msg);
    }
  }
  return msgs;
}


async function socialRequest(path, method, data) {
 
    var url = config.socialsUrl + '/SocialBackend/socials/' + path;
    var axiosConf = {method: method,
                     url: url,
                     data: data}
    console.log("Socials request " + method + " on: " + url);
    console.log(" data: " + JSON.stringify(data));
    
    //perform request to Orion
    return (await axios(axiosConf)).data;
}

module.exports = {
  getSocialMsgs,
  postSocialMsg,
  getSocialMsg,
  deleteSocialMsg,
  postSocialMsgBatch
};
