"use strict";

const Promise = require('bluebird');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('config');
const elasticsearch = require('elasticsearch');
const safeHandler = require('../lib/handlers');
//const util = require('util');

// function dump(obj) {
//     console.log(util.inspect(obj, false, null));
// }

const es = new elasticsearch.Client({
    host: config.get('elasticsearch.host') + ':' + config.get('elasticsearch.port')
    // , log: 'trace'
});

async function search(req, res) {
    const msearch = [];

   //config.get('elasticsearch.index')
    for (let sensorAttrib of ['SM1', 'SM2']) {
        msearch.push({
            index: req.params.farmid
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

const routerSearch = express.Router();
//Once you’ve created a router object, you can add middleware and HTTP method routes 
//(such as get, put, post, and so on) to it just like an application.
//sensor data analysis: sensor provider
routerSearch.get('/search/:farmid', safeHandler(search));

//single sensor values: /FARM1/Sensor1 SM1, SM2
//get this data from refer to docs: elasticsearch javascript API restrict the search limit
//find the use case:

module.exports = routerSearch;
