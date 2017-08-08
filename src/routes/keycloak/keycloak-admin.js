"use strict";
const users = require('./users');
const auth = require('./auth');
const settings = require('./settings');
const express = require('express');
const adminRouter = express.Router();
//different admin routes for user management
adminRouter.post('/', function(req, res) {
    console.log(req.body);
    settings.username = req.body.username;
    settings.password = req.body.password;
    auth(settings).then(r => res.json(r));
});
adminRouter.post('/search/:realm', function(req, res) {
    var token = req.get("Authorization").split(" ").pop();
    users.find(token, req.params.realm, req.body).then(r => res.json(r));
});
adminRouter.get('/:realm', function(req, res) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    users.find(token, req.params.realm).then(r => res.json(r));
});
adminRouter.get('/:realm/:userid', function(req, res) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    users.find(token, req.params.realm, { userId: userid }).then(r => res.json(r));
});
adminRouter.put('/:realm', function(req, res) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    users.update(token, req.params.realm, req.body).then(r => res.json(r));
});


module.exports = adminRouter;