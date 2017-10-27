"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.service');
const axios = require('axios');


const getSocialMsgs   = async (req, res) => socialRequest('', 'GET',    null)
const postSocialMsg   = async (req, res) => socialRequest('', 'POST',   req.body)
const getSocialMsg    = async (req, res) => socialRequest(req.params.msgID, 'GET',    null)
const deleteSocialMsg = async (req, res) => socialRequest(req.params.msgID, 'DELETE', null)

async function postSocialMsgBatch(req, res) {

  msgs = getMsgs(req.params.domain, req.body)
  for (let msg of msgs) {
    await socialRequest('', 'POST', msg)
  }
}

function getMsgs(domain, socialMsg) {

  var msgs = [] 
  for (let username of socialMsg.usernames) {
  
    var user = users.find(domain, {username : username})

    for (let channel of socialMsg.channels) {
    
      var userID; 
      switch(toLowerCase(channel)) {
          case 'facebook':
              userID = user.facebook; 
              break;
          case 'twitter':
              userID = user.twitter; 
              break;
          case 'sms':
              userID = user.phone; 
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
  deleteSocialMsg
};
