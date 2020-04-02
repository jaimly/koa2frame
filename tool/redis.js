"use strict";
/**
 * Created by Jesn on 2019/3/12.
 * Redis 数据缓存处理
 */

const Redis = require('ioredis'),
    crypto = require('crypto'),
    Err = require('../tool/error'),
    Ut = require('../tool/utils'),
    Etc = Ut.getEtc();

class RedisClass {
    constructor() {
        let config = Etc.redis;
        this.is_log = Etc.log && Etc.log.redis;

        switch (config && config.constructor) {
            case Object:
                this.client = new Redis(config);
                break;
            case Array:
                this.client = new Redis.Cluster(config);
        }
    }

    init() {
        return new Promise((resolve,reject) => {
            this.client.on('ready',() => {
                console.log('redis connect success.');
                return resolve(this);
            }).on('connect', () => {
                console.log('redis connect start.');
            }).on('error', err => {
                Err.log(Err.error_log_type.etc,'redis连接出错:error',err);
                return reject(err);
            }).on('close', err => {
                Err.log(Err.error_log_type.etc,'redis连接出错:close',err);
                return reject(err);
            });
        });
    }

    isStatus () {
        return Boolean(this.client && this.client.status == 'ready');
    }
}

/**
 * 获取值
 * @param key ｜string/array｜必须｜获取值的唯一标识。若为 array，即使用 this.getKey 方法
 * @param hash_key ｜string｜非必须｜该值存在，获取 hash 对应 key值
 * @param get_value_function ｜promise｜非必须｜若没有值，获取值的方法
 * @param expire ｜当get_value_function 存在时有效，参照 set 方法
 * @returns {*} 如果是 json 格式，即使用 JSON.parse 转换
 */
RedisClass.prototype.get = async function (key, hash_key, get_value_function, expire) {
    if(!key) return null;
    if(!this.isStatus()) {
        if(get_value_function) return await get_value_function();
        else return null;
    }

    if (key.constructor == Array) key = key.map(item => {
        return this.getKey(item);
    }).join(':');
    if(hash_key && hash_key.constructor == Object) {
        hash_key = this.getKey(hash_key);
    }

    let promise;
    if(hash_key === '*') {
        if(this.is_log) console.log('【Redis hgetall】:',key);
        promise = this.client.hgetall(key).then(res => {
            return (res && Object.keys(res).length) ? res : null;
        });
    }else if(hash_key) {
        if(this.is_log) console.log('【Redis hget】:',key,hash_key);
        promise = this.client.hget(key,hash_key);
    }else {
        if(this.is_log) console.log('【Redis get】:',key);
        promise = this.client.get(key);
    }

    let val = await promise.catch(err => {
        Err.log(Err.error_log_type.redis, 'redis读取错误', err);
    });
    if(this.is_log) console.log(val);

    if (Ut.isValue(val) || !get_value_function) {
        if(hash_key != '*') return parseJson(val);

        if(val && val.constructor == Object) {
            Object.keys(val).map(k => {
                val[k] = parseJson(val[k]);
            });
        }
        return val;
    }

    val = await get_value_function();
    if(hash_key !== '*') this.set(key,val,expire,hash_key);
    else this.setMulti(val,key,expire,true);
    return val;

    function parseJson(json) {
        try {
            return JSON.parse(json);
        } catch (err) {
            return json;
        }
    }
};

/**
 * 设置值
 * @param key ｜string/array｜必须｜获取值的唯一标识。若为 array，即使用 this.getKey 方法
 * @param val ｜*｜非必须｜值。当存在时，重设值；当不存在时，清除缓存
 * @param expire ｜number（毫秒）｜非必须｜设置值的超时时间。默认永久储存
 * @param hash_key ｜string｜非必须｜该值存在，即使用 hash 存储策略：hset
 */
RedisClass.prototype.set = async function (key, val, expire, hash_key) {
    if(!this.isStatus() || !key) return;
    if(key.constructor == Array) key = key.map(item => {
        return this.getKey(item);
    }).join(':');
    if(hash_key && hash_key.constructor == Object) {
        hash_key = this.getKey(hash_key);
    }

    if(!Ut.isValue(val)) {
        if(!hash_key) return this.client.del(key);
        return this.client.hdel(key,hash_key);
    }
    switch (val.constructor) {
        case Object:
        case Array:
            val = JSON.stringify(val);
            break;
        default:
            val = val.toString();
    }

    if(this.is_log) console.log('【Redis set】:',key,hash_key || '',`\n${val}\nexpire: ${expire}`);
    await (hash_key ? this.client.hset(key,hash_key,val) : this.client.set(key,val)).catch(err => {
        Err.log(Err.error_log_type.redis,'redis写入错误',err);
    });
    if(expire && expire.constructor == Number && expire > 0) {
        await this.client.expire(key,expire/1000);
    }
};

/**
 * 批量设置值
 * @param obj ｜object｜必须｜｛key:value｝
 * @param pre_key ｜非必须｜参考 set 方法中的 key
 * @param expire ｜参考 set 方法
 * @param is_hash ｜boolean｜是否设置 hash 值。若是，obj里的key为hash的key
 */
RedisClass.prototype.setMulti = async function (obj,pre_key,expire,is_hash) {
    await Promise.all(Object.keys(obj).map(async k => {
        if(is_hash && pre_key) {
            await this.set(pre_key,obj[k],expire,k);
        }else if(!is_hash) {
            let val = obj[k];
            if(pre_key) {
                if(pre_key.constructor != Array) k = [pre_key,k];
                else k = pre_key.concat([k]);
            }
            await this.set(k,val,expire);
        }
    }));
};

/**
 * 组合key。
 * param 只支持 string/object ，使用":"连接
 * 1. object 类型: 1).Md5( String( key1=val2&key2=val2 ).sort() ).slice( 8, -8 )
 * 2. string 类型：不作修改
 * @returns {string}
 */
RedisClass.prototype.getKey = function () {
    return Object.values(arguments).map(item => {
        if(!Ut.isValue(item)) return '';

        switch (item.constructor) {
            case Object:
                return crypto.createHash('md5').update(Ut.noRepeat(Object.keys(item).sort().map(k => {
                    if(Ut.isValue(item[k])) return k + '=' + item[k];
                })).join('&')).digest('hex').slice(8,-8);
            case String:
                return item;
        }
    }).join(':');
};

/**
 * 清除同一目录下的缓存:(集群不支持)
 * @param head
 */
RedisClass.prototype.deleteMulti = async function (head) {
    if(!this.isStatus() || !head || head.constructor != String) return;

    (await this.client.keys(`${head}:*`)).map(key => {
        this.set(key);
    });
};

module.exports = new RedisClass();