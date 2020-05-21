"use strict";

/**
 * 运行文件注释
 * 1. 添加了路由处理，可在 etc->route.js里设置， 具体看 tool/route 文件
 * 2. 处理了body数据分析，koa框架没有, 具体看 tool/body 文件
 * 3. 处理了运维配置（etc->env.js中指向的文件）
 */

const Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env')),
    KoaLib = require('koa'),
    Koa = new KoaLib(),
    KoaRouterLib = require('koa-router'),
    KoaRouter = new KoaRouterLib(),
    Route = require('./tool/route'),
    KoaBody = require('koa-body'),
    Passport = require('./tool/passport'),
    port = Etc.http && Etc.http.port || '3003';

Route.init(KoaRouter);
Koa.use(KoaBody({multipart: true}))
    .use(Passport.init(Koa))
    .use(Route.initAllow)
    .use(KoaRouter.routes())
    .use(Route.initError)
    .use(KoaRouter.allowedMethods())
    .listen(port, function () {
        console.log(`run at port ${port}, success!`);
    });