"use strict";
const users = require('./user.service');
const auth = require('../../auth/authN');
const keycloakProxy = require('../../lib/keycloakProxy');
const config = require('../../config.js');
const log = require('../../log.js');

//different admin routes for user management
async function postAuth(cred) {
    return auth.getUserAuthToken(cred);
}

async function getUserSearch(search) {
    return users.find(search);
}

async function getUsers() {
    return users.find();
}

async function getUser(userid) {
    return users.find({ userId: userid });
}

async function putUser(userid, user) {
    if (userid === user.id)
        return users.update(user);
    else res.status(400).end();
}

async function createUser(user) {
    return users.create(user);
}

async function deleteUser(userid) {
    return users.remove(userid);
}

module.exports = {
    postAuth,
    getUserSearch,
    getUsers,
    getUser,
    putUser,
    createUser,
    deleteUser
}
