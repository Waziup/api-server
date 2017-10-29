"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.service.js');
const axios = require('axios');


const getSocialMsgs   = async (req, res) => socialRequest('', 'GET',    null)
const getSocialMsg    = async (req, res) => socialRequest(req.params.msgID, 'GET',    null)
const deleteSocialMsg = async (req, res) => socialRequest(req.params.msgID, 'DELETE', null)

const token = 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1M0cxOXg4U2YxWHlnb2RUYjdJbU91NDVsS1NRNUF0MV8yRXJvWVZOZlk4In0.eyJqdGkiOiJlMzI4MTg4Zi1iODFmLTQ0NTktYjVlNi05MjRkY2JkYzg5NDUiLCJleHAiOjE1MDk5ODQzNTMsIm5iZiI6MCwiaWF0IjoxNTA5MjkzMTUzLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvbWFzdGVyIiwiYXVkIjoiYWRtaW4tY2xpIiwic3ViIjoiYjlhZTBmMmYtNzgwMy00Zjk5LThiODAtMjBkOTFkNzVmNTYwIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYWRtaW4tY2xpIiwiYXV0aF90aW1lIjowLCJzZXNzaW9uX3N0YXRlIjoiMGNiNzA2ZTAtZTVmYi00NGJlLWE2MzMtMzA3ODIyNjk5MjQyIiwiYWNyIjoiMSIsImNsaWVudF9zZXNzaW9uIjoiYWI5YWI5OTQtZDI3Ni00N2EwLTljMjAtZjQ3YjZhZTUwMmNlIiwiYWxsb3dlZC1vcmlnaW5zIjpbIioiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZS1yZWFsbSIsImFkbWluIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsid2F0ZXJzZW5zZS1yZWFsbSI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsImNyZWF0ZS1jbGllbnQiLCJtYW5hZ2UtdXNlcnMiLCJ2aWV3LWF1dGhvcml6YXRpb24iLCJtYW5hZ2UtZXZlbnRzIiwibWFuYWdlLXJlYWxtIiwidmlldy1ldmVudHMiLCJ2aWV3LXVzZXJzIiwidmlldy1jbGllbnRzIiwibWFuYWdlLWF1dGhvcml6YXRpb24iLCJtYW5hZ2UtY2xpZW50cyJdfSwid2F6aXVwLXJlYWxtIjp7InJvbGVzIjpbInZpZXctcmVhbG0iLCJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsIm1hbmFnZS1pZGVudGl0eS1wcm92aWRlcnMiLCJpbXBlcnNvbmF0aW9uIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInZpZXctYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIl19LCJtYXN0ZXItcmVhbG0iOnsicm9sZXMiOlsidmlldy1pZGVudGl0eS1wcm92aWRlcnMiLCJ2aWV3LXJlYWxtIiwibWFuYWdlLWlkZW50aXR5LXByb3ZpZGVycyIsImltcGVyc29uYXRpb24iLCJjcmVhdGUtY2xpZW50IiwibWFuYWdlLXVzZXJzIiwidmlldy1hdXRob3JpemF0aW9uIiwibWFuYWdlLWV2ZW50cyIsIm1hbmFnZS1yZWFsbSIsInZpZXctZXZlbnRzIiwidmlldy11c2VycyIsInZpZXctY2xpZW50cyIsIm1hbmFnZS1hdXRob3JpemF0aW9uIiwibWFuYWdlLWNsaWVudHMiXX19LCJuYW1lIjoiIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiYWRtaW4ifQ.nYu6pDDjdYSszSrXwc0y2PaUEfF7LliHuR9HPNTfBrtViITdVlqFLLtrFthCXt31Mol7TYZuZk1vjJP-yIlaMuSJl75DzQnB2tOpDu2-TKEBwruhJIBh-VxNQW28oQLTuP50JWq1pKUWMnK_ObGOteI3k-U-66ekcw3H9bAa-3Sw8xMhGV8qZ228aPOvhvqvKe-gHEsGx-UTpPCdOMBFJyZc3smBC84It971YyrgvV1uXaJomTNOsUSkkem_UjTn5aze3GwnKSkwdelW46AW87uwsPtt9n8qIrwe-mXoQN-DOvTOapBmq4pNQucx-Hujn_yQWqvwRBID4lgYXddq9g'


async function postSocialMsg(req, res) {

  var usrs = await users.find(token, req.params.domain, {username : req.body.username})
  var user = usrs[0];
  console.log('user:' + JSON.stringify(user));
  
  var msg = getMsg(user, req.body.channel, req.body.message);
  console.log('msg' + JSON.stringify(msg));
  await socialRequest('', 'POST', msg)
}
async function postSocialMsgBatch(req, res) {

  console.log('body' + JSON.stringify(req.body));
  var socialMsgBatch = req.body;
  var msgs = await getMsgs(req.params.domain, socialMsgBatch)
  console.log('msgs' + JSON.stringify(msgs));
  for (let msg of msgs) {
    await socialRequest('', 'POST', msg)
  }
}

async function getMsgs(domain, socialMsgBatch) {

  var msgs = [] 
  for (let username of socialMsgBatch.usernames) {
  
    var usrs = await users.find(token, domain, {username : username})
    var user = usrs[0];
    console.log('social user:' + JSON.stringify(user));
    console.log('username:' + user.username);
    
    for (let channel of socialMsgBatch.channels) {
       
      msgs.push(getMsg(user, channel, socialMsgBatch.message));
    }
  }
  return msgs;
}

function getMsg(usr, channel, message) {
      
  var userID; 
  switch(channel.toLowerCase()) {
      case 'facebook':
          userID = usr.attributes.facebook[0]; 
          break;
      case 'twitter':
          userID = usr.attributes.twitter[0]; 
          break;
      case 'sms':
          userID = usr.attributes.phone[0]; 
          break;
      default:
          throw "Unrecognized channel"
  } 

  return {username: usr.username, 
          user_id: userID,
          channel: channel,
          message: message}
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
