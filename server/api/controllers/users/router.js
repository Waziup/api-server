import * as express from 'express';
import controller from './controller';
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json();
export default express.Router()
    .get('/', ::controller.all)
    .get('/:id', ::controller.byId)
    .put(':/id',jsonParser,::controller.update);