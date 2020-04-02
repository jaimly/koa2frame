'use strict';
/**
 * Created by Jesn on 2019/10/21.
 *
 */

const app = require('./app');
module.exports = {
    start: async function (root_path) {
        await app(root_path);

        this.error = require('./tool/error');
        this.utils = require('./tool/utils');
        this.api = require('./api/base');
        this.domain = require('./domain/base');
        this.mongodb = require('./db/mongodb/base');
        this.external = require('./external/base');
    }
};