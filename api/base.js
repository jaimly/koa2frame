'use strict';
/**
 * Created by Jesn on 2018/9/14.
 * controllers 基类
 */

class cls {
    constructor () {
        let integer_format = {oneOf:[{type:'integer'},{type:'string'}]},
            number_format = {oneOf:[{type:'number'},{type:'string'}]};

        this.verifyFormat = {
            integer_format,
            number_format,
            require_string: {
                "type": "string",
                "minLength": 1
            },
            files: {
                "type": "object",
                "properties": {
                    "file": {
                        "type": "object",
                        "required": ["path","type","name","size"]
                    }
                }
            },
            keyword:{
                keyword: {
                    "type": "string",
                    "description": "关键字"
                }
            },
            page: {
                "per_page": integer_format,
                "page": integer_format
            },
            time: {
                "updated_start_time": number_format,
                "updated_end_time": number_format,
                "created_start_time": number_format,
                "created_end_time": number_format
            }
        };
    }
}

module.exports = cls;