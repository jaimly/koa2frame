'use strict';

const mongoose = require('mongoose'),
    Err = require('../../tool/error'),
    Ut = require('../../tool/utils'),
    Etc = Ut.getEtc(),
    mongodbs = Etc && Etc.db && Etc.db.mongodb,
    ObjectId = require('objectid');

let dbs = {};

class cls {
    constructor(name,schema,server) {
        if(schema && schema.constructor == String) {
            server = schema;
            schema = null;
        }
        if(!server && mongodbs) {
            Object.keys(mongodbs).map(k => {
                server = server || k;
            });
        }

        if(!server || !mongodbs) return;

        this.server = server;
        this.name = name;
        this.schema = schema;
        this.is_log = Etc.log && Etc.log.db;
        if(this.createConnection() && this.createConnection().constructor != Promise) {
            this.dbModel = dbs[server].model(name, new mongoose.Schema(schema), name);
        }
    }

    async init() {
        console.log('db:mongodb start.');
        return new Promise((resolve,reject) => {
            this.createConnection().on('connected',() => {
                console.log('db:mongodb success.');
                return resolve(this);
            }).on('disconnected', () => {
                Err.log(Err.error_log_type.db,'db:mongodb断开连接');
                return reject('mongodb disconnected');
            }).on('error', err => {
                Err.log(Err.error_log_type.db,'db:mongodb连接出错',err);
                return reject(Err.get(Err.db_fail, err, 'mongodb连接出错'));
            });
        });
    }
}

cls.prototype.createConnection = function () {
    if (!mongodbs || !this.server
        || !mongodbs[this.server]
        || !mongodbs[this.server].connection) {
        Err.log(Err.error_log_type.etc, 'read etc.db.mongodb fail.');
        return Promise.reject(Err.get(Err.db_fail,null,'mongodb配置信息出错'));
    }

    if(!dbs[this.server]) {
        dbs[this.server] = mongoose.createConnection(mongodbs[this.server].connection, {useNewUrlParser: true,useUnifiedTopology:true});
    }
    return dbs[this.server];
};

cls.getID = function () {
    return new ObjectId().toString();
};

module.exports = cls;
