# 框架 #
## 简介 ##
> 基于koa框架，增加了路由规则，body分析，tv4验证，mongo数据库，http请求。
> 可直接作为项目使用，亦可以作为第三方库使用。

## 部署 ##
1. 下载代码库： npm install koa2frame
2. 添加第三方库： 在根目录下运行：npm install
3. 修改配置： etc->env.js里面指向的etc下文件的配置（参考下面的etc配置说明）
4. 启动项目： 使用node8.6.0以上版本运行app.js文件（项目每次修改需要重新启动）
5. 浏览器访问： http://localhost:{port}{prefix}/test 返回 “success”即成功。(port为etc里面配置的端口,prefix为etc-route里的prefix值)

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