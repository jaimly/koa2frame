'use strict';
/**
 * Created by Jesn on 2019/10/21.
 *
 */


module.exports = {
    start: async function (root_path) {
        global.rootPath = (root_path || __dirname) + '/';

        this.error = require('./tool/error');
        this.utils = require('./tool/utils');
        this.api = require('./api/base');
        this.domain = require('./domain/base');
        this.external = require('./external/base');
        await this.external.init(this);
        this.db = require('./db/index');
        await this.db.init(this);
        this.redis = require('./tool/redis');
        await this.redis.init();
        await require('./tool/task').init();
        await require('./app');
    }
};
// module.exports.start().catch(err => {
//     console.trace('run fail:\n',err);
//     process.exit();
// });