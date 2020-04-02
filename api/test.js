'use strict';
/**
 * Created by Jesn on 2018/9/19.
 * 参照文件
 */

const Base = require('./base');

class cls extends Base{
    constructor () {
        super();
    }
}

var instance = new cls();

cls.prototype.index = async function (ctx) {
    return {
        body: ctx.body,
        query: ctx.query,
        jwt: ctx.jwt
    }
};
cls.prototype.index.settings = {
    //参数设置
    params: {
        //是否根据该schema过滤掉多余参数，只过滤第一层
        is_filter: false,
        //对应ctx中的query值，使用tv4验证格式
        query: {
            "type": "object",
            "properties": {},
            "required":[]
        },
        //对应ctx中的body值，使用tv4验证格式
        body: {
            "type": "object",
            "properties": {},
            "required":[]
        }
    },

    //预处理设置
    pretreatment: {
        //当配置中有预处理函数，默认会调用。但这里可设置为不调用
        not_do: false,
        //预处理函数参数
        params: null
    }
};

module.exports = instance;