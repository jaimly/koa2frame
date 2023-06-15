'use strict';
/**
 * Created by Jesn on 2019/3/14.
 * 处理了函数运行与html返回
 * 处理了函数settings配置：参数与预处理
 */

const Err = require('./error');
const Ut = require('./utils');
const Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env'));
const RouteConfig = require(global.rootPath + 'etc/route');
const qs = require('qs');
const Path = require('path');
const fs = require('fs');

class BodyClass {
    constructor (ctx,val) {
        this.ctx = ctx;
        this.val = val;
        this.is_log =  Etc.log && Etc.log.route;
        this.init();
        this.initJwt();
        this.initRender();
    }
}

BodyClass.prototype.init = function () {
    let ctx = this.ctx;
    ctx.body = ctx.request.body;
    ctx.request.query = qs.parse(ctx.request.querystring,{arrayLimit:200});//兼容 id[0]=a&id[1]=b 格式
    if(ctx.request.files) ctx.body.files = ctx.request.files;
};

BodyClass.prototype.initRender = function () {
    try {
        const Template = require('art-template');
        let ctx = this.ctx;
        ctx.render = function (filename, data) {
            ctx.type = BodyClass.mimes.html;
            return Template(global.rootPath + filename,data);
        };
    }catch(err) {}
};

BodyClass.prototype.initJwt = function () {
    let etc_jwt = Etc.middle && Etc.middle.jwt;
    if(!etc_jwt) return;

    try {
        const jwt = require('jsonwebtoken');

        let ctx = this.ctx,
            authorization = ctx.headers['authorization'],
            jwt_code = (authorization && authorization.split(' ')[1])
                || (etc_jwt.key && ctx.query[etc_jwt.key]);
        if(jwt_code) {
            ctx.request.jwt = jwt_code;
            ctx.jwt = jwt.decode(jwt_code);
        }
    }catch(err) {}
};

/**
 * 运行对应函数.
 * 对settings属性进行处理，非必须
 * 1. params ｜object｜非必须｜参数设置
 * 2. pretreatment ｜object｜非必须｜预处理设置
 * @returns {*}
 */
BodyClass.prototype.runFunction = async function () {
    let ctx = this.ctx,
        val = this.val,
        path = val.slice(0,val.lastIndexOf('/')),
        file,func;

    //////找到对应文件函数
    try {
        let full_path = global.rootPath + val;
        if((Path.extname( ctx.url ) == '.art') || fs.existsSync(`${full_path}.art`))
            return ctx.render(this.val,{});

        val = camelCase(val);
        path = val.slice(0,val.lastIndexOf('/'));
        if(!fs.existsSync(`${global.rootPath + path}.js`))
            return this.runResource();

        let func_name = val.slice(val.lastIndexOf('/')+1);
        file = require(global.rootPath + path);
        func = file[func_name];
        Boolean(file.constructor && func.constructor);
    }catch (err) {
        if(this.is_log) console.trace(err);
        ctx.response.status = 404;
        return Promise.reject(Err.get(Err.route_error,err));
    }

    //////settings 处理
    let settings = func.settings;
    if(settings) {
        //1. 参数验证
        let params = settings.params;
        if(params) {
            let verify = this.verifyParams(settings.params);
            if (verify) return verify;
        }

        //2. 预处理函数
        let pretreatment = settings.pretreatment,
            preFunc = RouteConfig.pretreatment;
        if (preFunc && typeof preFunc == 'function' && (!pretreatment || !pretreatment.not_do)) {
            await preFunc(ctx,pretreatment && pretreatment.params);
        }
    }

    //////运行函数
    return await func(ctx);
};

/**
 * 使用tv4格式验证参数
 * @param schema ｛is_filter:false,query:{},body:{}｝
 * is_filter 是否根据该schema过滤掉多余参数，只过滤第一层
 * query、body ctx中值的tv4验证格式
 * @returns {*}
 */
BodyClass.prototype.verifyParams = function (schema) {
    let Tv4;
    try {Tv4 = require('tv4');}catch(err) {return;}

    schema = Ut.copy(schema);
    if(!schema) return;

    let is_filter = schema.is_filter;
    if(is_filter) delete schema.is_filter;

    let flag,errors = {};
    Object.keys(schema).map(k => {
        let data = this.ctx.request[k];
        if(!data) return;

        let format = schema[k];
        if(is_filter) {
            let properties = format.properties;
            Object.keys(data).map(l => {
                if(!properties[l]) delete data[l];
            });
        }

        let result = Tv4.validateMultiple(data,format);
        if(!result.valid) {
            flag = true;
            errors[k] = result.errors.map(error => {
                return {
                    path: error.dataPath,
                    msg: error.message,
                    detail: error.params
                };
            });
        }
    });

    if(flag) return Err.get(Err.parameter_error,errors);
};

BodyClass.prototype.runResource = function () {
    let ctx = this.ctx,
        ext = Path.extname( ctx.url );
    ext = ext ?  ext.slice(1) : 'unknown';

    let content = fs.readFileSync(global.rootPath + this.val, 'binary');
    ctx.type = BodyClass.mimes[ ext ];
    ctx.res.writeHead(200);
    ctx.res.write(content, 'binary');
    ctx.res.end();
};

BodyClass.mimes = {
    'css': 'text/css',
    'less': 'text/css',
    'gif': 'image/gif',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'js': 'text/javascript',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'swf': 'application/x-shockwave-flash',
    'tiff': 'image/tiff',
    'txt': 'text/plain',
    'wav': 'audio/x-wav',
    'wma': 'audio/x-ms-wma',
    'wmv': 'video/x-ms-wmv',
    'xml': 'text/xml'
};

function camelCase(url) {
    //驼峰处理
    if(url.match(/_/) || url.match(/-/)) {
        let str = '', i, s, flag;
        for (i = 0; i < url.length; i++) {
            s = url[i];
            if (s == '_' || s == '-') {
                flag = true;
                continue
            }
            else if (flag) {
                s = s.toUpperCase();
                flag = false;
            }

            str += s;
        }

        url = str;
    }

    return url;
}

module.exports = BodyClass;