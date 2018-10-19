"use strict";

const request = require('request');
const url = require('url');
const config = require('../config.js');
const users = require('../routes/users/user.service.js');
const axios = require('axios');
const orionProxy = require('./orion-proxy.js');
const log = require('../log.js');

const WAZIUP_NOTIF = 'waziup_notif'


async function getNotifsOrion() {
  var subs = await orionProxy.orionRequest('/v2/subscriptions', 'GET', null);
  return getNotifs(subs)
}

async function postNotifOrion(notif) {
  var sub = getSub(notif)
  var res = await orionProxy.orionRequest('/v2/subscriptions', 'POST', sub);
  return res.replace('/v2/subscriptions/','');
}

async function getNotifOrion(notifID) {
  var sub = await orionProxy.orionRequest('/v2/subscriptions/' + notifID, 'GET', null);
  return getNotif(sub);
}

async function deleteNotifOrion(notifID) {
  return orionProxy.orionRequest('/v2/subscriptions/' + notifID, 'DELETE', null);
}

// ## Helper functions ##

function getNotifs(subs) {
  console.log("Nots:" + JSON.stringify(subs))
  return subs.filter(isWaziupNotif).map(sub => getNotif(sub))
}

function isWaziupNotif(sub) {
  return sub.notification.metadata && sub.notification.metadata == WAZIUP_NOTIF 
}

function getNotif(sub) {

  var notif = {id: sub.id}

  if (sub.description) {
    notif.description = sub.description;
  }
  notif.subject = {condition: {}} 
  if (sub.subject.entities) {
    notif.condition.sensors = sub.subject.entities.map(e => e.id);
  }
  if (sub.subject.condition && sub.subject.condition.attrs) {
    notif.condition.measurements = sub.subject.condition.attrs;
  }
  if (sub.subject.condition && sub.subject.condition.expression && sub.subject.condition.expression.q) {
    notif.condition.expression = sub.subject.condition.expression.q;
  }
  if (sub.notification.httpCustom && sub.notification.httpCustom.payload) {
    notif.notification= JSON.parse(decodeURIComponent(sub.notification.httpCustom.payload));
  }
  if (sub.expires) {
    notif.expires = sub.expires;
  }
  if (sub.throttling) {
    notif.throttling = sub.throttling;
  }
  if (sub.status) {
    notif.status = sub.status;
  }
  if (sub.times_sent) {
    notif.times_sent = sub.times_sent;
  }
  if (sub.last_notification) {
    notif.times_sent = sub.last_notification;
  }
  return notif
}

function getSub(notif) {

  log.debug('Notif:' + JSON.stringify(notif))
  var sub = {
    description: notif.description,
    subject: {
      entities: [],
      condition: {
        attrs: notif.condition.measurements,
        expression: { q: notif.condition.expression }
      }
    },
    notification: {
      httpCustom: {
        url: config.httpUrl + '/api/v1/socials/batch',
        method: "POST",
        payload: URIEncodeForbiddens(JSON.stringify(notif.notification)),
        headers: {"Content-Type": "application/json", "accept": "application/json"}
      },
      metadata: [WAZIUP_NOTIF]    
    },
    attrs: notif.condition.measurements
  }
  for(let sensor of notif.condition.sensors) {
    
    sub.subject.entities.push( {id: sensor })
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
