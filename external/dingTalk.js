'use strict';
/**
 * Created by Jesn on 2019/8/30.
 *
 */

const Base = require('./base');

class cls extends Base{
    constructor() {
        super('dingTalk');
    }
}

cls.prototype.send = function (body,access_token) {
    return this.request('post','/robot/send',{
        body: JSON.stringify(body),
        query: {access_token},
        headers: {'content-type':'application/json'}
    });
};

module.exports = new cls();