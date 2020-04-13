'use strict';
/**
 * Created by Jesn on 2018/9/14.
 * http请求
 */

const Request = require('request'),
    Iconv = require("iconv-lite"),
    Err = require('../tool/error'),
    Ut = require('../tool/utils'),
    Etc = Ut.getEtc();

class cls {
    constructor (name,timeout) {
        name = name || 'self';
        let info = Etc.external && Etc.external[name] || {};
        if(info.constructor != Object) {
            if(info.constructor == String) info = {url:info};
            else {
                Err.log(Err.error_log_type.etc,`external中${name}配置出错`);
                info = {};
            }
        }

        this.name = name;
        this.server = info.url || (`http://localhost:${Etc.http && Etc.http.port || 3003}`);
        this.timeout = timeout;
        this.is_log = Etc.log && Etc.log.external;
        this.jwt = info.jwt;
        this.info = info;
    }
}

cls.prototype.post = function(api, body, query, back_format, err_msg) {
    return this.request('post',api,{body,query}, back_format, err_msg);
};

cls.prototype.get = function(api, query, back_format, err_msg) {
    return this.request('get',api,{query}, back_format, err_msg);
};

/**
 * 请求实体
 * @param method |必须|string|方法
 * @param api |必须|string|接口路径，不包括域名
 * @param info |非必须|object|传入参数
 * @param back_format |非必须|string|返回的数据格式，默认json。若为json，解释不了，会报错。
 * @param err_msg |非必须|string|返回的错误信息。默认返回“外部服务器访问出错”
 * @returns {Promise}
 */
cls.prototype.request = async function (method,api,info,back_format, err_msg) {
    /////// 处理空白值
    if(info){
        Object.keys(info).map(i => {
            let opt = info[i];
            if(!opt && opt != 0) delete info[i];
            if(!opt) return;

            Object.keys(opt).map(j => {
                let item = opt[j];
                if(!item && item != 0) delete opt[j];
            });
        })
    }

    let main = this,
        query = info.query,
        body = info.body,
        params_headers = info.headers,
        encoding = info.encoding,
        url = main.getUrl(api,query);

    if(!url) return Promise.reject(main.getBackInfo({res:{statusCode:500}},url,null,null,err_msg));

    if(this.is_log) console.log(`【${(method || 'get').toUpperCase()}】:${url}`);
    if(body && this.is_log) console.log('form:',body);

    let headers;
    if (params_headers) {
        headers = {};
        for (let j in params_headers) {
            headers[j] = params_headers[j];
        }
        if (body) delete body.headers;
        if (query) delete query.headers;
    }

    if(this.jwt) {
        let jwt_copy = Ut.copy(this.jwt),
            iss = jwt_copy.key,
            secret = jwt_copy.secret;
        delete jwt_copy.key;
        delete jwt_copy.secret;

        if(!iss || !secret) {
            return Promise.reject(Err.get(Err.etc_config,'key和secret是必须的','jwt配置出错'));
        }

        let token;
        try {
            const jwt = require('jsonwebtoken');
            token = jwt.sign({iss},secret,jwt_copy);
        }catch(err) {
            Err.log(Err.error_log_type.etc,'jwt配置出错',err);
            return Promise.reject(Err.get(Err.etc_config,null,'jwt配置出错'));
        }

        if(token) {
            headers = headers || {};
            headers.Authorization = 'Bearer ' + token;
        }
    }

    if(this.is_log && headers) console.log('headers:' , headers);

    let option = {
        encoding: encoding ? (encoding == 'gb2312' ? null : encoding) : undefined,
        url,
        headers,
        method,
        timeout:main.timeout,
        form: (body && body.constructor == Object) ? body : null,
        body: (body && body.constructor == String) ? body : null
    };

    return await new Promise((resolve,reject) => {
        let start_time = Date.now();
        Request(option, function (err, res, msg) {

            let during_time = Date.now() - start_time,
                timeout_time = (Etc.http.timeout || 5010) - 20;
            if(!main.timeout && (during_time > timeout_time))
                Err.log(Err.error_log_type.http,`接口响应超过${timeout_time}毫秒:${during_time}`,url);

            if(encoding && msg) msg = Iconv.decode(msg, encoding).toString();
            let back = main.getBackInfo({err,res,msg},url,body,back_format,err_msg);
            if(back.ok == 0) return resolve(back.data);
            else reject(back);
        });
    });
};

cls.prototype.getUrl = function(api,params) {
    let url = this.server + api,flag;

    if(params) {
        Object.keys(params).map(i => {
            let param = params[i];
            if (!Ut.isValue(param)) return;

            if (Ut.getRegExp('chinese').test(param) || Ut.getRegExp('url').test(param)) {
                param = encodeURIComponent(param);
            }

            url = url + (flag ? '&' : '?') + i + '=' + param;
            flag = true;
        });
    }

    return url;
};

cls.prototype.getBackInfo = function (info,url,body,back_format,err_msg) {
    if(this.is_log && info.msg && info.msg.length < 500000) console.log('【EXTERNAL BACK】:',info.msg);

    let err = info.err,
        res = info.res,
        detail = {error: err, url: url, body: body, msg: info.msg};

    if (err || (res && res.statusCode != 200)) {
        if (res && res.statusCode) {
            if(res.statusCode == 401) return Err.not_signed;
            else detail.statusCode = res.statusCode;
        }

        let err_info = Ut.copy(Err.request_external_fail);
        if(err_msg) {
            detail.msg = err_info.msg;
            err_info.msg = err_msg;
        }

        Err.log(Err.error_log_type.http, `状态码:${res && res.statusCode || 'none'}`, url, err);
        return Err.get(err_info, detail);
    }

    ////// json处理
    let msg;
    if(info.msg && info.msg.constructor === String && (!back_format || back_format == 'json')) {
        try {
            msg = JSON.parse(info.msg);
        } catch (err) {
            Err.log(Err.error_log_type.http, '返回数据格式不是json', url, err);
            return Err.get(Err.external_no_msg, detail);
        }
    }

    if(!msg) msg = info.msg;
    if(!Ut.isValue(msg) || msg.constructor !== Object) return Err.get(Err.ok,msg);

    msg.ok = isNaN(msg.ok) ? msg.code : msg.ok;
    delete msg.code;
    msg.ok = isNaN(msg.ok) ? msg.ret : msg.ok;
    delete msg.ret;

    if (msg.ok == 98 || msg.ok == -111 || msg.ok == -110) return Err.not_signed;

    msg.msg = msg.msg || msg.message || '';
    delete msg.message;

    if(!msg.data && (msg.data != 0)){
        msg.data = {};
        Object.keys(msg).map(i => {
            if(i != 'ok' && i != 'msg' && i != 'data'){
                msg.data[i] = msg[i];
                delete msg[i];
            }
        });
    }

    if(!Ut.isValue(msg.ok)) return Err.get(Err.ok,msg.data);
    return msg;
};

module.exports = cls;