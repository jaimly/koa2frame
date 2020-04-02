'use strict';
/**
 * Created by Jesn on 2018/10/18.
 * 连接mysql
 */

const mysql = require('mysql'),
    Err = require('../../tool/error'),
    Ut = require('../../tool/utils'),
    Etc = Ut.getEtc(),
    mysqls = Etc && Etc.db && Etc.db.mysql;

let dbs = {};

class cls {
    constructor(name,server) {
        if(!server && mysqls) {
            Object.keys(mysqls).map(k => {
                server = server || k;
            });
        }
        if(!server || !mysqls) return;

        this.type = 'mysql';
        this.server = server;
        this.name = name;
        this.connection = null;
        this.is_log = Etc.log && Etc.log.db;
    }
}

cls.prototype.init = async function () {
    if(this.connection) return this.connection;

    console.log('db:mysql start.');
    let pool = await this.createPool();
    return new Promise((resolve,reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                Err.log(Err.error_log_type.db, 'mysql connect fail.', err);
                return reject(Err.get(Err.db_fail,err));
            }else {
                console.log('db:mysql success.');
                this.connection = connection;
                return resolve(connection);
            }
        });
    })
};

cls.prototype.createPool = function () {
    if(dbs[this.server]) return dbs[this.server];

    return new Promise((resolve,reject) => {
        if (!mysqls || !this.server
            || !mysqls[this.server]
            || !mysqls[this.server].connection) {
            Err.log(Err.error_log_type.etc, 'read etc.db.mysql fail.');
            return reject(Err.get(Err.db_fail, null, 'mysql配置信息出错'));
        }

        let pool = mysql.createPool(mysqls[this.server].connection);
        if (!pool) {
            Err.log(Err.error_log_type.db, 'mysql createPool fail.');
            return reject(Err.get(Err.db_fail, null, 'mysql创建池出错'));
        } else {
            dbs[this.server] = pool;
            resolve(pool);
        }
    });
};

cls.prototype.disConnect = function () {
    if(this.connection) {
        this.connection.release();
        this.connection = null;
    }
};

/**
 * 执行sql语句
 * @param sql ｜必须｜string｜sql语句
 * @param connecting ｜非必须｜boolean｜默认false：断开连接。
 * @returns {Promise}
 */
cls.prototype.exec = async function (sql,connecting) {
    let cnn = await this.init();

    return await new Promise((resolve, reject) => {
        if(this.is_log) console.log(sql);
        cnn.query(sql, (err, result) => {
            //if(!connecting) this.disConnect();//todo：大批量访问有问题，待优化
            if(err) {
                Err.log(Err.error_log_type.db,'mysql',sql,err);
                return reject(Err.get(Err.db_fail,err));
            }
            if(result && result.rows) result = result.rows;
            return resolve(result);
        })
    });
};

module.exports = cls;