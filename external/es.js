'use strict';
/**
 * Created by Jesn on 2019/10/21.
 * ElasticSearch
 */

const Base = require('./base'),
    Winston = require('winston'),
    ElasticSearch = require('winston-elasticsearch');

class cls extends Base{
    constructor() {
        super('es');
    }
}

cls.prototype.send = function (opts) {
    Winston.createLogger({
        transports: [
            new ElasticSearch(Object.assign({
                clientOpts: {
                    node: this.server
                }
            },opts))
        ]
    }).log(opts.level,opts.message,opts.meta);
};

module.exports = new cls();