'use strict';

const Typeorm = require("typeorm"),
    EntitySchema = Typeorm.EntitySchema,
    Err = require('../../tool/error'),
    Ut = require('../../tool/utils'),
    Etc = Ut.getEtc(),
    DbConfig = Etc && Etc.db && Etc.db.typeorm,
    TYPE = 'typeorm',
    Fs = require('fs'),
    dbs = {};

class TypeormClass {
    constructor (name, schema, server, model, database) {
        if(schema && schema.constructor == String) {
            server = schema;
            schema = {};
        }
        if(!server && DbConfig) server = Object.keys(DbConfig)[0];
        if(!name || !server || !DbConfig) return;
        eval(`this.model = ${model} || class ${name} {
            constructor(...values) {
                const _this = this;
                Object.keys(schema).map((key,i) => {
                    _this[key] = values[i];
                });
            }
        }`);
        
        this.db_type = DbConfig[server].connection.type;
        this.server = server;
        this.name = name;
        this.schema = new EntitySchema(Object.assign({
            name,
            target: this.model
        }, schema));
        this.database = database;
        this.is_log = Etc.log && Etc.log.db;
    }

    /**
     * 创建初始化数据
     * keys ｜string｜列名，用逗号隔开｜'name,key'
     * models ｜array｜数据｜[`"a",1`,`"b",2`]
     */
    async initTable (keys,models) {
        if(!dbs[this.server] || !keys || !models || models.constructor != Array) return;
        const targets = await this.dbModel.find();
        if(targets.length) return;
    
        return this.connection.manager.query(`INSERT INTO ${this.name} (${keys}) VALUES (${
            models.join('),(')
        })`).catch(err => {
            return Promise.reject(Err.get(Err.insert_failure,err));
        })
    }
}

TypeormClass.init = async function () {
    return Promise.all(Object.keys(DbConfig).map(server => {
        return TypeormClass.connect(server);
    }));
};

TypeormClass.connect = async function(server) {
    if(!DbConfig || !DbConfig[server] || !DbConfig[server].connection) {
        Err.log(Err.error_log_type.etc, `read etc.db.${TYPE}.${server} fail.`);
        return Promise.reject(Err.get(Err.db_fail,null,`${TYPE}.${server} 配置信息出错`));
    }

    if(!dbs[server]) {
        console.log(`db:${TYPE}:${server} connect...`);
        const root_path = global.rootPath ? `${global.rootPath}db/typeorm/`: `${__dirname}/`,
            entities = Fs.readdirSync(root_path).map(file_name => {
                if(file_name.match(/base\.js/i)) return;
                const db_model = require(`${root_path}${file_name}`);
                if(!db_model.server || (db_model.server == server)) return db_model;
            }).filter(x => x);

        dbs[server] = await Typeorm.createConnection(
            Object.assign({
                database: this.database,
                entities: entities.map(item => {return item.schema;})
            }, DbConfig[server].connection)
        ).catch(err => {
            Err.log(Err.error_log_type.db,`db:${TYPE}:${server} 连接出错`,err);
            return Promise.reject(Err.get(Err.db_fail, err, `db:${TYPE}:${server} error.`));
        });
        console.log(`db:${TYPE}:${server} success.`);

        await Promise.all(entities.map(async entitie => {
            entitie.connection = dbs[server];
            entitie.dbModel = entitie.connection.getRepository(entitie.schema);
            entitie.dbModel.create = entitie.dbModel.save;
            entitie.dbModel.updateMany = entitie.dbModel.update;
            await entitie.initTable();
        }));
    }

    return dbs[server];
} 

module.exports = TypeormClass;