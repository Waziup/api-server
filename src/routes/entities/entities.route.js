"use strict";
const config = require('../../config.js');
const mongoProxy = require('../../lib/mongo-proxy');
const orionProxy = require('../../lib/orion-proxy');

const orionRequest = orionProxy.orionRequest;


async function createEntity(domain, body) {
  
  var entity = {
    id: body.id,
    type: body.type
  };
  
  var meass = {};
  
  for(var key in body) {
    
    if(key === "id" || key === "type")
      continue;
    
    meass[key] = Array.isArray(body[key]) ? body[key] : [body[key]];
    
    entity[key] = {
      type: "Object",
      value: Array.isArray(body[key]) ? body[key][body[key].length-1] : body[key]
    }
  }

  var resp = await orionRequest('/v2/entities', 'POST', domain, entity);
  
  mongoProxy.postValuesMongo(domain, entity.id, entity.type, meass);
  
  return resp;
}

async function getEntityTypes(domain) {
  
  var resp = orionRequest('/v2/types?options=values', 'GET', domain);
  return resp;
}

async function getEntities(domain, type, body) {
  
  var entities  = await orionRequest('/v2/entities?type='+type+'&attrs=id', 'GET', domain);
  return entities.map(entitiy => entitiy.id);
}

async function getEntity(domain, type, id) {
  
  var orionEntity = await orionRequest('/v2/entities/'+id+'?type='+type, 'GET', domain);
  if(orionEntity) {
    
    var entity = {
      id: orionEntity.id,
      type: orionEntity.type
    }
   
    for(var key in orionEntity) {
      
      if(key == "type" || key == "id")
        continue;
      
      entity[key] = orionEntity[key].value;
    }
    
    return entity
  }
}

async function deleteEntity(domain, type, id) {
  
  var resp = orionRequest('/v2/entities/'+id+'?type='+type, 'DELETE', domain);
  return resp;
}

async function getEntityAttribute(domain, type, id, attr) {
  
  await orionRequest('/v2/entities/'+id+'/attrs/'+attr+'?type='+type, 'GET', domain);
  var measurements = await mongoProxy.getEntityMeasurementValues(domain, id, type, attr);
  return measurements.map(meas => meas.value);
}

async function deleteEntityAttribute(domain, type, id, attr) {
  
  var resp = orionRequest('/v2/entities/'+id+'/attrs/'+attr+'?type='+type, 'DELETE', domain);
  return resp;
}

async function putEntityAttribute(domain, type, id, attr, body) {
  
  await mongoProxy.deleteEntityMeasMongo(domain, id, type, attr);
  
  var attribute = {
    [attr]: {
      value: Array.isArray(body) ? body[body.length-1] : body,
      type: "Object"
    }
  }
  
  var entity = await orionRequest('/v2/entities/'+id+'/attrs?type='+type, 'POST', domain, attribute);
  
  var values = {
    [attr]: Array.isArray(body) ? body : [body]
  }
  
  mongoProxy.postValuesMongo(domain, id, type, values);
  
  return entity;
  
}

async function postEntityAttribute(domain, type, id, attr, body) {
  
  var attribute = {
    [attr]: {
      value: body,
      type: "Object"
    }
  }
  
  var entity = await orionRequest('/v2/entities/'+id+'/attrs?type='+type, 'POST', domain, attribute);
  
  mongoProxy.postValueMongo(domain, id, type, attr, body);
  
  return entity;
}




module.exports = {
    createEntity,
    getEntityTypes,
    getEntities,
    getEntity,
    deleteEntity,
    getEntityAttribute,
    deleteEntityAttribute,
    putEntityAttribute,
    postEntityAttribute,
}
