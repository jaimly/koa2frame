'use strict';

/**
 * 此为项目配置参考文档，提供开发人员按需修改
 */

module.exports = {

    /**
     * 【必须】http协议配置
     * @param port ｜number｜必须｜端口
     * @param response_time ｜number｜非必须｜响应时间。若响应时间超过此时间，即写入日志。
     */
    http: {
        port: 3003,
        timeout: 5000
    },

    /**
     * 控制台打印日志
     * @param route ｜boolean｜非必须｜默认false。接收到的请求信息
     * @param db ｜boolean｜非必须｜默认false。数据库增删查改信息
     * @param redis ｜boolean｜非必须｜默认false。redis的写入写出信息
     * @param external ｜boolean｜非必须｜默认false。请求外部的信息
     * @param error ｜object｜非必须｜
     * @param error.console ｜boolean｜非必须｜控制台打印信息
     * @param error.storage ｜string｜非必须｜错误日志储存信息。默认file。目前只支持file
     * @param error.subscribe ｜object｜非必须｜推送信息
     * @param error.subscribe.type ｜string｜必须｜类型。目前支持 dingTalk、kafka(需要在package添加kafkajs库)
     * @param error.subscribe.access_token ｜string｜必须｜dingTalk专用
     * @param error.subscribe.topic ｜string｜必须｜kafka专用
     * @param error.subscribe.info ｜object｜非必须｜按类型所需要数据。
     * @param error.subscribe.info.title ｜object｜必须｜服务名称（应该标注不同环境）
     *
     */
    log: {
        route: true,
        db: true,
        redis: true,
        external: true,
        error: {
            console: true,
            storage: 'file',
            subscribe: {
                type: 'dingTalk',
                access_token: '***',
                topic: '***',
                info: {
                    title: '***'
                }
            }
        }
    },

    /**
     * 中间件配置
     * @param 目前只支持 passport
     * @param passport.session_key ｜string｜非必须｜session名
     * @param passport.local ｜string｜非必须｜对应的初始化方法
     */
    middle: {
        passport: {
            session_key: 'dt-session',
            local: 'domain/user.findOne'
        },
        jwt: {
            key: 'jwt'
        }
    },

    /**
     * 数据库配置
     * @param 支持 mongodb、mysql、oracle.若不需要全部，可在package.json中去除对应第三方库。
     * @param [数据库类型].[数据库名]  ｜object｜数据库名
     * @param [数据库类型].[数据库名].connection  ｜*｜连接信息，各种数据库格式如下。
     */
    db: {
        mongodb: {
            micro_application: {
                connection: 'mongodb://localhost:27017/micro_application'
            }
        },
        mysql: {
            micro_application: {
                connection: {
                    host: 'localhost',
                    port: '3306',
                    user: 'root',
                    password: 'root',
                    database: 'micro_application'
                }
            }
        },
        //oracle 需要根据不同系统来确认node的版本。可能需要多次调试。建议linux先由8.6.0开始；windows用10以上版本.
        oracle: {
            micro_application: {
                connection: {
                    user: 'root',
                    password: 'root',
                    connectString: 'localhost:1521/ORCL'
                }
            }
        }
    },

    /**
     * redis缓存配置。
     * * 支持数组，即集群。
     * @param host ｜string｜必须｜主机
     * @param port ｜number｜必须｜端口
     * @param password ｜string｜非必须｜密码
     * @param db ｜int｜非必须｜库下标，默认0。集群不能设置，均为0。
     * @param family ｜int（4/6）｜非必须｜4 (IPv4) or 6 (IPv6)
     */
    redis: {
        host: 'localhost',
        port: 6379,
        password: null,
        family: 4,
        db: 0
    },

    /**
     * 第三方请求
     * * 对应external文件夹中的类
     * @param self 第三方名称。
     * @param url ｜string｜必须｜第三方域名
     * @param jwt ｜object｜非必须｜jwt认证
     * @param jwt.key ｜string｜必须｜标志
     * @param jwt.secret ｜string｜必须｜密码
     * @param jwt.algorithm ｜string｜非必须｜默认: HS256
     */
    external: {
        self: {
            url: 'http://localhost:3003',
            jwt: {
                key: '***',
                secret: '***',
                algorithm: 'HS256'
            }
        },
        dingTalk: {
            url: 'https://oapi.dingtalk.com'
        },
        kafka: {
            url: 'localhost:9092'
        }
    },

    /**
     * 计划任务
     * * 对应tool/task.js
     * @param start  ｜boolean｜非必须｜全部任务是否启动。true：全部启动；false：全部不启动
     * @param [任务名]  ｜boolean｜非必须｜单个任务是否启动，key为task.js里的方法名。true：启动；false：不启动
     */
    task: {
        start: true,
        '[任务名]': false
    }
};