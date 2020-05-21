'use strict';
/**
 * Created by Jesn on 2018/10/18.
 * 连接oracle其类
 */

const Oracledb = require('oracledb'),
    Err = require('../../tool/error'),
    Ut = require('../../tool/utils'),
    Etc = Ut.getEtc(),
    TYPE = 'oracle',
    DbConfig = Etc && Etc.db && Etc.db.oracle,
    dbs = {};

class OracleClass {
    constructor(name,server) {
        if(!server && DbConfig) {
            Object.keys(DbConfig).map(k => {
                server = server || k;
            });
        }
        if(!server || !DbConfig) return;

        this.db_type = TYPE;
        this.server = server;
        this.name = name;
        this.is_log = Etc.log && Etc.log.db;

        Oracledb.maxRows = 1000;
        Oracledb.outFormat = Oracledb.OBJECT;
        Oracledb.autoCommit = true;
    }

    disConnect (server) {
        server = server || this.server;
        if(dbs[server] && dbs[server].connection) {
            dbs[server].connection.release();
            dbs[server].connection = null;
        }
    }

    /**
     * 执行sql语句
     * @param sql ｜必须｜string｜sql语句
     * @param connecting ｜非必须｜boolean｜默认false：断开连接。
     * @returns {Promise}
     */
    exec (sql,connecting) {
        let cnn = await OracleClass.connect(this.server);
    
        return await new Promise((resolve, reject) => {
            if(this.is_log) console.log(sql);
            cnn.query(sql, (err, result) => {
                //if(!connecting) this.disConnect();//todo：大批量访问有问题，待优化
                if(err) {
                    Err.log(Err.error_log_type.db,TYPE,sql,err);
                    return reject(Err.get(Err.db_fail,err));
                }
                if(result && result.rows) result = result.rows;
                return resolve(result);
            })
        });
    }
}

OracleClass.init = async function () {
    return Promise.all(Object.keys(DbConfig).map(server => {
        return OracleClass.connect(server);
    }));
};

OracleClass.connect = async function(server){
    if(!DbConfig || !DbConfig[server] || !DbConfig[server].connection) {
        Err.log(Err.error_log_type.etc, `read etc.db.${TYPE}.${server} fail.`);
        return Promise.reject(Err.get(Err.db_fail,null,`${TYPE}.${server} 配置信息出错`));
    }
    
    return new Promise((resolve,reject) => {
        console.log(`db:${TYPE}:${server} connect...`);

        const pool = dbs[server] && dbs[server].pool;
        if(!pool) {
            pool = Oracledb.createPool(DbConfig[server].connection,(err,pool) => {
                if(!err && pool) dbs[server] = {pool};

                Err.log(Err.error_log_type.db, `db:${TYPE}:${server} 创建池出错`);
                return reject(Err.get(Err.db_fail, null, `db:${TYPE}:${server} createPool fail.`));
            });
        }

        if(dbs[server].connection) return resolve(dbs[server].connection);
        pool.getConnection((err, connection) => {
            if (err) {
                Err.log(Err.error_log_type.db,`db:${TYPE}:${server} 连接出错`,err);
                return reject(Err.get(Err.db_fail, err, `db:${TYPE}:${server} error`));
            }else {
                console.log(`db:${TYPE}:${server} success.`);
                dbs[server].connection = connection;
                return resolve(connection);
            }
        });
    });
} 

module.exports = OracleClass;