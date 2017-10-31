"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.service.js');
const axios = require('axios');
const orionProxy = require('./orion-proxy.js');

const getNotifsOrion   = async req => orionProxy.orionProxy('/v2/subscriptions', 'GET', null, data => getNotifs(req.params.domain, data), req);
const postNotifOrion   = async req => orionProxy.orionProxy('/v2/subscriptions', 'POST', data => getSub(req.params.domain, data), null, req);
const getNotifOrion    = async req => orionProxy.orionProxy('/v2/subscriptions/ + req.params.notifID', 'GET', null, data => getNotif(req.params.domain, req.params.notifID, data), req);
const deleteNotifOrion = async req => orionProxy.orionProxy('/v2/subscriptions/ + req.params.notifID', 'DELETE', null, null, req);

function getNotifs(domain, data) {
  return data
}

function getNotif(domain, notifID, data) {

  return data
}

function getSub(domain, notif) {

  console.log('Notif:' + JSON.stringify(notif))

  var sub = {
    description: notif.description,
    subject: {},
    notification: {}
  }
  for(let entityName of notif.subject.entityNames) {
    
    //var entity = async orionProxy. 
    sub.subject.entities.push( {id: entityName })
  }

  if(notif.expires) {
    sub.expires = notif.expires
  }
  if(notif.throttling) {
    sub.throttling = notif.throttling
  }
 //   "subject": {
 //     "entities": [
 //       {
 //         "id":  
 //       }
 //     ],
 //     "condition": {
 //       "attrs": [
 //         "TC"
 //       ]
 //     }
 //   },
 //   "notification": {
 //     "httpCustom": {
 //       "url": "http://sms2.waziup.io/v1/sms/send",
 //       "qs": {
 //         "contact": "+393806412093",
 //         "msg": "WAZIUP:%20\${id}%20pond%20temperature%20exceeded:%20\${TC}%20C"
 //       }
 //     },
 //     "attrs": [
 //       "TC"
 //     ]
 //   },
 //   "expires": "2040-01-01T14:00:00.00Z",
 //   "throttling": 5
 // }

  return data
}

module.exports = {
  getNotifsOrion,
  postNotifOrion,
  getNotifOrion,
  deleteNotifOrion
};
