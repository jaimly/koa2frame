'use strict';

const mongoose = require('mongoose'),
    Err = require('../../tool/error'),
    Ut = require('../../tool/utils'),
    Etc = Ut.getEtc(),
    DbConfig = Etc && Etc.db && Etc.db.mongodb,
    ObjectId = require('objectid'),
    TYPE = 'mongodb',
    dbs = {};

class MongoDBClass {
    constructor(name,schema,server) {
        if(schema && schema.constructor == String) {
            server = schema;
            schema = null;
        }
        if(!server && DbConfig) {
            Object.keys(DbConfig).map(k => {
                server = server || k;
            });
        }

        if(!server || !DbConfig) return;

        this.db_type = TYPE;
        this.server = server;
        this.name = name;
        this.schema = schema;
        this.is_log = Etc.log && Etc.log.db;
        if(dbs[server]) this.dbModel = dbs[server].model(name, new mongoose.Schema(schema), name);
    }
}

MongoDBClass.getID = function () {
    return new ObjectId().toString();
};

MongoDBClass.init = async function () {
    return Promise.all(Object.keys(DbConfig).map(server => {
        return MongoDBClass.createConnection(server);
    }));
};

MongoDBClass.createConnection = async function(server){
    if(!DbConfig || !DbConfig[server] || !DbConfig[server].connection) {
        Err.log(Err.error_log_type.etc, `read etc.db.${TYPE}.${server} fail.`);
        return Promise.reject(Err.get(Err.db_fail,null,`${TYPE}.${server} 配置信息出错`));
    }
    
    return dbs[server] || new Promise((resolve,reject) => {
        console.log(`db:${TYPE}:${server} connect...`);
        mongoose.set('useCreateIndex', true);
        dbs[server] = mongoose.createConnection(DbConfig[server].connection, {useNewUrlParser: true,useUnifiedTopology:true}).on('connected',() => {
            console.log(`db:${TYPE}:${server} success.`);
            return resolve(dbs[server]);
        }).on('disconnected', async () => {
            Err.log(Err.error_log_type.db,`db:${TYPE}:${server} 断开连接`);
            return reject(`db:${TYPE}:${server} disconnected`);
        }).on('error', err => {
            Err.log(Err.error_log_type.db,`db:${TYPE}:${server} 连接出错`,err);
            return reject(Err.get(Err.db_fail, err, `db:${TYPE}:${server} error`));
        });
    });
} 

module.exports = MongoDBClass;