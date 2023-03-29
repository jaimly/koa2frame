// const {typeorm:Base} = require('koa2frame');
const Base = require('./base');

const schema = {
    columns: {
        id: {
            type: "int",
            width: 11,
            unsigned: true,
            generated: true,
            primary: true
        },
        name: {
            type: "varchar",
            length: 255,
            nullable: false,
            default: "",
            comment: "名称"
        },
        status: {
            type: "varchar",
            length: 100,
            nullable: false,
            default: "",
            comment: "状态"
        },
        category: {
            type: "varchar",
            length: 100,
            nullable: false,
            default: "",
            comment: "类型"
        },
        created_at: {
            type: "bigint",
            width: 13,
            unsigned: true,
            nullable: false,
            comment: "创建时间"
        }
    },
    indices: [{
        "status": "IDX_STATUS", "columns": ["status"]
    },{
        "category": "IDX_CATEGORY", "columns": ["category"]
    }]
};

class Demo extends Base {
    constructor() {
        super('demo', schema, '[config_db_name]', null, 'demo');
    };
}

const instance = new Demo();
module.exports = instance;