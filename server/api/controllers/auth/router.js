import * as express from 'express';
import controller from './controller';
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json();
export default express.Router()
    .post('/',jsonParser, ::controller.getAccessToken);