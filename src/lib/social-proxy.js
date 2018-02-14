"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.route.js');
const axios = require('axios');
const log = require('../log.js');

//get all messages
async function getSocialMsgs(domain) {
  return socialRequest('', 'GET', null)
}

//get one message
async function getSocialMsg(domain, msgID) {
  return socialRequest(msgID, 'GET', null)
}

//delete one message
async function deleteSocialMsg(domain, msgID) {
  return socialRequest(msgID, 'DELETE', null)
}

//Post one social message
async function postSocialMsg(domain, socialMsg) {

  var usrs = await users.getUserSearch(domain, {username : socialMsg.username})
  if(usrs.length != 0) {
    var user = usrs[0];
    log.debug('user:' + JSON.stringify(user));
  
    var msg = getMsg(user, socialMsg.channel, socialMsg.message);
    log.debug('msg' + JSON.stringify(msg));
    await socialRequest('', 'POST', msg)
  } else {
    throw('user ' + socialMsg.username + ' not found');
  }
}

//Post a bunch of social messages
async function postSocialMsgBatch(domain, socialMsgBatch) {

  for (let username of socialMsgBatch.usernames) {
    for (let channel of socialMsgBatch.channels) {
      try {
        await postSocialMsg(domain, {username: username, channel: channel, message: socialMsgBatch.message})
      } catch(err) {
        log.warn('Batch social media sending failed: ' + err);
      }
    }
  }
}


//Perform a request on the social backend
async function socialRequest(path, method, data) {
 
    var url = config.backend.socialsUrl + '/api/v1/domains/waziup/socials/' + path;
    var axiosConf = {method: method,
                     url: url,
                     data: data}
    log.info("Socials request " + method + " on: " + url);
    log.info("  data: " + JSON.stringify(data));
    
    //perform request to Orion
    var res = await axios(axiosConf);
    return res.data;
}

// ## Helper functions ##

function getMsg(usr, channel, message) {
  var userID = {}
  switch(channel.toLowerCase()) {
      case 'facebook':
          if(usr.facebook) {
             userID = usr.facebook[0]; 
          } else {
            throw('Facebook user attribute not defined')
          }
          break;
      case 'twitter':
          if(usr.twitter) {
             userID = usr.twitter[0]; 
          } else {
            throw('Twitter user attribute not defined')
          }
          break;
      case 'sms':
          if(usr.phone) {
             userID = usr.phone[0];
          } else {
            throw('phone user attribute not defined')
          }
          break;
      default:
          throw "Unrecognized channel"
  } 

  return {username: usr.username, 
          user_id: userID,
          channel: channel,
          message: message}
}

module.exports = {
  getSocialMsgs,
  postSocialMsg,
  getSocialMsg,
  deleteSocialMsg,
  postSocialMsgBatch
};
