'use strict';
/**
 * Created by Jesn on 2019/8/29.
 * 任务列表
 */

const Path = require('path'),
    Ut = require('../tool/utils'),
    Etc = Ut.getEtc();

 module.exports.init = async function () {
    if(!Etc.task) return;
    if(Path.resolve(global.rootPath) == Path.resolve(__dirname,'../')) return;

    let Task; try{Task = require(`${global.rootPath}tool/task`);}catch(err){return;}
    return await Promise.all(Object.keys(Task).map(async task_name => {
        if(!Etc.task.start && !Etc.task[task_name]) return;
        console.log(`Task [${task_name}] start...`);
        await Task[task_name]();
        console.log(`Task [${task_name}] started.`);
    }));
 }