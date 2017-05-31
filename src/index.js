"use strict";

const Promise = require('bluebird');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('config');
const elasticsearch = require('elasticsearch');
const util = require('util');

function dump(obj) {
    console.log(util.inspect(obj, false, null));
}

const es = new elasticsearch.Client({
    host: config.get('elasticsearch.host') + ':' + config.get('elasticsearch.port')
    // , log: 'trace'
});

function safeHandler(handler) {
    return function(req, res) {
        handler(req, res).catch(error => res.status(500).send(error.message));
    };
}


async function search(req, res) {
    const msearch = [];

    for (let sensorAttrib of ['SM1', 'SM2']) {
        msearch.push({
            index: config.get('elasticsearch.index')
        });

        msearch.push({
            from: 0,
            size: 0,
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                attribute: sensorAttrib
                            }
                        },
                        {
                            range: {
                                time: { gte: new Date().getTime() - 1000 * 60 * 60 * 24 * 7 }
                            }
                        }
                    ]
                }
            },
            aggs: {
                buckets: {
                    date_histogram: {
                        field: 'time',
                        interval: '6h',
                        time_zone: config.get('timezone')
                    },
                    aggs: {
                        value_avg: {
                            avg: {
                                field: 'value'
                            }
                        }
                    }
                }
            },

            sort: {time: 'asc'}
        });
    }

    const searchResults = await es.msearch({
        body: msearch
    });

    const dataMap={};

    function addAggregations(index, fieldName) {
        for (let agg of searchResults.responses[index].aggregations.buckets.buckets) {
            const entry = dataMap[agg.key] || { t: agg.key };
            entry[fieldName] = agg.value_avg.value;
            dataMap[agg.key] = entry;
        }
    }

    addAggregations(0, 'sm1');
    addAggregations(1, 'sm2');

    const dataKeys = Object.keys(dataMap);
    dataKeys.sort();

    const dataArray = [];
    for (let key of dataKeys) {
        dataArray.push(dataMap[key]);
    }

    res.json(dataArray);
}

const router = express.Router();
router.get('/search', safeHandler(search));

const app = express();
var cors = require('cors')
// app.use(express.static(path.join(__dirname, 'public')));

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


/*app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});*/

app.use('/api', router);

async function run() {
    await new Promise(resolve => app.listen(4000, () => resolve()));
    console.log('Listening on port 4000');
}

run();
