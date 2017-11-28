"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.service.js');
const axios = require('axios');
const orionProxy = require('./orion-proxy.js');

async function getNotifsOrion(domain) {
  var subs = await orionProxy.orionRequest('/v2/subscriptions', 'GET', domain, null);
  return getNotifs(domain, subs)

}

async function postNotifOrion(domain, notif) {
  var sub = getSub(domain, notif)
  return orionProxy.orionRequest('/v2/subscriptions', 'POST', domain, sub);
}

async function getNotifOrion(domain, notifID) {
  var sub = orionProxy.orionRequest('/v2/subscriptions/' + notifID, 'GET', domain, null);
  return getNotif(domain, sub);
}

async function deleteNotifOrion(domain, notifID) {
  return orionProxy.orionRequest('/v2/subscriptions/' + notifID, 'DELETE', domain, null);
}

// ## Helper functions ##

function getNotifs(domain, notifs) {
  return notifs
}

function getNotif(domain, notif) {

  return notif
}

function getSub(domain, notif) {

  console.log('Notif:' + JSON.stringify(notif))
  var sub = {
    description: notif.description,
    subject: {
      entities: [],
      condition: {
        attrs: notif.subject.condition.attrs
        //expression: { q: notif.subject.condition.expression }
      }
    },
    notification: {
      httpCustom: {
        url: config.httpUrl + '/api/v1/domains/' + domain + '/socials/batch',
        method: "POST",
        payload: URIEncodeForbiddens(JSON.stringify(notif.notification))
        }
      },
    attrs: notif.subject.condition.attrs 
  }
  for(let entityName of notif.subject.entityNames) {
    
    sub.subject.entities.push( {id: entityName })
  }

  if(notif.expires) {
    sub.expires = notif.expires
  }
  if(notif.throttling) {
    sub.throttling = notif.throttling
  }

  return sub
}

// URI encode the forbidden characters of Orion 
function URIEncodeForbiddens(s) { 
  // forbidden characters: <>"\;() 
  const forbiddens = ["<", ">", "\"", "\\\\", ";", "\\(", "\\)"] 
  return forbiddens.reduce(function (sacc, c) { return replaceAll(sacc, c, encodeURIComponent(c)) }, s) 
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}


module.exports = {
  getNotifsOrion,
  postNotifOrion,
  getNotifOrion,
  deleteNotifOrion}
