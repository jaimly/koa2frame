'use strict';

const Path = require('path');

class UtilsClass {
    constructor () {}
}

/**
 * 控制台打印模板
 * 参数：多个需要打印的项
 */
UtilsClass.prototype.log = function () {
    Object.keys(arguments).map(i => {
        console.log('-------------------------------',i);
        console.log(arguments[i]);
    })
};

/**
 * 替换字符
 * @param str
 * @param model
 * @returns {*}
 */
UtilsClass.prototype.render = function(str, model) {
    if(str && str.constructor == String) {
        Object.keys(model).map(k => {
            let re = new RegExp(`{${k}}`, "g");
            str = str.replace(re, model[k]);
        });
    }

    return str || '';
};

/**
 * 数组转换成object
 * @param arr array｜需要转换的数组
 * @param key string｜唯一值
 * @param children_key string｜子级合并
 * @returns {{}}
 */
UtilsClass.prototype.arrayToObject = function (arr,key,children_key) {
    let obj = {};

    if(!arr || arr.constructor != Array) return obj;

    key = key || 'id';
    if(key.constructor == String) key = [key];

    arr.map(it=>{
        let item = this.copy(it),
            key_str = '';

        key.map(k => {
            let value = this.getValue(item,k);
            if(value) key_str += ((key_str?'_':'') + value.toString());
        });

        if(key_str) obj[key_str] = item;

        if(children_key && item[children_key]) {
            Object.assign(obj,this.arrayToObject(item[children_key],key,children_key));
            delete item[children_key];
        }
    });

    return obj;
};

/**
 * 获取对象的值
 * @param opt ｜array、object｜必须｜对象
 * @param key ｜string、array｜必须｜键
 * @param val ｜*｜非必须｜值。若值一致，返回该对象。
 * @returns {*}
 */
UtilsClass.prototype.getValue = function (opt,key,val) {
    if(!opt || !key) return;

    switch (opt.constructor) {
        case Array:
            for(let i=0;i<opt.length;i++) {
                let item = opt[i];
                if(item && typeof item == 'object'){
                    let value = this.getValue(item,key,val);
                    if(value) return val?item:value;
                }
            }
            break;
        case Object:
        default:
            let ks = key.split('.'),temp;
            ks.map((kk,i) => {
                temp = opt && (opt[kk] || opt[kk.toString()]);
                if(i != ks.length-1 || !val) opt = temp;
                else if(temp != val) opt = null;
            });
            return opt;
    }
};

/**
 * 判断值的真实性。undefined、null、NaN 为 假， 其他都为 真
 * @param obj
 * @returns {boolean}
 */
UtilsClass.prototype.isValue = function(obj) {
    if(obj == undefined || obj == null) return false;
    else if(obj.constructor == Number && isNaN(obj)) return false;
    return true;
};

/**
 * 深复制
 * @param opt
 * @returns {*}
 */
UtilsClass.prototype.copy = function (opt) {
    if(!opt) return opt;

    switch (opt.constructor) {
        case Array:
            return opt.map(item => {
                return this.copy(item);
            });
        case Object:
            let list = {};
            Object.keys(opt).map(k => {
                list[k] = this.copy(opt[k]);
            });
            return list;
        default:
            return opt;
    }
};

/**
 * 去除重复,去除空子项
 * @param arr
 * @param key string、array｜对象数组中的key，key值全等才删除
 */
UtilsClass.prototype.noRepeat = function (arr,key) {
    if(!arr || arr.constructor !== Array) return arr;

    let rm_arr = [], i, j, m, n;

    for(i=0; i<arr.length; i++) {
        m = arr[i];
        if(!this.isValue(m)){
            rm_arr.push(i);continue;
        }

        for(j=i+1; j<arr.length; j++) {
            n = arr[j];

            if(m === n) {
                if(rm_arr.indexOf(j) < 0) rm_arr.push(j);
                continue;
            }

            if(key && m[key] && n && n[key]) {
                if(m[key] === n[key]) {
                    if(rm_arr.indexOf(j) < 0) rm_arr.push(j);
                    continue;
                }

                if(key.constructor == Array) {
                    let flag;
                    key.map(k => {
                        if(m[k] != n[k]) return flag = true;
                    });

                    if(!flag && rm_arr.indexOf(j) < 0) rm_arr.push(j);
                }
            }
        }
    }

    rm_arr.sort((a,b) => {return a>b?-1:1});

    rm_arr.map(item => {
        arr.splice(item,1);
    });

    return arr;
};

/**
 * 为数据转换格式 : //TODO:待优化，未可用
 * @param val 支持String,Array,Object,Number
 * @param model 支持 1.function(如String) 2.具体数据格式('') 3.数组([String,'']) 4.object({a:'',b:String})
 * @returns {*}
 */
UtilsClass.prototype.formatDataType = function(val,model){
    if(!model || !val) return val;

    let model_type = model.constructor;
    //如果传入的是函数，即整个数据放入函数处理
    if(model_type == Function) return model(val);

    let target;
    switch (typeof val){
        case 'array'://传入数据为数组
            return val.map((item,i) => {
                let type = (model_type == String?model:model[i]);
                if(type.constructor == Function) return type(item);
                else return type.constructor(item);
            });
        case 'object'://传入数据为数组
            target = {};
            Object.keys(val).map(i => {
                let type = (model_type == String?model:model[i]);
                if(type.constructor == Function) target[i] = type(val[i]);
                else target[i] = type.constructor(val[i]);
            });
            return target;
        case 'string'://传入数据为字符串
        case 'number'://传入数据为数字
            let type = (model_type == String?model:model[0]);
            return type(val);
        default:
            return val;
    }
};

