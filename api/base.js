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
                        "properties": {
                            "path": {
                                "type": "string"
                            },
                            "type": {
                                "type": "string"
                            },
                            "name": {
                                "type": "string"
                            },
                            "size": {
                                "type": "integer",
                                "maximum": 102400000
                            }
                        },
                        "required": ["path","type","name","size"]
                    }
                },"required": ["file"]
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
            },
            remarks: {
                "type": "string",
                "maxLength": 255
            },
            minString: {
                "type": "string",
                "minLength": 1,
                "maxLength": 255
            },
            positiveInt: {
                "oneOf":[
                    {"type":"integer", "minimum": 1},
                    {"type":"string", "minLength": 1}
                ]
            },
            positiveIntAndZero: {
                "oneOf":[
                    {"type":"integer", "minimum": 0},
                    {"type":"string", "minLength": 1}
                ]
            },
            booleanInt: {
                "enum": [0,1,"0","1"]
            }
        };
    }
}

module.exports = cls;