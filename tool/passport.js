'use strict';
/**
 * Created by Jesn on 2019/10/24.
 * passport 初始化类
 */


const passport = require('koa-passport'),
    LocalStrategy = require('passport-local'),
    session = require("koa-session2"),
    Err = require('./error');

const Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env')),
    Config = Etc.middle && Etc.middle.passport;

const is_connect_data = false;

function init(koa) {
    if(Config && koa) {
        // serializeUser 在用户登录验证成功以后将会把用户的数据存储到 session 中
        passport.serializeUser(function (user, done) {
            done(null, user)
        });

        // deserializeUser 在每次请求的时候将从 session 中读取用户对象
        passport.deserializeUser(function (user, done) {
            return done(null, user)
        });

        koa.keys = ['secret'];
        koa.use(session({key: Config.session_key || 'sess'}, koa))
            .use(passport.initialize())
            .use(passport.session());
    }

    return function (ctx,next){
        ctx.authenticate = authenticate;
        return next()
    };
}

function connectDate() {
    if(is_connect_data) return;
    // 用户名密码验证策略
    if(Config.local) {
        let func = Config.local.split('.');
        try {
            let file = require(`${global.rootPath}/${func[0]}`);
            passport.use(new LocalStrategy(file[func[1]]));
        }catch(err){
            Err.get(Err.etc_config,'middle.passport.local');
        }
    }
}

function authenticate(ctx) {
    ctx = ctx || this;
    connectDate(ctx);
    return new Promise((resolve,reject) => {
        if(!Config) return reject(Err.get(Err.etc_config,'middle.passport'));
        passport.authenticate('local', async function (err, user, info, status) {
            if(err) return reject(err);
            await ctx.login(user);
            return resolve(user);
        })(ctx);
    });
}

module.exports = {init,authenticate,passport};