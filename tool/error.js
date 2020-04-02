'use strict';

const fs = require('fs'),
    Winston = require('winston'),
    Ut = require('./utils'),
    Etc = require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env')),
    EtcLog = Etc.log && Etc.log.error,
    is_console_log = EtcLog && EtcLog.console,
    is_subscribe =  EtcLog && EtcLog.subscribe;

class ErrorClass{
    constructor () {
        this.error_log_type = {
            info: '操作',
            route: '路由', //路由出错
            db: '数据库', //数据库出错
            redis: 'redis',//缓存出错
            http: '外部请求', //http请求出错
            data_type: '数据格式', //数据格式
            etc: 'etc配置', //配置格式
            undefined: '代码' //未知类型
        };

        this.ok = {
            ok: 0,
            msg: 'success'
        };
        this.field_required = {
            ok: 1,
            msg: '参数必须'
        };
        this.parameter_error = {
            ok: 2,
            msg: '参数错误'
        };
        this.saved_failure = {
            ok: 3,
            msg: '保存失败'
        };
        this.update_failure = {
            ok: 4,
            msg: '更新失败'
        };
        this.no_records_found = {
            ok: 5,
            msg: '找不到记录'
        };
        this.insert_failure = {
            ok: 6,
            msg: '插入失败'
        };
        this.invalid_type = {
            ok: 7,
            msg: '无效数据类型'
        };
        this.upload_failure = {
            ok: 8,
            msg: '上传失败'
        };
        this.delete_failure = {
            ok: 9,
            msg: '删除失败'
        };
        this.sensitive_words = {
            ok: 10,
            msg: '含有敏感词汇'
        };
        this.submitted = {
            ok: 11,
            msg: '已提交审核'
        };
        this.export_failure = {
            ok: 12,
            msg: '导出失败'
        };
        this.record_referred = {
            ok: 13,
            msg: '记录已存在'
        };
        this.relation_not_exist = {
            ok: 14,
            msg: '关系记录不存在'
        };
        this.rate_limit = {
            ok: 15,
            msg: '请求速率受限'
        };
        this.replace_upgrade_exist = {
            ok: 16,
            msg: '已经替换升级记录'
        };
        this.illegal_token = {
            ok: 17,
            msg: 'token不合法'
        };
        this.permission_denied = {
            ok: 18,
            msg: '您没有访问权限哦～！'
        };
        this.token_failed = {
            ok: 19,
            msg: '获取token失败'
        };
        this.db_fail = {
            ok: 20,
            msg: '数据库访问出错'
        };
        this.request_external_fail = {
            ok: 21,
            msg: '访问外部服务器出错'
        };
        this.external_no_msg = {
            ok: 22,
            msg: '解析外部返回数据出错'
        };
        this.no_update_data = {
            ok: 23,
            msg: '没有更新的内容'
        };
        this.no_session = {
            ok: 24,
            msg: '没有session'
        };
        this.external_no_body = {
            ok: 25,
            msg: '请求外部参数错误'
        };
        this.create_thumb_fail = {
            ok: 26,
            msg: '生成缩略图失败'
        };
        this.no_relation = {
            ok: 27,
            msg: '没有相关资源'
        };
        this.create_dib_page_fail = {
            ok: 28,
            msg: '创建dib内页失败'
        };
        this.limit_length = {
            ok : 29,
            msg : '名称长度超出最大值'
        };
        this.import_data_error = {
            ok : 30,
            msg : '导入数据解析出错'
        };
        this.not_support = {
            ok : 31,
            msg: '不支持文件类型'
        };
        this.limit_upload_size = {
            ok : 32,
            msg : '超出上传总量'
        };
        this.no_app = {
            ok : 33,
            msg : '平台不存在该应用'
        };
        //50-70:文件
        this.xml_parse_fail = {
            ok: 50,
            msg: 'xml解析出错'
        };
        this.excel_parse_fail = {
            ok: 51,
            msg: 'excel解析出错'
        };
        this.unknown_err_type = {
            ok: 100,
            msg: '发生未知错误，请联系技术人员',
            type: this.error_log_type.undefined
        };
        this.login_failure = {
            ok: 99,
            msg: '登录失败'
        };
        this.not_signed = {
            ok: 98,
            code: 98,
            msg: '未登录'
        };
        this.ban_signed = {
            ok: 97,
            msg: '禁止登录'
        };
        this.ban_visit_function = {
            ok: 96,
            msg: '禁止访问此功能'
        };
        this.not_platform_request = {
            ok: 80,
            msg: '非平台访问'
        };
        this.no_education_bureau = {
            ok: 101,
            msg: '没有教育局信息'
        };
        this.no_school = {
            ok: 102,
            msg: '没有学校信息'
        };
        this.no_control_school = {
            ok: 103,
            msg: '没有相关管辖学校'
        };
        this.no_grade = {
            ok: 104,
            msg: '没有年级信息'
        };
        this.no_class = {
            ok: 105,
            msg: '没有班级信息'
        };
        this.no_user = {
            ok: 106,
            msg: '用户不存在～！'
        };
        this.no_teacher = {
            ok: 107,
            msg: '没有教师信息'
        };
        this.no_student = {
            ok: 108,
            msg: '没有学生信息'
        };
        this.no_institution = {
            ok: 109,
            msg: '没有机构信息'
        };
        this.no_customer = {
            ok: 110,
            msg: '没有客户信息'
        };
        this.missing_info = {
            ok: 111,
            msg: '用户信息缺失'
        };
        this.admin_user = {
            ok: 112,
            msg: '管理员同志，请去管理后台登录哦！'
        };
        this.verify_fail = {
            ok: 113,
            msg: '账号认证失败～！'
        };
        this.mobile_exists = {
            ok: 114,
            msg: '手机号被他人使用，请更换手机号！'
        };
        this.email_exists = {
            ok: 115,
            msg: '邮箱被他人使用，请更换邮箱！'
        };
        this.user_expire = {
            ok: 115,
            msg: '您的账号已过期～！'
        };
        this.external_insert_user_fail = {
            ok: 116,
            msg: '外部用户系统创建用户失败！'
        };
        this.normal_user = {
            ok: 117,
            msg: '请在平台正常入口登录哦！'
        };
        this.error_html = {
            no_error_html: '错误页面找不到，请与东田资源平台工作人员联系',
            no_html: '页面找不到~!'
        };
        this.route_error = {
            ok: 404,
            msg: '地址不存在',
            type: this.error_log_type.route
        };
        this.etc_config = {
            ok: 500,
            msg: '基础配置出错，请联系运维人员',
            type: this.error_log_type.etc
        };
        this.redis_get = {
            ok: 501,
            msg: '读取redis出错，请联系运维人员'
        };
        this.redis_set = {
            ok: 502,
            msg: '写入redis出错，请联系运维人员'
        };
    }

