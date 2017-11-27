"use strict";
const users = require('./user.service');
const auth = require('../../auth/authN');
const keycloakProxy = require('../../lib/keycloakProxy');
const config = require('../../config.js');

//different admin routes for user management
async function postAuth(cred) {
    return auth.getUserAuthToken(cred);
}

async function getUserSearch(domain, search) {
    return users.find(domain, search);
}

async function getUsers(domain) {
    return users.find(domain);
}

async function getUser(domain, userid) {
    return users.find(domain, { userId: userid });
}

async function putUser(domain, userid, user) {
    if (userid === user.id)
        return users.update(domain, user);
    else res.status(400).end();
}

async function createUser(domain, user) {
    return users.create(domain, user);
}

async function deleteUser(domain, userid) {
    return users.remove(domain, userid);
}

async function getRoles(username) {
   const user = await users.findByName('waziup', username)
   console.log('user: ' + JSON.stringify(user))
   const path = 'users/' + user.id + '/role-mappings/realm/composite'
   var token = await auth.getAdminAuthToken()
   var roleInfos = await keycloakProxy.keycloakRequest(config.keycloakRealm, path, 'GET', null, null, true, token) 
   return roleInfos.map(ri => ri.name)
}


module.exports = {
    postAuth,
    getUserSearch,
    getUsers,
    getUser,
    putUser,
    createUser,
    deleteUser,
    getRoles
}
