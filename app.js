"use strict";

/**
 * 运行文件注释
 * 1. 添加了路由处理，可在 etc->route.js里设置， 具体看 tool/route 文件
 * 2. 处理了body数据分析，koa框架没有, 具体看 tool/body 文件
 * 3. 处理了运维配置（etc->env.js中指向的文件）
 */

module.exports = async function (root_path) {
    global.rootPath = (root_path || __dirname) + '/';

    const Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env'));
    const KoaLib = require('koa');
    const Koa = new KoaLib();
    const KoaRouterLib = require('koa-router');
    const KoaRouter = new KoaRouterLib();
    const Route = require('./tool/route');
    const KoaBody = require('koa-body');
    const Passport = require('./tool/passport');

////////// 1.处理路由中间键
    Koa.use(KoaBody({multipart: true}))
        .use(Passport.init(Koa))
        .use(Route.initAllow)
        .use(KoaRouter.routes())
        .use(Route.initError)
        .use(KoaRouter.allowedMethods());

////////// 2.读取路由配置
    Route.initPreFix(KoaRouter);
    Route.initMap(KoaRouter);

////////// 3.预启动项。除“启动服务”外，均可不要
    console.log('start,waiting...');
    return Promise.resolve().then(async () => {
        ///初始化数据库
        if(!Etc.db) return;
        await Promise.all(Object.keys(Etc.db).map(async db_type => {
            let dbs = Object.keys(Etc.db[db_type]);
            if(!dbs.length) return;

            const dbClass = require(`./db/${db_type}/base`);
            await Promise.all(dbs.map(async server => {
                let db = new dbClass('test',server);
                await db.init();
            }));
        }));

    }).then(async () => {
        ///初始化redis
        if (!Etc.redis) return;
        let redis = require('./tool/redis');
        await redis.init();
        await redis.set(['test:test:a'],'test',1000);

    }).then(() => {
        ///启动服务
        const port = Etc.http && Etc.http.port || '3003';
        Koa.listen(port, function () {
            console.log(`run at port ${port}, success!`);
        });

    }).then(() => {
        ///开启其他任务
        if(!Etc.task) return;
        let Task; try{Task = require('./tool/task');}catch(err){return;}
        return Promise.all(Object.keys(Task).map(async task_name => {
            let is_start = Etc.task.start || Etc.task[task_name];
            if(!is_start) return;
            await Task[task_name]();
            console.log(`Task [${task_name}] started.`);
        }));

    }).catch(err => {
        console.trace('run fail:\n',err);
        process.exit();
    });
};