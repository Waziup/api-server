"use strict";
const users = require('./user.service');
const auth = require('./auth.service');

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
    console.log('delete user not implemented yet');
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