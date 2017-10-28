"use strict";
const users = require('./user.service');
const auth = require('./auth.service');
const settings = require('./settings');

//different admin routes for user management
async function postAuth(req) {
    console.log(req.body);
    settings.username = req.body.username;
    settings.password = req.body.password;
    return auth(settings);
}

async function getUserSearch(req) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    return users.find(token, req.params.domain, req.body);
}

async function getUsers(req) {
    console.log('getUsers');
    var token = req.get("Authorization").split(" ").pop();
    return users.find(token, req.params.domain);
}

async function getUser(req) {
    console.log(req.params);
    var token = req.get("Authorization").split(" ").pop();
    return users.find(token, req.params.domain, { userId: req.params.userid });
}

async function putUser(req) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    if (req.params.userid === req.body.id)
        return users.update(token, req.params.domain, req.body);
    else res.status(400).end();
}

async function deleteUser(req) {
    console.log('delete user not implemented yet');
}

module.exports = {
    postAuth,
    getUserSearch,
    getUsers,
    getUser,
    putUser,
    deleteUser
}
