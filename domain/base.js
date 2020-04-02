'use strict';
/**
 * Created by Jesn on 2018/9/11.
 * 处理层共用方法
 */

const DbIndex = require('../db/index'),
    Ut = require('../tool/utils'),
    Err = require('../tool/error');

class cls {
    constructor(table_name) {
        this.DB = DbIndex.getDB(table_name);
        this.DbFunc = DbIndex.get(table_name);
        this.is_log = this.DB.is_log;
    }
}

cls.prototype.create = async function (opts,toFormatFunction) {
    if(this.is_log) console.log(`【DB create ${this.DB.name}】:\n`,opts);

    let data = await this.DbFunc.create(opts).catch(err => {
        if(err && err.name == 'ValidationError') {
            return Promise.reject(Err.get(Err.db_fail,err.errors));
        }else {
            return Promise.reject(Err.get(Err.insert_failure,err));
        }
    });

    return this[toFormatFunction || 'toDetailFormat'](data);
};

cls.prototype.delete = async function (condition) {
    condition = this.toCondition(condition);
    if(this.is_log) console.log(`【DB delete ${this.DB.name}】:\n`,condition);

    let data = await this.DbFunc.remove(condition);
    return data.n;
};

cls.prototype.updateById = async function (opts) {
    let _id = opts.id;
    delete opts.id;

    return await this.update({_id},opts);
};

cls.prototype.update = async function (condition,opts,no_updated_at) {
    condition = this.toCondition(condition);
    if(!no_updated_at) opts.updated_at = opts.updated_at || new Date().getTime();
    if(this.is_log) console.log(`【DB update ${this.DB.name}】:\n`,condition,`\n-----\n`,opts);

    let data = await this.DbFunc.updateMany(condition,opts);
    return data.n;
};

/**
 * 搜索前条件格式化
 * @param opts ｜必须｜object｜搜索条件
 * @param id_key  ｜非必须｜string｜id关键字
 * @param fuzzy_key ｜非必须｜array｜模糊搜索项
 */
cls.prototype.toCondition = function (opts,id_key,fuzzy_key) {
    let condition = {},value;
    Object.keys(opts).map(k => {
        value = opts[k];
        if(!Ut.isValue(value) || value === '') return;

        switch (k) {
            case 'id':
            case id_key+'_id':
                if(value.constructor == Array) value = {$in:value};
                condition._id = value;
                delete condition[k];
                break;
            case id_key+'_name':
            case 'keyword':
            case 'name':
                if(value == '') break;
                condition.name = value;
                if(k != 'name') delete condition[k];
                break;
            case 'created_start_time':
            case 'created_end_time':
            case 'updated_start_time':
            case 'updated_end_time':
                let db_key = k.split('_')[0] + '_at',
                    is_start = k.indexOf('start') >-1;

                condition[db_key] = condition[db_key] || {};
                condition[db_key][is_start?'$gte':'$lte'] = parseInt(value);
                delete condition[k];
                break;
            default:
                condition[k] = opts[k];
        }
    });

    if(fuzzy_key && fuzzy_key.length) {
        fuzzy_key.map(key => {
            value = condition[key];
            if (!value || value.constructor != String) return;

            let reg = Ut.getRegExp(Ut.trim(value));
            if(reg) condition[key] = {$regex: reg, $options: 'i'};
        });
    }

    return condition;
};

cls.prototype.count = function (opts) {
    let condition = this.toCondition(opts);
    if(this.is_log) console.log(`【DB count ${this.DB.name}】:\n`,condition);

    return this.DbFunc.countDocuments(condition);
};

/**
 * 获取列表
 * @param opts ｜必须｜object｜搜索条件
 * @param sort ｜非必须｜string｜排序
 * @param field  ｜非必须｜string｜返回参数
 * @param toFormatFunction ｜非必须｜string｜格式函数名。默认是 toListFormat
 * @returns *
 */
cls.prototype.list = async function (opts,sort,field,toFormatFunction) {
    opts = opts || {};

    let skip,limit,
        per_page = parseInt(opts.per_page),
        page = parseInt(opts.page);
    delete opts.per_page;
    delete opts.page;

    if(per_page && per_page > 0 && page > 0) {
        skip = per_page * ( page - 1 );
        limit = per_page;
    }

    let condition = this.toCondition(opts);
    if(this.is_log) console.log(`【DB list ${this.DB.name}】:\n`,condition);

    let data = await this.DbFunc.find(condition,field,{sort,skip,limit}),
        count = limit?(await this.count(condition)):data.length;

    return {
        total_count : count,
        rows: data.map(model => {
            return this[toFormatFunction || 'toListFormat'](model);
        })
    }
};

cls.prototype.detail = async function (id,toFormatFunction) {
    if(this.is_log) console.log(`【DB detail ${this.DB.name}】:\n`,id);

    let data = await this.DbFunc.findById(id);
    if(!data) return Promise.reject(Err.get(Err.no_records_found));

    return this[toFormatFunction || 'toDetailFormat'](data);
};

cls.prototype.toFormat = function (model) {
    if(!model) return;
    let is_arr = Boolean(model.constructor == Array);
    if(!is_arr) model = [model];

    model = model.map(item => {
        let info;
        try {info = item && item.toObject();}
        catch (err) {info = item || {};}

        if(info) {
            info.id = info._id && info._id.toString();
            delete info._id;
            delete info.__v;
        }

        return info;
    });

    if(is_arr) return model;
    return model[0];
};

cls.prototype.toListFormat = function (model) {
    if(!model) return;
    let is_arr = Boolean(model.constructor == Array);
    if(!is_arr) model = [model];

    model = model.map(item => {
        let info = this.toFormat(item);

        return {
            id: info.id || '',
            name: info.name || ''
        };
    });

    if(is_arr) return model;
    return model[0];
};

cls.prototype.toDetailFormat = function (model) {
    if(!model) return;
    let is_arr = Boolean(model.constructor == Array);
    if(!is_arr) model = [model];

    model = model.map(item => {
        return Object.assign(
            this.toFormat(item),
            this.toListFormat(item)
        );
    });

    if(is_arr) return model;
    return model[0];
};

module.exports = cls;