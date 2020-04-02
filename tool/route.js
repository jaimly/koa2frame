'use strict';
/**
 * Created by Jesn on 2019/3/13.
 * 路由处理类
 */

const RouteConfig = require(global.rootPath + 'etc/route');
const Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env'));
const Err = require('./error');
const Body = require('./body');

class RouteClass {
    constructor () {
        this.is_log =  Etc.log && Etc.log.route;
    }
}

/**
 * 处理路由权限
 * @returns {*}
 */
RouteClass.prototype.initAllow = async function (ctx,next) {
    if(RouteConfig.allow && typeof RouteConfig.error == 'function') {
        let paths = await RouteConfig.allow(ctx), flag;
        if (paths) {
            paths.map(item => {
                if (ctx.originalUrl.indexOf(item) == 0) flag = true;
            });

            if (!flag) {
                ctx.response.body = Err.get(Err.permission_denied);
            }
        }
    }
    return next();
};

/**
 * 处理路由错误
 */
RouteClass.prototype.initError = async function (ctx,next) {
    if(ctx.response.status == 404) {
        let req = ctx.request;
        ctx.response.body = Err.get(Err.route_error, {
            method: req.method.toLowerCase(),
            host: req.headers.host,
            url: req.url,
            body: req.body
        });
    }

    if(RouteConfig.response && typeof RouteConfig.response == 'function') {
        await RouteConfig.response(ctx);
    }

    return next();
};

/**
 * 处理路由前缀
 */
RouteClass.prototype.initPreFix = async function (koaRouter) {
    if(RouteConfig.prefix) koaRouter.prefix(RouteConfig.prefix);
};

/**
 * 处理路由规则表
 */
RouteClass.prototype.initMap = async function (koaRouter) {
    if(!RouteConfig.map) return;

    Object.keys(RouteConfig.map).map(k => {
        let method = k.slice(0,k.indexOf('/')),
            url = k.replace(method,'');

        koaRouter[method](url,async (ctx, next) => {
            let back,val = routeHandler(ctx,RouteConfig.map[k]),start_time = Date.now();
            if(this.is_log) console.log(method + '  ' + url+'; route:'+ val);

            try {
                let body = new Body(ctx, val);//不要写在use里，否则路由出错，会返回body的数据
                back = await body.runFunction();
                switch (ctx.type) {
                    case Body.mimes.json:
                        if (back === undefined || back === null) back = Err.ok;
                        else if (isNaN(back.ok)) back = Err.get(Err.ok, back);
                        break;
                }
            } catch (err) {
                back = Err.get(err);
            }

            if(back) ctx.response.body = back;

            let during_time = Date.now() - start_time,
                req = ctx.request;
            if(Etc.http.timeout && during_time > Etc.http.timeout)
                Err.log(Err.error_log_type.route, `接口响应超过${Etc.http.timeout}毫秒:${during_time}`, {
                    method,
                    host: req.headers.host,
                    url: req.url,
                    body: req.body
                });

            return next();
        })
    });
};

/**
 * 获取真实路由地址
 * @param ctx
 * @param rt
 * @returns {*}
 */
function routeHandler(ctx,rt) {
    if(typeof rt == 'function') rt = rt(ctx.params);
    //替换变量
    let param;
    Object.keys(ctx.params).map(k => {
        param = ctx.params[k];
        if(k == 0) rt += param;
        rt = rt.replace(new RegExp(':'+k,'g'),param);
    });

    return rt;
}

module.exports = new RouteClass();