"use strict";
const users = require('./user.service');
const auth = require('./auth.service');
const settings = require('./settings');
const configSecret = require('../../config-secret.js');

//different admin routes for user management
async function postAuth(cred) {
    settings.username = cred.username;
    settings.password = cred.password;
    return auth(settings);
}

async function getUserSearch(domain, search) {
    var token = await getAdminAuthToken()
    return users.find(token.accesstoken, domain, search);
}

async function getUsers(domain) {
    var token = await getAdminAuthToken()
    return users.find(token.accesstoken, domain);
}

async function getUser(domain, userid) {
    var token = await getAdminAuthToken()
    return users.find(token.accesstoken, domain, { userId: userid });
}

async function putUser(domain, userid, user) {
    var token = await getAdminAuthToken()
    if (userid === user.id)
        return users.update(token.accesstoken, domain, user);
    else res.status(400).end();
}

async function deleteUser(domain, userid) {
    console.log('delete user not implemented yet');
}

// ## Helper functions ##

async function getAdminAuthToken() {
    return auth(settings);
}

module.exports = {
    postAuth,
    getUserSearch,
    getUsers,
    getUser,
    putUser,
    deleteUser
}