    get (conf,data,msg) {
        let type,info = {};

        if(conf && conf.constructor == Object) {
            info = Ut.copy(conf);
            type = info.type;
            delete info.type;
        }

        if(msg && msg.constructor == String) info.msg = msg;

        if(isNaN(info.ok)){
            this.log(null,conf,data,msg);
            info = {
                ok: this.unknown_err_type.ok,
                msg: info.msg || (conf && conf.constructor == String && conf) || this.unknown_err_type.msg,
                detail: conf
            };
        }else if(type) {
            this.log(type,info,data,`other_msg：${msg}`);
        }

        if(data === undefined || data === null) return info;

        info.data = data;
        return info;
    }

    /**
     * 错误日志
     * @param type ｜必须｜string｜错误类型。来源 this.error_log_type
     * @param arguments | 必须｜string｜多个错误参数信息
     */
    log (type) {
        if(Object.values(this.error_log_type).indexOf(type) < 0)
            type = this.error_log_type.undefined;

        if(is_console_log) console.log(`【${type} Error Log】 start:`);
        let msg = '';

        Object.keys(arguments).map(i => {
            if(i == '0') return;

            let arg = arguments[i];
            if(arg && arg instanceof Error) if(is_console_log) console.trace(arg);
            if(is_console_log) console.log(arg);

            if(arg) {
                if(!arg.constructor && (typeof arg == 'object')) arg = Object.assign({},arg);
                arg = (arg.constructor === Object) ? JSON.stringify(arg) : arg.toString();
            }
            msg += ((msg?', ':'') + arg);
        });
        if(is_console_log) console.log(`【${type} Error Log】 end:`);

        let time = Ut.getDate().format('yyyy-MM-dd hh:mm:ss'),
            is_warn = Boolean([this.error_log_type.route,this.error_log_type.redis].indexOf(type) > -1),
            level = (type == this.error_log_type.info)
                ? 'info'
                : (is_warn?'warn':'error'),
            winston_msg = {
                timestamp: time,
                level,
                type,
                message: msg
            };

        //写入错误日志文件
        switch (EtcLog.storage) {
            default:
                Winston.createLogger({
                    transports: [
                        new Winston.transports.File({ filename: 'log/error.log'})
                    ]
                }).log(winston_msg);
        }

        //推送信息
        if(is_subscribe) {
            let info = EtcLog.subscribe.info || {};
            switch (EtcLog.subscribe.type) {
                case 'es':
                    const Es = require('../external/es');
                    Es.send(Object.assign(winston_msg,info));
                    break;
            }
        }
    }
}

module.exports = new ErrorClass();