# 框架 #
## 简介 ##
> 基于koa2的框架，增加了路由规则，body分析，tv4参数验证，mongo、mysql、oracle数据库，http请求
> 包含各样插件：jwt，passport，session，redis，winston，kafka，elasticsearch,art-template
> 可直接作为项目使用，亦可以作为第三方库使用。

## 部署 ##
**版本库**
1. node >=12.16.3<14.0.0 (请不要更换npm的仓库地址)
2. mongodb 版本 4.2.6 （请不要随意升级，高低版本不兼容）
3. redis 版本 >= 2.6.12

**代码**
1. 下载代码库： npm install koa2frame-dt
2. 添加第三方库： 在根目录下运行：npm install
3. 按需添加数据库 npm install mongoose(mysql/oracledb) --save  具体参考版本看 package.json
4. 修改配置： etc->env.js里面指向的etc下文件的配置（参考下面的etc配置说明）
5. 启动项目： 开启index.js最后的注释，使用node运行index.s文件（项目每次修改需要重新启动）
6. 浏览器访问： http://localhost:{port}{prefix}/test 返回 “success”即成功。(port为etc里面配置的端口,prefix为etc-route里的prefix值)

## 研发人员使用 ##
1. 在etc->route.js配置路由
2. 在对应路径下写对应的方法,即可访问。默认如下：

|文件夹/文件|说明|备注|
|:--    |:--   |:-- |
|api| 接口类|base文件用于继承。验证参数：若api名为test，添加test.paramsVerify = {query:{},body:{}} 填入对应tv4验证格式即可。|
|db| 数据库类|base文件用于继承|
|domain| 处理层|base文件用于继承|
|etc| 配置及路由|参考下面的etc配置说明
|external| 第三方请求类|base文件用于继承|
|tool| 工具类|
|config.js| 公用属性|根据应用所需要自行添加|
|error.js| 错误信息表|不作修改,但可添加|
|app.js| 主程|不作修改|

## etc配置说明 ##

|选项|说明|备注|
|:--    |:--   |:-- |
|domain| 引用外部接口的域名 | 默认 self
|http| 项目启动信息 | port为端口
|db| 数据库地址 | 支持mongo

## 版本更新说明 ##
+ 版本1.0.0 - 1.0.2
 - 修复bug
+ 版本1.1.0
 - 新增 art-template 前端模板，通过 ctx.render(filename,content) 使用
 - 新增日志功能，通过 Err.log(type,...) 自动写入
+ 版本1.2.0
 - 新增静态资源访问功能，非js、art文件，均解释为资源显示，art默认用渲染器
 - 需要时可添加路由 'get/view/:file':  `view/:file`  优化先读取view路由
+ 版本1.2.1
 - 优化路由：支持通配符：*
+ 版本1.2.2
 - 优化路由：静态资源去除骆峰处理
+ 版本1.2.3
 - 优化路由：支持函数配置
 - 去除默认路由：view
+ 版本1.3.2
 - 添加中间件：passport，具体请查看配置文件 etc->dev
+ 版本1.3.3-5
 - 修复若干bug
+ 版本1.3.6
 - 支持gb2312网页转码
+ 版本1.4.0
 - 添加mysql、oracle数据库类；添加钉钉、kafka发送类
+ 版本1.4.1
 - 修复网页转码bug
+ 版本1.4.2
 - 添加typeorm；整改框架结构