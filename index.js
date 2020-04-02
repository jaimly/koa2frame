'use strict';
/**
 * Created by Jesn on 2019/10/21.
 *
 */

const app = require('./app');
module.exports = {
    start: async function (root_path) {
        await app(root_path);

        const Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env'));

        this.error = require('./tool/error');
        this.utils = require('./tool/utils');
        this.api = require('./api/base');
        this.domain = require('./domain/base');
        this.external = require('./external/base');
        this.db = require('./db/index');
        if(Etc.db && Etc.db.mongodb) this.mongodb = require('./db/mongodb/base');
        if(Etc.db && Etc.db.mysql) this.mysql = require('./db/mysql/base');
        if(Etc.db && Etc.db.oracle) this.oracle = require('./db/oracle/base');
        if(Etc.redis) this.redis = require('./tool/redis');
        if(Etc.external && Etc.external.kafka) this.kafka = require('./external/kafka');
        if(Etc.external && Etc.external.es) this.es = require('./external/es');
        if(Etc.external && Etc.external.dingTalk) this.dingTalk = require('./external/dingTalk');

        ///开启其他任务
        if(Etc.task) {
            let Task;
            try {
                Task = require(global.rootPath + 'tool/task');
            } catch (err) {
                return;
            }
            await Promise.all(Object.keys(Task).map(async task_name => {
                let is_start = Etc.task.start || Etc.task[task_name];
                if (!is_start) return;
                await Task[task_name]();
                console.log(`Task [${task_name}] started.`);
            }));
        }
    }
};
//module.exports.start();