/**
 * 获取一个时间的相关时间（星期一，星期日，下星期一等等）
 * @param time
 * @returns {Date}
 */
UtilsClass.prototype.getDate = function (time) {
    let info = time?new Date(time):new Date(),
        date = time?new Date(time):new Date(),
        one_day_time = 24*60*60*1000,
        one_week_time = 7*one_day_time;

    info.one_day = one_day_time;

    date.setHours(0, 0, 0, 0);
    info.day_start = date.getTime();
    info.tomorrow = info.day_start + one_day_time;
    info.day_end = info.tomorrow - 1;

    let weekday = date.getDay() || 7;
    date.setDate(date.getDate() - weekday + 1);
    info.monday = date.getTime();
    info.next_monday = info.monday + one_week_time;
    info.sunday = info.next_monday - one_day_time;
    info.format = function(fmt){
        let o = {
            "M+": info.getMonth() + 1, //月份
            "d+": info.getDate(), //日
            "h+": info.getHours(), //小时
            "m+": info.getMinutes(), //分
            "s+": info.getSeconds(), //秒
            "q+": Math.floor((info.getMonth() + 3) / 3), //季度
            "S": info.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)){
            fmt = fmt.replace(RegExp.$1, (info.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        Object.keys(o).map(k => {
            if (new RegExp(`(${k})`).test(fmt)){
                fmt = fmt.replace(
                    RegExp.$1,
                    (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))
                );
            }
        });

        return fmt;
    };

    return info;
};

UtilsClass.prototype.getEtc = function () {
    return require(global.rootPath + 'etc/'+require(global.rootPath + 'etc/env'));
};

/**
 * 获取文件路径
 * @returns {{root, etc: string, public: string, upload: string, customer: string}}
 */
UtilsClass.prototype.getFilePath = function() {
    let root_path = process.cwd(),
        public_path = root_path + '/public',
        modules_path = public_path + '/web_modules';

    return {
        root: root_path,
        etc: root_path + '/etc',
        public: public_path,
        upload: modules_path + '/upload',
        customer: modules_path + '/customer'
    }
};

UtilsClass.prototype.isAjax = function (router) {
    let headers = router.req.headers,
        xrw = headers['x-requested-with'] && headers['x-requested-with'].toLowerCase();

    return (xrw && xrw == 'xmlhttprequest')//web
        || (xrw && xrw.indexOf('flash') > -1)//flash
        || (headers['accept'] && (headers['accept'].match(/\/json/)))//web
        || (headers['content-type'] && headers['content-type'].indexOf('multipart/form-data') > -1)//上传文件
        || !headers['user-agent']
        || (headers['user-agent'] == 'Yii2-Curl-Agent')
        || headers['user-agent'].match(/dtmobileios/)//ios端
        || headers['user-agent'].match(/dtmobileandroid/)//安卓
        || headers['user-agent'].match(/DTClient/)//pc
        || (headers['user-agent-flash'] && headers['user-agent-flash'].match(/dtflash/))//flash
        || headers['postman-token'];//postman
};

/**
 * 获取参数名
 * @param func
 * @returns {*}
 */
UtilsClass.prototype.getArgumentsName = function(func) {
    // 先用正则匹配,取得符合参数模式的字符串.
    // 第一个分组是这个: ([^)]*) 非右括号的任意字符
    let args = func.toString().match(/.*?\(([^)]*)\)/)[1];
    // 用逗号来分隔参数(arguments string).
    return args.split(',').map(arg => {
        // 去除注释(inline comments)以及空格
        return arg.replace(/\/\*.*\*\//, '').trim();
    }).filter(arg => {
        // 确保没有 undefined.
        return arg;
    });
};

/**
 * 去除字符串左右两边空格
 * */
UtilsClass.prototype.trim = function (str){
    return str.replace(/(^\s*)|(\s*$)/g, "");
};

/**
 * 正则检测
 * @param type 必须｜string｜类型or匹配字符
 * @returns {RegExp}
 */
UtilsClass.prototype.getRegExp = function(type){
    let reg = '',key = '';

    switch (type) {
        case 'chinese':
            reg = '[\\u4E00-\\u9FFF]+';
            key = 'g';
            break;
        case 'url':
            reg = '[+ /?%#&=]';
            break;
        case 'objectId':
            reg = '^[A-Za-z0-9]{24}$';
            break;
        case 'mobile':
            reg = '^1[0-9]{10}$';
            break;
        case 'email'://有问题，暂时不要用
            reg = '^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$';
            break;
        case 'number':
            reg = '^[0-9]*$';
            break;
        case 'english':
            reg = '^[A-Za-z]+$';
            break;
        case 'english_number':
            reg = '^[A-Za-z0-9]+$';
            break;
        default:
            if(!type) break;
            let fbsArr = ["\\", "$", "(", ")", "*", "+", ".", "[", "]", "?", "^", "{", "}", "|"],i,s;
            for(i=0;i<type.length;i++) {
                s = type.charAt(i);
                if(fbsArr.indexOf(s) > -1) s = '\\' + s;
                reg += s;
            }
    }

    try {
        return new RegExp(reg, key);
    }catch(err) {
        console.log(err);
    }
};

UtilsClass.prototype.parseFilePath = function (url) {
    let path = '',name = '',ext = '',is_local = '';

    if(url && url != '') {
        let sp_index = Math.max(url.lastIndexOf('\\'), url.lastIndexOf('/'));

        path = url.slice(0, sp_index + 1);
        ext = Path.extname(url || '');
        name = Path.basename(url).replace(ext,'');
        ext = ext.replace('.','');
        is_local = url.indexOf('http') != 0;
    }

    return {path,name,ext,is_local};
};

module.exports = new UtilsClass();