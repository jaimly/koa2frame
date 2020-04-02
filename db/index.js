'use strict';

const fs = require('fs');

module.exports = {
    /**
     * 获取方法
     * @param table_name 表名
     */
    get: function (table_name) {
        try {
            return module.exports.getDB(table_name).dbModel;
        }catch (err) {}
    },

    getDB: function (table_name,type) {
        let root_path = (global.rootPath || (__dirname + '/')) + 'db/',
            name_path = `${table_name}.js`,
            err_msg = '找不到对应数据库,错误信息如下：\n';

        if (type) {
            try {
                return require(`${root_path}${type}/${name_path}`);
            } catch (err) {
                err_msg += (err+'\n');
            }
        }else {
            let files = [''].concat(fs.readdirSync(root_path)), i;
            for (i = 0; i < files.length; i++) {
                if(files[i])files[i] += '/';
                let file_path = `${root_path}${files[i]}${name_path}`;

                if (fs.existsSync(file_path)) {
                    try {
                        let file = require(file_path);
                        if (file && file.server) return file;
                    } catch (err) {
                        console.log(err_msg, err);
                    }
                }
            }
        }

        throw new Error(`${err_msg}请检查数据库配置，或检查数据库是否能连接`);
    }
};