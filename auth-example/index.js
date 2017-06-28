"use strict";

const server = require('./lib/server');

const app = server.app;
const { AccessLevel, extractPermissions, protectByServicePath, protectByServicePathParam } = server.access;

// http://.../test?sp=/FARM1
app.get('/test', protectByServicePath(AccessLevel.VIEW, req => req.query.sp), function (req, res) {
    res.json({
        result: 'OK'
    });
});

// http://.../orion/FARM1
app.get('/orion/*', protectByServicePathParam(AccessLevel.VIEW), function (req, res) {
    res.json({
        result: 'OK'
    });
});

// http://.../orion/FARM1
app.post('/orion/*', protectByServicePathParam(AccessLevel.EDIT), function (req, res) {
    res.json({
        result: 'OK'
    });
});

app.listen(3000, function () {
    console.log("Listening at port 3000.");
});
