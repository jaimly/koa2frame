'use strict';
/**
 * Created by Jesn on 2019/10/09.
 *
 */

const Base = require('./base'),
    {Kafka} = require('kafkajs');

class cls extends Base{
    constructor() {
        super('kafka');

        this.kafka = new Kafka({
            clientId: 'app',
            brokers: this.server.split(',')
        });

        this.producer = this.kafka.producer();
    }
}

/**
 * 发送信息
 * @param topic ｜string｜必须｜统一标识
 * @param messages ｜object数组｜[{key:'',value:'',timestamp:''}]
 */
cls.prototype.send = async function (topic,messages) {
    await this.producer.connect();
    if(topic) {
        await this.producer.send({
            topic,
            messages: messages || []
        });
    }
    await this.producer.disconnect();
};

module.exports = new cls();