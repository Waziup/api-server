"use strict";
const users = require('./user.service');
const auth = require('./auth.service');
const settings = require('./settings');
const express = require('express');
const adminRouter = express.Router();
//different admin routes for user management
adminRouter.post('/auth', function(req, res) {
    console.log(req.body);
    settings.username = req.body.username;
    settings.password = req.body.password;
    auth(settings).then(r => res.json(r)).catch(r => res.json(r));
});
adminRouter.post('/domains/:domain/users/search', function(req, res) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    users.find(token, req.params.domain, req.body).then(r => res.json(r)).catch(r => res.json(r));
});
adminRouter.get('/domains/:domain/users', function(req, res) {
    var token = req.get("Authorization").split(" ").pop();
    users.find(token, req.params.domain).then(r => res.json(r)).catch(r => res.json(r));
});
adminRouter.get('/domains/:domain/users/:userid', function(req, res) {
    console.log(req.params);
    var token = req.get("Authorization").split(" ").pop();
    users.find(token, req.params.domain, { userId: req.params.userid }).then(r => res.json(r)).catch(r => res.json(r));
});
adminRouter.put('/domains/:domain/users/:userid', function(req, res) {
    console.log(req.body);
    var token = req.get("Authorization").split(" ").pop();
    if (req.params.userid === req.body.id)
        users.update(token, req.params.domain, req.body).then(r => res.json(r)).catch(r => res.json(r));
    else res.status(400).end();
});


module.exports = adminRouter;