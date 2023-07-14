# Koa 进阶

课程目标：掌握 Koa2 + Element-Plus 全栈开发

## 项目介绍

> 本课程要实现的博客网站的完整功能介绍及效果演示

**项目功能概要**

<img src="Koa 进阶.assets/image-20210628164639876.png" alt="image-20210628164639876" style="zoom:50%;" />



**使用的技术栈**

- 前端：Vite + Vue3.0 + Vue Router + Element-Plus + Axios + Typescript
- 后端：Koa2 + MongoDB



---



# 后端项目


## 项目起步
章节目标：能够搭建 koa2 后端项目结构

---

### 初始化后端项目

> 后端项目代码的目录结构规划

推荐目录结构：

```bash
.
├── config						# 该目录存放：全局配置，如数据库地址、数据库账号密码等
├── controller                   # 该目录存放：针对接口的路由处理函数
├── database                  	 # 该目录存放：数据库连接代码
├── middleware                   # 该目录存放：自定义中间件
├── router						# 该目录存放：路由配置
├── service						# 该目录存放：可复用的业务逻辑代码
├── static						# 该目录存放：静态资源文件
├── app.js                      # 主入口
└── package.json
```



**操作步骤**

1. 创建项目目录 `blog-backend`， 并创建推荐目录结构中的所有目录

2. 在 `blog-backend` 目录中生成 `package.json` 

```bash
npm init
```

3. 安装 koa 的一些基本依赖包

```bash
npm i koa koa-body --save
```

4. 创建配置文件 `config/config.default.js`

```js
const config = {
  // MongoDB 相关配置
  mongodb: {
    uri: 'mongodb://root:root@localhost:27017/blog',
    options: {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      authSource: 'admin'
    }
  },

  // JWT Token 相关配置
  jwt: {
    // 密钥
    secret: 'my-blog-secret'
  }
}

// 导出
module.exports = config
```

5. 创建程序入口文件 `app.js`

```js
const Koa = require('koa')
const koaBody = require('koa-body')

// 创建 Koa 实例
const app = new Koa()

// 中间件：请求体参数获取
app.use(koaBody({
  // 支持文件上传
  multipart: true,
  // 文件上传配置
  formidable: {
    // 上传文件保存目录
    uploadDir: './static/uploads',
    // 保留上传文件原来的后缀名
    keepExtensions: true
  }
}))

// 启动服务
app.listen(8000)

```

6. 输入命令运行程序（虽然现在没什么实际内容）：

```bash
node app.js
```



---



### 创建路由管理模块

> 使用中间件 `@koa/router` 实现 Koa 路由

**操作步骤**

1. 安装依赖包

```bash
npm i @koa/router --save
```

2. 创建一个路由处理函数模块（也称控制器）：`controller/home.js`

```js
module.exports = {
  
  // 测试用的处理函数
  async test(ctx) {
    ctx.body = {
      msg: 'hello,world'
    }
  }
  
}
```

3. 创建路由管理器模块： `router/index.js`

```js
// 引入 Koa Router 库
const Router = require('@koa/router')

// 引入 controller 模块
const homeCtrl = require('../controller/home')

// 创建路由器实例
const router = new Router()

// 配置路由
// - 测试用的 API
router.get('/api/test', homeCtrl.test)

// 导出路由器实例
module.exports = router
```

4. 在 `app.js`  中配置路由中间件

【注意：中间件的运行是有顺序的，顺序不同会对结果有影响，所以请务按照给出的顺序放置中间件】

```js
// 导入路由器实例
const router = require('./router')

// ...
// 中间件：请求体参数获取
// ...

// 中间件：路由相关
app.use(router.routes())
app.use(router.allowedMethods())
```

5. 重启服务，并验证能否正常访问 `http://localhost:8000/api/test`



---



### 创建数据库模块和中间件

> 创建 MongoDB 连接模块，获取mongodb 客户端实例；
>
> 并编写自定义中间件，将客户端实例附加至 ctx 对象上，方便使用

**操作步骤**

1. 安装依赖包

```bash
npm i mongodb --save
```

2. 创建数据库连接模块： `database/mongodb.js`

```js
// 引入 MongoDB 驱动包
const { MongoClient } = require('mongodb')

// 引入配置文件
const config = require('../config/config.default')

// 创建 MongoDB 客户端实例，相关配置信息从配置文件中获取
const client = new MongoClient(config.mongodb.uri, config.mongodb.options)

// 开始连接 MongoDB 服务器
client.connect()

// 导出客户端实例
module.exports = client
```

3. 创建中间件：`middleware/mongodb.js`

```js
// 导入数据库连接模块
const mongoClient = require('../database/mongodb')

/**
 * 中间件工厂函数
 * 
 * 目的：在 ctx 对象上添加 mongoClient 实例
 * 作用：启用该中间件后，可在任意能获取到 ctx 的地方获取 mongoClient 实例来操作数据库，非常方便
 * 
 * @param {Object} options 中间件的配置项（不过当前的中间件无需作什么配置）
 * @returns 返回中间件函数
 */
module.exports = (options) => {
  // 返回真正的中间件函数
  return async (ctx, next) => {
    ctx.mongoClient = mongoClient
    await next()
  }
}
```

4. 在 `app.js`  中配置中间件

```js
// 导入数据库中间件
const mongoMiddleware = require('./middleware/mongodb')

// ...
// 中间件：MongoDB 数据库操作辅助
app.use(mongoMiddleware())

// 中间件：路由相关
// ...
```

5. 在 controller 中获取 `mongoClient`

```js
module.exports = {
  
  async test(ctx) {
    // 获取 mongClient 实例
    console.log(ctx.mongoClient); 
    
    ctx.body = {
      msg: 'hello,world'
    }
  }
  
}
```



---



### 托管静态资源

> 通过中间件 `koa-static` 将 `static` 目录中的所有文件托管为静态资源

**操作步骤**

1. 安装依赖包

```bash
npm i koa-static --save
```

2. 在 `app.js` 中配置中间件

```js
// 导入静态文件托管中间件
const koaStatic = require('koa-static')

// ...
// 中间件：静态资源服务
app.use(koaStatic('./static'))

// 中间件：请求体参数获取
// ...
```



---



### 处理跨域请求

> 通过中间件 `@koa/cors` 为所有请求添加 CORS 响应头，实现跨域

**操作步骤**

1. 安装依赖包

```bash
npm i @koa/cors --save
```

2. 在 `app.js` 中配置中间件

```js
// 导入 CORS 中间件
const koaCors = require('@koa/cors')

// ...
// 中间件：CORS 跨域
app.use(koaCors())

// 中间件：静态资源服务
// ...
```

3. 测试

编写一个简单的前端页面，通过 ajax 调用之前编写的 API `http://localhost:8000/api/test`，验证能否成功调用，并携带了 CORS 响应头：

<img src="Koa 进阶.assets/image-20210630120508672.png" alt="image-20210630120508672" style="zoom:50%;" />



---



### 处理程序异常

> 使用中间件 `koa-json-error` 对程序中抛出的错误作统一处理

**背景**

客户端请求 Koa 编写的接口，当后端发生异常（即抛出 Error 对象），默认情况得到的返回结果会是如下内容：

![image-20210630152543438](Koa 进阶.assets/image-20210630152543438.png)

这对接口调用方来说并不友好，信息量太少且不方便后续处理。



**方案**

在正式开发中，后端会统一捕获代码中抛出的错误，获取 Error 对象中的有用信息，然后组织成一个固定的结果格式，发送给前端。

在 Koa 中可使用中间件 `koa-json-error` 达成这一目的。



**约定**

在本案例中，我们约定了接口的统一数据返回格式，不管成功还是失败，都会按如下格式返回：

> 接口返回数据格式为 JSON，它包含 3 个字段：
>
> - code        - [必填] 错误代码。成功时为 0，出错时用五位数表示（如：10001）
> - message     - [必填] 错误描述。
> - data        - [可选] 业务数据。



**操作步骤**

1. 安装依赖包

```bash
npm i koa-json-error --save
```



2. 在 `app.js` 中配置中间件

```js
// 导入错误处理中间件
const koaError = require('koa-json-error')

// ...
// 中间件：请求体参数获取
// ...

// 中间件：统一错误处理和错误信息输出
app.use(koaError({
  // 自定义出错时，接口返回数据的格式
  format: (err, obj) => {
    return {
      code: obj.code || 50000,
      message: obj.message || err.message
    }
  }
}))
```



3. 在 controller 中编写能抛出错误的代码：

```js
module.exports = {
  async test(ctx) {
    // 方式一：常规的抛出错误方式
    // throw new Error('一个错误1')

    // 方式二：Koa 封装的抛出错误工具函数
    return ctx.throw({ code: 40011, message: '一个错误2' })

    ctx.body = {
      msg: 'hello,world'
    }
  }
}
```

测试并观察接口返回内容：

<img src="Koa 进阶.assets/image-20210630154611724.png" alt="image-20210630154611724" style="zoom:50%;" />



---



### 校验接口参数

> 使用中间件 `koa-parameter` 校验请求参数，提高接口健壮性

中间件 `koa-parameter` 封装自 `parameter` 这个数据校验库，因此两者的校验规则配置相同。

`koa-parameter` 自己的文档很简单，主要可以看 [parameter 的参考文档](https://github.com/node-modules/parameter)。

**操作步骤**

1. 安装依赖包

```bash
npm i koa-parameter --save
```

2. 在 `app.js` 中配置中间件

```js
const koaParameter = require('koa-parameter')

// ...

// 中间件：请求参数校验
koaParameter(app)

// 中间件：CORS 跨域
// ...
```

3. 测试

在 controller 代码中使用 `ctx.verifyParams()` 方法，校验请求参数：

```js
// 请求参数的校验：是否存字符串类型的 name 参数；校验失败会抛出 Error 对象
ctx.verifyParams({
  name: 'string'
})
```

调用接口后，返回结果：

<img src="Koa 进阶.assets/image-20210729102049142.png" alt="image-20210729102049142" style="zoom:50%;" />

> 该结果和我们约定的规范不太一致，所以下面要做改进。

4. 在 `app.js` 中针对参数校验错误，完善统一错误处理中间件的代码：

```js
// 中间件：统一错误处理和错误信息输出
app.use(koaError({
  // 自定义出错时，接口返回数据的格式
  format: (err, obj) => {
    // 参数校验的错误
    if (obj.code === 'INVALID_PARAM') {
      // 企业开发中基于安全考虑，对于参数校验错误，后端无需告知前端更多错误细节
      // （即只需告诉前端参数不合法即可）
      return {
        code: 40022,
        message: '存在不合法参数！'
      }
    }
    // 其他类型的错误
    return {
      code: obj.code || 50000,
      message: obj.message || err.message
    }
  }
}))
```

再次调用测试接口，返回的内容：

<img src="Koa 进阶.assets/image-20210630171347632.png" alt="image-20210630171347632" style="zoom:50%;" />



---



### 自动重启服务

> 使用 nodemon 工具，实现修改代码后自动重启服务，避免重复手动操作

**操作步骤**

1. 安装依赖包

```bash
npm i nodemon --save-dev
```

2. 在 `package.json` 中的 `scripts` 属性下添加：

```json
"scripts": {
	"dev": "nodemon app.js"
}
```

3. 使用 npm 启动服务

```bash
npm run dev
```



---



## 数据库设计

> 设计本案例中存储各类数据的 MongoDB 数据集合和相关字段

满足本案例所有数据存储所需的表：

- users - 用户表
- captcha - 验证码缓存表
- categories - 分类表
- articles - 文章表

### 用户表

| 字段名    | 类型   | 说明                     |
| --------- | ------ | ------------------------ |
| username  | String | 账号                     |
| nickname  | String | 昵称                     |
| password  | String | 密码（哈希值）           |
| avatar    | String | 头像（服务端的相对路径） |
| createdAt | Date   | 创建日期                 |
| updatedAt | Date   | 修改日期                 |



### 验证码缓存表

| 字段名    | 类型   | 说明                                                   |
| --------- | ------ | ------------------------------------------------------ |
| text      | String | 验证码字符串                                           |
| createdAt | Date   | 创建日期（本表会添加数据过期机制，到期后自动删除数据） |



### 分类表

| 字段名    | 类型   | 说明             |
| --------- | ------ | ---------------- |
| name      | String | 文章的分类目录名 |
| createdAt | Date   | 创建日期         |



### 文章表

| 字段名     | 类型   | 说明       |
| ---------- | ------ | ---------- |
| ownerId    | String | 文章作者ID |
| categoryId | String | 文章分类ID |
| title      | String | 标题       |
| summary    | String | 概要       |
| content    | String | 正文       |
| thumbnail  | String | 封面图片   |
| createdAt  | Date   | 创建日期   |
| updatedAt  | Date   | 修改日期   |



---



## 接口设计

> 本案例中所有涉及到的后端 API 接口的设计

本案例的所有接口，在设计时遵循以下约定：

1. **使用请求方式（Method）来区分接口的操作类型:** 
   - `GET ` - 查询数据
   - `POST` - 新增数据
   - `PUT` - 修改数据
   - `DELETE` - 删除数据
2. **返回数据的格式必须是 JSON，且包含 3 个字段：**
   - code        - [必填] 错误代码。成功时为 0，出错时用五位数表示（如：10001）
   - message - [必填] 错误描述。
   - data         - [可选] 业务数据。



---



### 登录注册：注册接口

请求方式：`POST`

请求地址：`/api/register`

参数格式：`JSON`

```json
{
  username: 'string',		// 账号
  nickname: 'string',		// 昵称
  password: 'string'	    // 密码
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '注册成功',
  data: true
}
```



### 登录注册：图片验证码接口

请求方式：`GET`

请求地址：`/api/captcha`

参数格式：无需参数

返回格式：`JSON`

```json
{
  code: 0,
  message: '获取验证码成功',
  data: {
    key: '验证码ID',
    svg: 'Base64 格式的 SVG 验证码图片'
  }
}
```



### 登录注册：登录接口

请求方式：`POST`

请求地址：`/api/login`

参数格式：`JSON`

```json
{
  username: 'string',	   // 账号
  password: 'password',		// 密码
  captchaKey: 'string',		// 图形验证码ID
  captchaCode: 'string'		// 图形验证码值
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '登录成功',
  data: 'jwt token'
}
```



### 通用接口：分类列表接口

请求方式：`GET`

请求地址：`/api/categories`

参数格式：无需参数

返回格式：`JSON`

```json
{
  code: 0,
  message: '获取分类成功',
  data: [分类的对象数组]
}
```



### 通用接口：图片上传接口

请求方式：`POST`

请求地址：`/api/user/image/upload`

参数格式：`FormData`

```json
"file" => 文件内容 
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '上传成功',
  data: {
    location: "文件在服务器上存储的相对路径"
  }
}
```



### 文章管理：列表接口
请求方式：`GET`

请求地址：`/api/user/articles`

参数格式：`JSON`

```json
{
  "categoryId": "string",	   // 分类ID
  "keyword": "string",		  // 搜索关键词
  "pageNo": 1,				// 分页页码
  "pageSize": 10			// 分页条数
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '获取文章分页数据成功',
  data: {
    total: 100, 
    items: [文章对象数组]
  }
}
```



### 文章管理：详情接口

请求方式：`GET`

请求地址：`/api/user/articles/:id`

参数格式：无需额外参数

返回格式：`JSON`

```json
{
  code: 0,
  message: '文章获取成功',
  data: {文章对象}
}
```




### 文章管理：新建接口
请求方式：`POST`

请求地址：`/api/user/articles`

参数格式：`JSON`

```json
{
  categoryId: 'string',		// 文章分类ID
  title: 'string',		   // 文章标题
  summary: 'string',	    // 文章概要
  content: 'string',	    // 文章正文
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '文章录入成功',
  data: true
}
```




### 文章管理：修改接口
请求方式：`PUT`

请求地址：`/api/user/articles/:id`

参数格式：`JSON`

```json
{
  categoryId: 'string',		// 文章分类ID
  title: 'string',				// 文章标题
  summary: 'string',			// 文章概要
  content: 'string',			// 文章正文
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '文章修改成功',
  data: true
}
```




### 文章管理：删除接口
请求方式：`DELETE`

请求地址：`/api/user/articles/:id`

参数格式：无需额外参数

返回格式：`JSON`

```json
{
  code: 0,
  message: '文章删除成功',
  data: true
}
```



### 个人资料：查询接口
请求方式：`GET`

请求地址：`/api/user/profile`

参数格式：无需参数

返回格式：`JSON`

```json
{
  code: 0,
  message: '获取个人资料成功',
  data: {个人资料}
}
```



### 个人资料：信息修改接口
请求方式：`PUT`

请求地址：`/api/user/profile/baseinfo`

参数格式：`JSON`

```json
{
	nickname: 'string',			// 昵称
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '修改个人资料成功',
  data: true
}
```



### 个人资料：密码修改接口
请求方式：`PUT`

请求地址：`/api/user/profile/password`

参数格式：`JSON`

```json
{
  oldPassword: 'password',	// 旧密码
  newPassword: 'password'		// 新密码
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '修改登录密码成功',
  data: true
}
```



### 个人资料：头像修改接口

请求方式：`PUT`

请求地址：`/api/user/profile/avatar`

参数格式：`JSON`

```json
{
  avatar: 'string'		// 头像文件在服务器的相对路径
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '修改头像成功',
  data: true
}
```



### 博客页面：文章列表分类查询接口

请求方式：`GET`

请求地址：`/api/articles`

参数格式：`JSON`

```json
{
  categoryId: "string",		// 文章分类ID
  pageNo: 1, 							// 分页页码
  pageSize: 10						// 分页条数
}
```

返回格式：`JSON`

```json
{
  code: 0,
  message: '获取分类下的文章成功',
  data: { 
    total: 100, 
    items: [文章对象数组]
  }
}
```



### 博客页面：文章详情接口

请求方式：`GET`

请求地址：`/api/articles/:id`

参数格式：无需额外参数

返回格式：`JSON`

```json
{
  code: 0,
  message: '获取文章详情成功',
  data: {文章详情}
}
```





---



## 注册登录接口

章节目标：能够实现用户的登录和注册接口

### 实现注册接口

> 编写用户注册接口

**操作步骤**

1. 安装加密函数库 `bcrypt`

```bash
npm i bcrypt --save
```

2. 新建 `service/auth.js`，实现注册的具体业务逻辑

```js
const { hash, compare } = require('bcrypt')

/**
 * 检查用户名是否已存在
 * @param {*} ctx 
 * @param {String} username 用户名
 */
async function checkUsernameExist(ctx, username) {
  const coll = ctx.mongoClient.db().collection('users')
  const user = await coll.findOne({ username })
  return !!user
}

/**
 * 注册一个用户
 * @param {*} ctx 
 * @param {Object} userInfo 用户信息
 * @returns 
 */
async function doRegister(ctx, userInfo) {
  // 获取参数
  const { username, password, nickname } = userInfo

  // 检查是否有用户名重复的数据
  const isExist = await checkUsernameExist(ctx, username)

  if (isExist) {
    return ctx.throw({ code: 10001, message: '该用户名已存在！' })
  }

  // 将密码明文使用 bcrypt 加密
  const passwordHash = await hash(password, 10)

  // 向数据库插入一条数据
  const coll = ctx.mongoClient.db().collection('users')
  const result = await coll.insertOne({
    username,
    nickname,
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  return !!result.insertedId
}

module.exports = {
  checkUsernameExist,
  doRegister,
}
```

3. 新建 `controller/auth.js` ，完成请求和响应的处理代码：

```js
const { doRegister } = require("../service/auth")

module.exports = {

  async register(ctx) {
    // 校验参数
    ctx.verifyParams({
      username: 'string',
      nickname: 'string',
      password: 'password'
    })

    // 调用 service 进行用户注册
    await doRegister(ctx, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '注册成功',
      data: true
    }
  },

}
```

4. 在 `router/index.js` 中配置路由

```js
const authCtrl = require('../controller/auth')
// ...
router.post('/api/register', authCtrl.register)
```



---



### 实现图片验证码接口

> 实现利用 svg-captcha 生成 SVG 图片验证码的接口

**操作步骤**

1. 在 MongoDB 的命令行工具中，为数据库 `blog` 中的 `captcha` 表创建索引

```js
// 作用：让插入 captcha 表中的数据在 600 秒（10分钟）后过期自动删除。
// 注意：插入的数据必须包含 Date 类型的 createdAt 数据字段，才能让过期机制生效。

use blog;

db.captcha.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 600 });
```

2. 安装图片验证码生成库 `svg-captcha` ，及 Base64 工具库 `js-base64 `

```bash
npm i svg-captcha js-base64 --save
```

3. 在 `service/auth.js` 中，实现生成验证码的具体业务逻辑

```js
const svgCaptcha = require('svg-captcha')
const { Base64 } = require('js-base64')

// ...
/**
 * 生成图片验证码
 * @param {*} ctx 
 */
async function generateCaptcha(ctx) {
  // 创建验证码
  const captcha = svgCaptcha.create()

  // 缓存验证码文本数据
  const coll = ctx.mongoClient.db().collection('captcha')
  const result = await coll.insertOne({
    text: captcha.text,
    createdAt: new Date()   // 必须设置，用于验证码的过期检测
  })

  // 将 svg 图片内容转成 base64 字符串格式，方便在 HTML 中通过 <img> 标签显示
  const base64Svg = Base64.encode(captcha.data)

  return {
    key: result.insertedId,
    svg: `data:image/svg+xml;base64,${base64Svg}`
  }
}

module.exports = {
  // ...
  generateCaptcha
}
```

4. 在 `controller/auth.js` 中，完成请求和响应的处理代码

```js
const {
  // ...
  generateCaptcha,
} = require("../service/auth")

module.exports = {
  // ..
  
  async captcha(ctx) {
    // 生成验证码
    const result = await generateCaptcha(ctx)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '获取验证码成功',
      data: result
    }
  },
}
```

5. 在 `router/index.js` 中配置路由

```js
router.get('/api/captcha', authCtrl.captcha)
```

 

---



### 实现登录接口

> 编写用户登录接口

**操作步骤**

1. 安装 JWT Token 工具库 `jsonwebtoken`，以便在登录成功后生成 token

```bash
npm i jsonwebtoken --save
```

2. 在 `service/auth.js` 中，编写登录的具体业务逻辑

```js
const jwt = require('jsonwebtoken')
const config = require('../config/config.default')
const { ObjectID } = require('mongodb')

// ...

/**
 * 用户登录操作
 * @param {*} ctx 
 * @param {Object} userInfo 用户信息 
 */
async function doLogin(ctx, loginInfo) {
  // 获取参数
  const { username, password, captchaKey, captchaCode } = loginInfo

  // 查找数据库中是否存在该验证码
  const captColl = ctx.mongoClient.db().collection('captcha')
  const captcha = await captColl.findOne({ _id: ObjectID(captchaKey) })
  if (!captcha) {
    return ctx.throw({ code: 10002, message: '验证码已过期，请重新获取验证码！' })
  }

  // 从数据库中清除该验证码
  await captColl.deleteOne({ _id: ObjectID(captchaKey) })

  // 对比验证码（不区分大小写）
  if (captcha.text.toUpperCase() !== captchaCode.toUpperCase()) {
    return ctx.throw({ code: 10003, message: '验证码不正确，请重新获取验证码！' })
  }

  // 根据账号查找用户
  const userColl = ctx.mongoClient.db().collection('users')
  const userInDB = await userColl.findOne({ username })
  if (!userInDB) {
    return ctx.throw({ code: 10004, message: '用户名不正确！' })
  }

  // 对比密码
  const isValidPassword = await compare(password, userInDB.password)
  if (!isValidPassword) {
    return ctx.throw({ code: 10005, message: '密码不正确！' })
  }

  // 生成 JWT Token
  const token = jwt.sign({
    sub: userInDB._id.toString(),
    username
  }, config.jwt.secret, {
    expiresIn: '36000s'
  })

  return token
}

module.exports = {
  // ...
  doLogin,
}
```

3. 在 `controller/auth.js` 中，完成请求和响应的处理代码

```js
const {
  // ...
  doLogin
} = require("../service/auth")

module.exports = {

  async login(ctx) {
    // 校验参数
    ctx.verifyParams({
      username: 'string',
      password: 'password',
      captchaKey: 'string',
      captchaCode: 'string'
    })

    // 登录并获取 JWT Token
    const token = await doLogin(ctx, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '登录成功',
      data: token
    }
  },

}
```

4. 在 `router/index.js` 中配置路由

```js
router.post('/api/login', authCtrl.login)
```



---



### 实现接口鉴权

> 使用 koa-jwt 中间件实现：对需要登录后才能调用的接口进行权限控制

**约定**

我们约定：所有起始路径为 `/api/user` 的接口，都需要鉴权后才能访问。

采用方案：使用 `koa-jwt` 中间件，对接口进行拦截，校验是否携带 `Authorization：Bearer xxxxxx` 请求头，且判断是否为合法的 JWT Token。

**操作步骤**

1. 安装依赖包

```bash
npm i koa-jwt --save
```

2. 在 `app.js` 中配置中间件

```js
const koaJwt = require('koa-jwt')
const config = require('./config/config.default')

// ...
// 中间件：接口鉴权
app.use(koaJwt({
  secret: config.jwt.secret   // JWT 密钥
}).unless({
  path: [/^\/api\/(?!user)/]  // 只对起始路径为 /api/user 的 API 接口进行鉴权
}))

// 中间件：MongoDB 数据库操作辅助
// ...
```

3. 测试

经过以上配置，调用任何起始路径为 `/api/user` 的接口都需要携带请求头`Authorization`。

通过 ctx 对象可获取到存放在 JWT Token 中的信息：

```js
async test2(ctx) {
  // 获取鉴权成功后才能执行到本代码
  
  // 获取 JWT Token 中携带的信息
  const loginUser = ctx.state.user
  
  console.log("<<<<<<<", loginUser)
  
  // ...
}
```



---



## 通用接口

### 为文章分类表初始化数据

> 在本案例中，文章分类不作管理，我们事先约定一批分类并将它们存入数据表中

预设分类：

- 时事新闻
- 体育竞技
- 旅游分享
- 技术分享
- 育儿知识
- 汽车之家

**操作步骤**

1. 在 MongoDB 命令行工具中，切换到 `blog` 数据库，并执行以下代码，插入文章分类数据：

```js
use blog;

[
  '时事新闻', 
  '体育竞技', 
  '旅游分享', 
  '技术分享', 
  '育儿知识', 
  '汽车之家'
].forEach(name => {
    db.categories.save({
        name,
        createdAt: new Date()
    })
});
```

<img src="Koa 进阶.assets/image-20210715205825233.png" alt="image-20210715205825233" style="zoom:50%;" />



---



### 实现获取所有文章分类的接口

> 用于获取所有文章分类的接口

**操作步骤**

1. 新建 `service/categories.js`，实现文章分类查询的具体业务逻辑

```js
/**
 * 获取所有的文章分类
 * @param {*} ctx 
 * @returns 文章分类数组
 */
async function getAllCategories(ctx) {
  // 查询所有分类
  const coll = ctx.mongoClient.db().collection('categories')
  return coll.find({}).toArray()
}

module.exports = {
  getAllCategories
}
```

2. 新建 `controller/categories.js`，完成请求和响应的处理代码

```js
const { getAllCategories } = require("../service/category")

module.exports = {

  async list(ctx) {
    // 获取所有分类
    const categories = await getAllCategories(ctx)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '获取分类成功',
      data: categories
    }
  }
}
```

3. 在 `router/index.js` 中配置路由

```js
const categoryCtrl = require('../controller/categories')
// ...

router.get('/api/categories', categoryCtrl.list)
```



---



### 实现图片上传接口

> 通过 koa-body 实现图片上传

**操作步骤**

1. 在 `static` 目录下新建 `uploads` 目录，用于存放上传后的图片

2. 新建 `controller/upload.js`，实现文件上传处理代码

```js
module.exports = {

  async uploadImage(ctx) {
    // 获取上传的文件信息
    const file = ctx.request.files.file

    // 去除路径中前面的 static 部分，只留下后面的一段路径
    const location = file.path.replace('static', '')

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '上传成功',
      data: {
        location
      }
    }
  }

}
```

3. 在 `router/index.js` 中配置路由

```js
const uploadCtrl = require('../controller/upload')
// ...

router.post('/api/user/image/upload', uploadCtrl.uploadImage) 
```



---



## 文章管理接口
章节目标：能够实现用户的文章管理相关接口

---

### 实现用户的文章新建接口

> 用于录入新文章

**操作步骤**

1. 新建 `service/article.js`，实现新建文章的具体业务逻辑

```js
const { ObjectId } = require('mongodb')

/**
 * 当前用户创建一篇新文章
 * @param {*} ctx 
 * @param {Object} articleInfo 
 */
async function createArticle(ctx, articleInfo) {
  // 参数处理
  const currentUserId = ObjectId(ctx.state.user.sub)
  const categoryId = ObjectId(articleInfo.categoryId)
  const { title, summary, content } = articleInfo

  // 从文章正文中提取第一张图片作为封面（正文内容是由富文本编辑器产出的 HTML 代码片段）
  const thumbnail = content.match(/<img\s(.*?)\s?src="(.*?)"/)?.[2]

  // 保存文章
  const articleColl = ctx.mongoClient.db().collection('articles')
  const result = await articleColl.insertOne({
    ownerId: currentUserId,
    categoryId: categoryId,
    title,
    summary,
    content,
    thumbnail,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  if (result.insertedCount === 0) {
    return ctx.throw({ code: 10201, message: '新增文章失败！' })
  }
}

module.exports = {
  createArticle,
}
```

2. 新建 `controller/article.js`，完成请求和响应的处理代码

```js
const { createArticle } = require('../service/article')

module.exports = {
  
  async create(ctx) {
    // 校验参数
    ctx.verifyParams({
      categoryId: 'string',
      title: 'string',
      summary: 'string',
      content: 'string',
    })

    // 创建文章
    await createArticle(ctx, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '文章录入成功',
      data: true
    }
  },
  
}
```

3. 在 `router/index.js` 中配置路由

```js
const articleCtrl = require('../controller/article')
// ...

router.post('/api/user/articles', articleCtrl.create) 
```



---



### 实现用户的文章分页查询接口

> 用于查询当前用户发布的文章，可以指定页码和每页条数进行查询

本接口需要进行联表查询，因此需要借助 MongoDB 聚合（Aggregation）功能。

相关功能查看 [官方文档](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)。

**操作步骤**

1. 在 `service/article.js`中，实现文章分页查询的具体业务逻辑

```js
/**
 * 当前用户分页查询出自己的文章
 * @param {*} ctx 
 * @param {Object} params 查询参数
 */
async function listArticles(ctx, params) {
  // 参数处理
  const currentUserId = ObjectId(ctx.state.user.sub)
  const categoryId = params.categoryId
  const keyword = params.keyword
  const pageNo = parseInt(params.pageNo) || 1
  const pageSize = parseInt(params.pageSize) || 10

  // 查询条件
  const filter = {
    ownerId: {
      $eq: currentUserId
    }
  }

  // 如果传入了搜索关键字，则对文章的标题进行模糊查询
  if (keyword) {
    filter.title = {
      $regex: new RegExp(keyword, 'ig')
    }
  }

  // 如果传入了分类，则对文章按照分类进行过滤
  if (categoryId) {
    filter.categoryId = {
      $eq: ObjectId(categoryId)
    }
  }

  // 执行分页查询
  const articleColl = ctx.mongoClient.db().collection('articles')

  // 分页查询步骤1：查询符合条件的记录总数
  const total = await articleColl.countDocuments(filter)

  // 分页查询步骤2：使用聚合进行文章表和分类表的联表查询，获取当前页数据
  const items = await articleColl.aggregate([
    // 过滤条件
    { $match: filter },
    // 按日期由近到远排序
    { $sort: { createdAt: -1 } },
    // 跳过数据的条数（分页）
    { $skip: (pageNo - 1) * pageSize },
    // 限制一页的条数（分页）
    { $limit: pageSize },
    // 根据文章中的分类ID，联表查出分类的详细数据
    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category'
      }
    },
    // 上面联表查询出的数据是一个只包含了一个对象元素的数组，摊平它，成为一个对象
    { $unwind: '$category' },
    // 去除掉不需要的一些字段
    {
      $project: {
        content: 0,
        summary: 0,
        thumbnail: 0,
        ownerId: 0,
        categoryId: 0
      }
    }
  ]).toArray()

  return { total, items }
}

module.exports = {
  // ...
  listArticles,
}
```

2. 在 `controller/article.js`中，完成请求和响应的处理代码

```js
const {
  // ...
  listArticles,
} = require('../service/article')

module.exports = {

  async list(ctx) {
    // 查询文章
    const result = await listArticles(ctx, ctx.query)

    // 返回成功的数据
    ctx.body = {
      code: 0,
      message: '获取文章分页数据成功',
      data: result
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
router.get('/api/user/articles', articleCtrl.list)
```



---



### 实现用户的文章详情接口

> 在编辑文章时可调用该接口来获取文章详情，以便在编辑表单中回显

**操作步骤**

1. 在 `service/article.js`中，实现按 ID 获取文章详情的具体业务逻辑

```js
/**
 * 获取指定ID的文章详情
 * @param {*} ctx 
 * @param {String} id 
 */
async function getArticleById(ctx, id) {
  const articleColl = ctx.mongoClient.db().collection('articles')
  return articleColl.findOne({ _id: ObjectId(id) })
}

module.exports = {
  // ...
  getArticleById
}
```

2. 在 `controller/article.js`中，完成请求和响应的处理代码

```js
const {
  // ...
  getArticleById,
} = require('../service/article')

module.exports = {

  async detail(ctx) {
    // 获取路径中的动态参数 id
    const id = ctx.params.id

    // 查询文章详情
    const result = await getArticleById(ctx, id)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '文章获取成功',
      data: result
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
router.get('/api/user/articles/:id', articleCtrl.detail) 
```



---



### 实现用户的文章删除接口

> 根据文章 ID 删除一篇文章

**操作步骤**

1. 在 `service/article.js`中，实现按 ID 删除文章的具体业务逻辑

```js
/**
 * 当前用户删除自己的一篇文章
 * @param {*} ctx 
 * @param {String} id 要删除的文章ID
 */
async function removeArticle(ctx, id) {
  // 参数处理
  const currentUserId = ObjectId(ctx.state.user.sub)

  // 删除文章
  const articleColl = ctx.mongoClient.db().collection('articles')
  const result = await articleColl.deleteOne({
    _id: ObjectId(id),
    ownerId: currentUserId
  })

  // 判断是否成功删除
  if (result.deletedCount === 0) {
    return ctx.throw({ code: 10203, message: '要删除的文章不存在，或当前用户无权限删除！' })
  }
}

module.exports = {
  // ...
  removeArticle,
}
```

2. 在 `controller/article.js`中，完成请求和响应的处理代码

```js
const {
	// ...
  removeArticle,
} = require('../service/article')

module.exports = {
  
  async remove(ctx) {
    // 获取路径中的动态参数 id
    const id = ctx.params.id

    // 删除文章
    await removeArticle(ctx, id)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '文章删除成功',
      data: true
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
router.delete('/api/user/articles/:id', articleCtrl.remove)
```



---



### 实现用户的文章编辑接口

> 用于更新指定 ID 的文章内容

**操作步骤**

1. 在 `service/article.js`中，实现按 ID 更新文章的具体业务逻辑

```js
/**
 * 当前用户更新自己的一篇文章
 * @param {*} ctx 
 * @param {*} articleInfo 
 */
async function updateArticle(ctx, id, articleInfo) {
  // 参数处理
  const currentUserId = ObjectId(ctx.state.user.sub)
  const categoryId = ObjectId(articleInfo.categoryId)
  const title = articleInfo.title
  const summary = articleInfo.summary
  const content = articleInfo.content

  // 从文章正文中提取第一张图片作为封面
  const thumbnail = content.match(/<img\s(.*?)\s?src="(.*?)"/)?.[2]

  // 修改文章
  const articleColl = ctx.mongoClient.db().collection('articles')
  const result = await articleColl.updateOne({
    _id: ObjectID(id),
    ownerId: currentUserId
  }, {
    $set: {
      categoryId,
      title,
      summary,
      content,
      thumbnail,
      updatedAt: new Date()
    }
  })

  // 判断是否成功修改
  if (result.modifiedCount === 0) {
    return ctx.throw({ code: 10202, message: '要修改的文章不存在，或当前用户无权限修改！' })
  }
}

module.exports = {
	// ...
  updateArticle,
}
```

2. 在 `controller/article.js`中，完成请求和响应的处理代码

```js
const {
  // ...
  updateArticle,
} = require('../service/article')

module.exports = {
  
  async update(ctx) {
    // 校验参数
    ctx.verifyParams({
      categoryId: 'string',
      title: 'string',
      summary: 'string',
      content: 'string',
    })

    // 获取路径中的动态参数 id
    const id = ctx.params.id

    // 修改文章
    await updateArticle(ctx, id, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '文章修改成功',
      data: true
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
router.put('/api/user/articles/:id', articleCtrl.update)   
```



---



## 个人信息接口
章节目标：能够实现个人信息查询和修改接口

---

### 实现个人资料查询接口

>获取当前登录用户的个人资料

**操作步骤**

1. 新建 `service/profile.js`，实现获取当前登录者资料的具体业务逻辑

```js
const { ObjectID } = require('mongodb')

/**
 * 获取个人资料
 */
async function getCurrentUserProfile(ctx) {
  // 处理参数
  const currentUserId = ObjectID(ctx.state.user.sub)

  // 查询用户信息
  const userColl = ctx.mongoClient.db().collection('users')
  const result = await userColl.findOne({ _id: currentUserId })

  return result
}

module.exports = {
  getCurrentUserProfile,
}
```

2. 新建 `controller/profile.js`，完成请求和响应的处理代码

```js
const {
  getCurrentUserProfile,
} = require("../service/profile")

module.exports = {

  async getProfile(ctx) {
    // 获取当前登录用户的个人资料
    const result = await getCurrentUserProfile(ctx)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '获取个人资料成功',
      data: result
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
const profileCtrl = require('../controller/profile')
// ...

router.get('/api/user/profile', profileCtrl.getProfile) 
```



---



### 实现修改基本信息接口

> 修改当前登录用户的基本信息(修改昵称)

**操作步骤**

1. 在 `service/profile.js` 中，实现修改当前登录者基本资料的具体业务逻辑

```js
/**
 * 修改个人资料
 * @param {*} ctx 
 * @param {Object} params 
 */
async function updateProfileBaseInfo(ctx, params) {
  // 处理参数
  const currentUserId = ObjectId(ctx.state.user.sub)
  const nickname = params.nickname

  // 修改个人资料
  const userColl = ctx.mongoClient.db().collection('users')
  await userColl.updateOne({
    _id: currentUserId
  }, {
    $set: {
      nickname
    }
  })
}

module.exports = {
  // ...
  updateProfileBaseInfo,
}
```

2. 在 `controller/profile.js` 中，完成请求和响应的处理代码

```js
const {
	// ...
  updateProfileBaseInfo,
} = require("../service/profile")

module.exports = {

  async updateProfileBaseInfo(ctx) {
    // 校验参数
    ctx.verifyParams({
      nickname: 'string'
    })

    // 修改个人资料
    await updateProfileBaseInfo(ctx, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '修改个人资料成功',
      data: true
    }
  },
  
}
```

3. 在 `router/index.js` 中配置路由

```js
router.put('/api/user/profile/baseinfo', profileCtrl.updateProfileBaseInfo)
```



---



### 实现修改密码接口

> 修改当前登录用户的密码

**操作步骤**

1. 在 `service/profile.js` 中，实现修改当前登录者密码的具体业务逻辑

```js
const { hash, compare } = require('bcrypt')

// ...

/**
 * 修改登录密码
 * @param {*} ctx 
 * @param {Object} params 
 */
async function updateProfilePassword(ctx, params) {
  // 处理参数
  const currentUserId = ObjectId(ctx.state.user.sub)
  const oldPassword = params.oldPassword
  const newPassword = params.newPassword

  // 获取当前用户
  const userColl = ctx.mongoClient.db().collection('users')
  const user = await userColl.findOne({ _id: currentUserId })

  // 对比输入的旧密码是否正确
  const isValidOldPass = await compare(oldPassword, user.password)
  if (!isValidOldPass) {
    return ctx.throw({ code: 10302, message: '输入的旧密码不正确！' })
  }

  // 修改成新密码
  const passwordHash = await hash(newPassword, 10)
  await userColl.updateOne({
    _id: currentUserId
  }, {
    $set: {
      password: passwordHash
    }
  })
}

module.exports = {
	// ...
  updateProfilePassword,
}
```

2. 在 `controller/profile.js` 中，完成请求和响应的处理代码

```js
const {
	// ...
  updateProfilePassword,
} = require("../service/profile")

module.exports = {

  async updateProfilePassword(ctx) {
    // 校验参数
    ctx.verifyParams({
      oldPassword: 'password',
      newPassword: 'password'
    })

    // 修改登录密码
    await updateProfilePassword(ctx, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '修改登录密码成功',
      data: true
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
router.put('/api/user/profile/password', profileCtrl.updateProfilePassword) 
```



---



### 实现修改头像接口

> 修改当前登录用户的头像

**操作步骤**

1. 在 `service/profile.js` 中，实现修改当前登录者头像的具体业务逻辑

```js
/**
 * 修改头像
 * @param {*} ctx 
 * @param {String} avatar 
 */
async function updateProfileAvatar(ctx, params) {
  // 处理参数
  const currentUserId = ObjectId(ctx.state.user.sub)
  const avatar = params.avatar

  // 修改成新的头像地址
  const userColl = ctx.mongoClient.db().collection('users')
  await userColl.updateOne({
    _id: currentUserId
  }, {
    $set: {
      avatar
    }
  })
}

module.exports = {
	// ...
  updateProfileAvatar
}
```

2. 在 `controller/profile.js` 中，完成请求和响应的处理代码

```js
const {
  // ...
  updateProfileAvatar
} = require("../service/profile")

module.exports = {

  async updateProfileAvatar(ctx) {
    // 校验参数
    ctx.verifyParams({
      avatar: 'string'
    })

    // 修改头像地址
    await updateProfileAvatar(ctx, ctx.request.body)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '修改头像成功',
      data: true
    }
  }

}
```

3. 在 `router/index.js` 中配置路由

```js
router.put('/api/user/profile/avatar', profileCtrl.updateProfileAvatar) 
```



---



## 博客页面接口

章节目标：能够实现博客首页获取文章列表、文章详情等接口

### 实现按分类获取文章的分页查询接口

> 供博客首页调用的接口，可根据分类 ID 获取该分类下的文章列表（可分页）

**操作步骤**

1. 新建 `service/blog.js`，实现按分类获取文章列表的具体业务逻辑

```js
const { ObjectId } = require('mongodb')

/**
 * 按分类获取文章列表（带分页功能）
 * @param {*} ctx 
 * @param {String} categoryId 分类ID
 * @param {Object} params 其他分页参数
 * @returns 
 */
async function listArticlesByCategory(ctx, params) {
  // 处理参数
  const categoryId = params.categoryId
  const pageNo = parseInt(params.pageNo) || 1
  const pageSize = parseInt(params.pageSize) || 10

  // 查询条件
  const filter = {}

  // 如果传入了分类，则对文章按照分类进行过滤
  if (categoryId) {
    filter.categoryId = {
      $eq: ObjectID(categoryId)
    }
  }


  // 执行分页查询
  const articleColl = ctx.mongoClient.db().collection('articles')
  // 1. 查询所有符合条件的记录总数
  const total = await articleColl.countDocuments(filter)
  // 2. 聚合, 进行联表查询
  const items = await articleColl.aggregate([
    // 过滤条件
    { $match: filter },
    // 按照日期, 由近到远, 新添加在前
    { $sort: { createdAt: -1 }},
    // 跳过的条数
    { $skip: (pageNo - 1) * pageSize },
    // 限制一页的条数
    { $limit: pageSize },
    // 根据用户 Id, 联表查询出用户的详细信息
    {
      $lookup: {
        from: "users",
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner'
      }
    },
    // 上述联表查询出来的结果, 是一个数组包对象的格式
    { $unwind: '$owner' },
    // 根据分类 Id, 联表查询出分类的详细信息
    {
      $lookup: {
        from: "categories",
        localField: 'categoryId',
        foreignField: '_id',
        as: 'categories'
      }
    },
    // 上述联表查询出来的结果, 是一个数组包对象的格式
    { $unwind: '$categories' },
    // 去掉一些不需要的字段
    {
      $project: {
        ownerId: 0,
        categoryId: 0,
        owner: {
          username: 0,
          password: 0,
        },
        content: 0
      }
    }
  ]).toArray()

  return { total, items }
}

module.exports = {
  listArticlesByCategory,
}
```

2. 新建 `controller/blog.js`，完成请求和响应的处理代码

```js
const {
  listArticlesByCategory,
} = require('../service/blog')

module.exports = {

  async listArticlesByCategory(ctx) {
    // 获取分类下的文章分页数据
    const result = await listArticlesByCategory(ctx, ctx.query)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '获取分类下的文章成功',
      data: result
    }
  },

}
```

3. 在 `router/index.js` 中配置路由

```js
const blogCtrl = require('../controller/blog')
// ...

router.get('/api/articles', blogCtrl.listArticlesByCategory)
```



---



### 实现获取一篇文章的详情接口

> 从博客首页点开一篇文章，调用获取该文章的详情数据的接口

**操作步骤**

1. 在 `service/blog.js` 中，实现按文章 ID 获取文章详情的具体业务逻辑

```js
/**
 * 获取指定 ID 的文章详情数据
 * @param {*} ctx 
 * @param {String} id 
 */
/**
 * 根据 id, 查询具体的文章信息 (联表查询 users categories)
 * @param {*} ctx 
 * @param {*} id 
 */
async function getArticleDetail (ctx, id) {

  // 执行分页查询
  const articleColl = ctx.mongoClient.db().collection('articles')
  // 聚合, 进行联表查询
  const items = await articleColl.aggregate([
    // 过滤条件
    { $match: { _id: ObjectId(id)} },
    // 根据用户 Id, 联表查询出用户的详细信息
    {
      $lookup: {
        from: "users",
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner'
      }
    },
    // 上述联表查询出来的结果, 是一个数组包对象的格式
    { $unwind: '$owner' },
    // 根据分类 Id, 联表查询出分类的详细信息
    {
      $lookup: {
        from: "categories",
        localField: 'categoryId',
        foreignField: '_id',
        as: 'categories'
      }
    },
    // 上述联表查询出来的结果, 是一个数组包对象的格式
    { $unwind: '$categories' },
    {
      $project: {
        ownerId: 0,
        categoryId: 0,
        owner: {
          username: 0,
          password: 0
        }
      }
    }
  ]).toArray()

  return items[0]
}

module.exports = {
  // ...
  getArticleDetail
}
```

2. 在 `controller/blog.js` 中，完成请求和响应的处理代码

```js
const {
  getArticleDetail
} = require('../service/blog')

module.exports = {

  async getArticleDetail(ctx) {
    // 获取文章的各项详情，包括分类、用户等信息
    const result = await getArticleDetail(ctx, ctx.params.id)

    // 返回成功数据
    ctx.body = {
      code: 0,
      message: '获取文章详情成功',
      data: result
    }
  }

}
```

3. 在 `router/index.js` 中配置路由

```js
router.get('/api/articles/:id', blogCtrl.getArticleDetail)
```



---



# 前端项目

## 项目起步

章节目标：能够搭建基于 Vue3 + Element-plus 的项目结构

---

### 初始化前端项目

> 基于 Vite 构建工具创建使用 Vue 3.0 框架的前端项目

Vite 和 Vue3.0 搭配的非常好，生成的脚手架代码紧跟 Vue3.0 发展趋势，拥有更好的开发和构建体验。

**操作步骤**

1. 使用 npm 创建基于 Vite 的项目

```bash
npm init @vitejs/app blog-frontend
```

2. 在出现的选项中选择技术框架为 `vue`：

<img src="Koa 进阶.assets/image-20210629095328448.png" alt="image-20210629095328448" style="zoom:50%;" />

3. 继续选择开发语言为 `TypeScript`：

<img src="Koa 进阶.assets/image-20210629095558977.png" alt="image-20210629095558977" style="zoom:50%;" />

4. 进入生成的项目目录，安装依赖

```bash
 npm i
```

5. 启动开发服务

```bash
npm run dev
```



---



### 安装 SASS 预处理器

> 为 Vue3.0 项目安装 SASS 预处理器

**操作步骤**

1. 安装依赖包

```bash
npm i sass --save-dev
```

2. 在 Vue 单文件组件中启用 SASS：

```vue
<style lang="scss">
</style>
```



---



### 安装 element-plus 组件库

官网地址: https://element-plus.gitee.io/zh-CN/guide/design.html

> 安装 UI 组件库 element-plus

Element UI 是开发 Vue 应用时常用的 UI 组件库，针对 Vue 3.0 推出新版并更名为 Element Plus。

**操作步骤**

1. 安装依赖包

```bash
npm i element-plus --save
```

2. 在 `src/main.ts` 中完整导入

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

createApp(App).use(ElementPlus).mount('#app')
```



---

### vue3 setup-scripts 中注册事件

前置:  插件安装

![image-20211214203425691](assets/image-20211214203425691.png)

**vue3 单文件组件中引入了一种新的脚本类型 setup-scripts**

1. 像平时一样 code, 但是不需要返回任何变量
2. 引入的组件可以直接使用

```jsx
<template>
  <button @click="showAlert">按钮</button>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus';
const showAlert = () => {
  ElMessageBox.alert('我是一个警告', '温馨提示')
}
</script>
```





---

### 设置 element-plus 显示中文

> element-plus 的默认语言是英文，我们通过配置将它变为中文

```ts
<template>
  <el-config-provider :locale="locale">
    <router-view></router-view>
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ElConfigProvider } from 'element-plus'

import zhCn from 'element-plus/lib/locale/lang/zh-cn'

export default defineComponent({
  components: {
    ElConfigProvider,
  },
  setup() {
    return {
      locale: zhCn,
    }
  },
})
</script>
```



---



### 构建路由模块

> 安装和配置路由管理器 Vue Router

Vue 3.0 对应的是 Vue Router 4.0 版本。

**操作步骤**

1. 安装依赖包

注意：一定要指定版本号，否则安装的是 3.x 版本的 Vue Router：

```bash
npm i vue-router@4 --save
```

2. 创建 `src/router/routes.ts` 文件，单独管理路由规则的配置

```typescript
import { RouteRecordRaw } from 'vue-router';

// 定义路由规则
const routes: RouteRecordRaw[] = [
  
]

// 导出路由
export default routes
```

3. 创建 `src/router/index.ts` 文件，编写路由主模块

```typescript
import { createRouter, createWebHashHistory } from "vue-router";
import routes from './routes'

// 创建路由实例
const router = createRouter({ 
  history: createWebHashHistory(), 
  routes: routes
})

// 导出路由实例
export default router
```

4. 在 `src/main.ts` 中引入和启用路由模块

```typescript
// 引入路由模块
import router from './router'

// ...

// 启用路由模块
app.use(router)
```

5. 在 `src/App.vue` 文件中放置路由视口组件 `router-view`

```vue
<template>
  <router-view></router-view>
</template>

<script setup lang="ts">

</script>

<style lang="scss">
</style>
```

---



### 创建公用布局、空页面、及路由配置

> 创建本案例中的主要页面布局组件、页面组件，并配置路由规则

本案例是一个博客网站，如果将页面由外观来划分的话，可分为三类：

1. 公开访问的文章列表页面、文章详情页

2. 登录、注册页面

3. 登录后的管理后台页面

我们会为它们分别创建三个不同的布局组件。

**操作步骤**

1. 创建下列布局组件3

```bash
src/layouts/BlogLayout.vue
src/layouts/SignLayout.vue
src/layouts/MyLayout.vue
```

当前这三个组件的代码如下：

```vue
<!-- src/layouts/BlogLayout.vue -->
<template>
  <el-container>
    <!-- 顶部栏 -->
    <el-header class="fixed-header">
      页头
    </el-header>

    <!-- 主体 -->
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>
```

```vue
<!-- src/layouts/SignLayout.vue -->
<template>
  <div class="sign-container">
    <div class="main">
      <!-- 切换按钮 -->
      <div class="title">
        <router-link to="/sign/login">登录</router-link>
        <b>·</b>
        <router-link to="/sign/register">注册</router-link>
      </div>
      
      <!-- 表单区域 -->
      <router-view />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sign-container {
  display: flex;
  background-color: #f1f1f1;
  font-size: 14px;
  min-width: 900px;
  height: 100vh;
  justify-content: center;
  align-items: center;
  text-align: center;

  .main {
    box-sizing: border-box;
    width: 400px;
    padding: 50px 50px 30px;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 0 8px rgb(0 0 0 / 10%);

    .title {
      margin: 0 auto 50px;
      padding: 10px;
      font-weight: 400;
      color: #969696;
      font-size: 18px;

      a {
        padding: 10px;
        color: #969696;
      }

      .router-link-exact-active {
        font-weight: 700;
        color: #ea6f5a;
        border-bottom: 2px solid #ea6f5a;
      }
    }
  }
}
</style>
```

```vue
<!-- src/layouts/MyLayout.vue -->
<template>
  <el-container>
    <!-- 顶部栏 -->
    <el-header class="fixed-header">
      页头
    </el-header>

    <el-container>
      <!-- 左边侧栏 -->
      <el-aside width="340px">
        边栏
      </el-aside>

      <!-- 右边主体 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>
```



2. 创建下列页面组件（这些组件暂时只需编写最简单的代码即可）：

```bash
# 博客的一些可公开访问的页面
src/views/pub/Home/index.vue
src/views/pub/ArticleDetail/index.vue
src/views/pub/Login/index.vue
src/views/pub/Register/index.vue

# 登录后才能访问的页面
src/views/my/ArticleList/index.vue
src/views/my/UserProfile/index.vue
```



3. 编写路由规则

在 `src/router/routes.js` 中创建路由规则：

```js
import { RouteRecordRaw } from 'vue-router';
import BlogLayout from '../layouts/BlogLayout.vue';
import SignLayout from '../layouts/SignLayout.vue'
import MyLayout from '../layouts/MyLayout.vue';

// 定义路由
const routes: RouteRecordRaw[] = [{
  path: '/',
  component: BlogLayout,
  children: [
    {
      path: '',
      component: () => import('../views/pub/Home/index.vue'),
    },
    {
      path: 'categories/:id',
      component: () => import('../views/pub/Home/index.vue'),
    },
    {
      path: 'articles/:id',
      component: () => import('../views/pub/ArticleDetail/index.vue'),
    },
  ]
}, {
  path: '/sign',
  component: SignLayout,
  children: [
    {
      path: 'login',
      component: () => import('../views/pub/Login/index.vue')
    },
    {
      path: 'register',
      component: () => import('../views/pub/Register/index.vue')
    },
  ]
}, {
  path: '/my',
  component: MyLayout,
  children: [
    {
      path: 'articles',
      component: () => import('../views/my/ArticleList/index.vue')
    },
    {
      path: 'profile',
      component: () => import('../views/my/UserProfile/index.vue')
    },
  ]
}]

// 导出路由
export default routes
```

配置完路由规则后，可以测试一下，确认能否访问到这些页面。



### 配置路径别名 @

1. vite.config.js

```jsx
import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, 'src')}
    ]
  },
  plugins: [vue()]
})

```

2. 安装 ts 声明包, 安装后重启vscode

```jsx
npm i @types/node --save
```

![image-20211214212242242](assets/image-20211214212242242.png)

​	这个时候使用 @已经没有问题了，但是还不能通过 CTRL + 点击 跳转到定义位置



3. 接下来就要配置 `tsconfig.json` 文件来解决, 增加配置项 `baseUrl` 和 `paths`

```jsx
{
  "compilerOptions": {
    "target": "esnext",
    "useDefineForClassFields": true,
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["esnext", "dom"],
    "baseUrl": ".", // paths 路径解析起点
    "paths": {
      "@/*": ["src/*"] // 别名路径设置
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```



---



### 创建全局状态管理器 Vuex

> 使用 Vuex 实现全局状态管理

**操作步骤**

1. 安装依赖包

```bash
npm i vuex@next --save
```

2. 创建 `src/store/index.ts`，并编写基本的状态管理器创建代码：

```js
import { createStore } from 'vuex'

// 创建状态管理器实例
const store = createStore({
  state: {
    token: null
  },
  mutations: {},
  actions: {}
})

export default store
```

3. 在 `src/main.ts` 中引入刚刚创建的 store：

```typescript
// 引入状态管理模块
import store from './store'

// ...

// 启用状态管理模块
app.use(store)
```



---



### 封装网络请求库 axios

> 安装网络请求库 axios，并进行合理的封装

**操作步骤**

1. 安装依赖包

```bash
npm i axios --save
```

2. 新建 `src/utils/request.ts`，封装配置 Axios 实例：

```tsx
import axios from 'axios'
import { ElMessage } from 'element-plus'
import store from '../store'

// 后端基础路径
export const baseURL = 'http://localhost:8000'

// 创建 Axios 实例
const http = axios.create({
  baseURL,
  timeout: 20000
})

// 请求拦截器
http.interceptors.request.use(config => {
  // 为需要授权访问的 API 设置请求头授权信息
  if (config?.url?.indexOf('/api/user') === 0) {
    // 从 Vuex 中获取 token 并进行请求头的设置
    config.headers.Authorization = `Bearer ${store.state.token}`
  }
  return config
})

// 响应拦截器
http.interceptors.response.use(response => {
  return response
}, error => {
  // 统一错误处理：根据后端返回的错误代码，显示提示消息
  const response = error.response
  const data = response.data

  ElMessage.error(`${data.message}（错误代码: ${data.code}）`)

  return Promise.reject(error)
})

// 导出 Axios 实例
export default http
```

3. 继续在 `src/utils/request.ts` 中，编写发起请求的工具函数：

```typescript
import axios, { AxiosRequestConfig } from 'axios'

// ...

// =============================================================

/**
 * 定义请求的返回值结构类型（和服务端的返回值格式一致）
 */
export interface ApiResult<T = any> {
  code: number;       // 错误代码
  message: string;    // 提示信息
  data: T;            // 业务数据
}

/**
 * 封装四个工具函数：发送 get、post、put、del 请求
 * 
 * 目的：这些方法会预取响应中的实际数据部分（data 字段），使后续代码更简洁一些
 */
export function get<T = any>(url: string, config?: AxiosRequestConfig | undefined) {
  const promise = http.get<ApiResult<T>>(url, config)

  // 问题：为什么不在请求拦截器中通过 return response.data.data 的方式来实现？
  // 答案：使用拦截器统一处理会让代码丧失一定的灵活性（比如这样的需求：在某些请求中获取响应头的信息）
  return promise.then(res => res.data.data)
}

export function del<T = any>(url: string, config?: AxiosRequestConfig | undefined) {
  const promise = http.delete<ApiResult<T>>(url, config)
  return promise.then(res => res.data.data)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig | undefined) {
  const promise = http.post<ApiResult<T>>(url, data, config)
  return promise.then(res => res.data.data)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig | undefined) {
  const promise = http.put<ApiResult<T>>(url, data, config)
  return promise.then(res => res.data.data)
}
```



---



## 注册登录页面
章节目标：能够实现登录注册功能

---

### 实现用户注册页布局

> 完成用户注册页面的静态布局代码

编辑 `src/views/pub/Register/index.vue` 组件代码：

**模板**

```vue
<template>
  <el-form
    :model="formData"
    :rules="formRules"
    ref="registerForm"
    class="login-form"
    status-icon
  >
    <el-form-item prop="username">
      <el-input
        type="text"
        v-model="formData.username"
        autocomplete="off"
        placeholder="您的账号"
      >
        <template #prefix>
          <el-icon><user /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item prop="password">
      <el-input
        type="password"
        v-model="formData.password"
        autocomplete="off"
        placeholder="设置密码"
      >
        <template #prefix>
          <el-icon><lock /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item prop="nickname">
      <el-input
        type="text"
        v-model="formData.nickname"
        autocomplete="off"
        placeholder="您的昵称"
      >
        <template #prefix>
          <el-icon><collection /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item>
      <el-button
        type="success"
        round
        class="btn-register"
        @click="registerHandler"
      >
        注 册
      </el-button>
      <router-link to="/sign/login" class="msg-register">
        已有账号？去登录
      </router-link>
    </el-form-item>
  </el-form>
</template>
```



**样式**

```vue
<style lang="scss" scoped>
.btn-register {
  width: 100%;
}
.msg-register {
  margin: 10px 0;
  padding: 0;
  text-align: center;
  font-size: 12px;
  line-height: 20px;
  color: #969696;
}
::v-deep .el-icon {
  height: 40px;
  line-height: 40px;
}
</style>
```



**逻辑**

```vue
<script lang="ts" setup>
import { reactive, ref } from "vue";
import {
  User,
  Collection,
  Lock
} from '@element-plus/icons-vue'

// 状态：表单数据
const formData = reactive({
  username: "",
  password: "",
  nickname: "",
});

// 表单验证规则
const formRules = {
  username: {
    required: true,
    trigger: "blur",
    message: "账号是必填项",
  },
  password: {
    required: true,
    trigger: "blur",
    message: "密码是必填项",
  },
  nickname: {
    required: true,
    trigger: "blur",
    message: "昵称是必填项",
  },
};

// 状态：表单组件的引用
const registerForm = ref<any>(null);

// 事件监听：点击注册按钮
const registerHandler = async () => {
	// TODO：完成注册逻辑
};
</script>
```



---



### 实现用户注册

> 完成注册页面的业务逻辑代码

**操作步骤**

1. 新建 `src/apis/auth.ts` ，编写如下 API 请求代码：

```typescript
import { post } from '@/utils/request'

export function register(data: {
  username: string;
  password: string;
  nickname: string;
}) {
  return post<boolean>('/api/register', data)
}
```

2. 在页面组件中，完成点击注册按钮后的表单验证、接口调用、页面跳转操作

```vue
<script lang="ts" setup>
  import { reactive, ref } from "vue";
  import { useRouter } from "vue-router";
  import { ElMessageBox } from "element-plus";
  import { register } from "@/apis/auth";

  // ...

  // 获取路由管理器实例
  const router = useRouter();

  // 事件监听：点击注册按钮
  const registerHandler = async () => {
    try {
      // 验证表单
      await registerForm.value.validate();

      // 请求注册
      await register(formData);

      // 成功提示
      await ElMessageBox.alert("账号注册成功，前往登录", "提示");

      // 跳转到登录页
      await router.replace("/sign/login");
    } catch (e) {}
  };
</script>
```

---



### 实现用户登录页布局

编辑 `src/views/pub/Login/index.vue` 组件的代码：

**模板**

```vue
<template>
  <el-form
    :model="formData"
    :rules="formRules"
    ref="loginForm"
    class="login-form"
    status-icon
  >
    <el-form-item prop="username">
      <el-input
        type="text"
        v-model="formData.username"
        autocomplete="off"
        placeholder="您的账号"
      >
        <template #prefix>
          <el-icon><user></user></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item prop="password">
      <el-input
        type="password"
        v-model="formData.password"
        autocomplete="off"
        placeholder="登录密码"
      >
        <template #prefix>
          <el-icon><lock></lock></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item prop="captchaCode">
      <el-input
        type="text"
        v-model="formData.captchaCode"
        autocomplete="off"
        placeholder="图形验证码"
      >
        <template #prefix>
          <el-icon><key></key></el-icon>
        </template>
        <template #append>
          <img
            class="captcha"
            :src="captchaData.captchaImage"
            @click="refreshCaptcha"
            width="100"
          />
        </template>
      </el-input>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" round class="btn-login" @click="loginHandler">
        登 录
      </el-button>
      <router-link to="/sign/register" class="msg-login">
        还没账号？免费注册
      </router-link>
    </el-form-item>
  </el-form>
</template>
```

**样式**

```vue

<style lang="scss" scoped>
.btn-login {
  width: 100%;
}
.msg-login {
  margin: 10px 0;
  padding: 0;
  text-align: center;
  font-size: 12px;
  line-height: 20px;
  color: #969696;
}
.captcha {
  cursor: pointer;
}
::v-deep .el-icon {
  height: 40px;
  line-height: 40px;
}
</style>
```

**逻辑**

```vue
<script lang="ts" setup>
  import { reactive, ref } from "vue";
  import { User, Lock, Key } from '@element-plus/icons-vue'

  // 状态：表单数据
  const formData = reactive({
    username: "",
    password: "",
    captchaCode: "",
  });

  // 表单验证规则
  const formRules = {
    username: {
      required: true,
      trigger: "blur",
      message: "账号是必填项",
    },
    password: {
      required: true,
      trigger: "blur",
      message: "密码是必填项",
    },
    captchaCode: {
      required: true,
      trigger: "blur",
      message: "验证码是必填项",
    },
  };

  // 状态：验证码数据
  const captchaData = reactive({
    captchaKey: "", // 验证码唯一识别
    captchaImage: "", // 验证码图片
  });

  // 状态：表单组件的引用（注意变量名要和组件标签的 ref 值相同）
  const loginForm = ref<any>(null);

  // 函数：刷新验证码数据
  const refreshCaptcha = async () => {
 		// TODO：请求并获取图形验证码数据
  };
  
  // 事件：点击登录按钮
  const loginHandler = async () => {
    // TODO：登录逻辑
  };
</script>
```



---



### 实现生成图片验证码

**操作步骤**

1. 在 `src/apis/auth.ts` 中添加如下 API 请求代码：

```typescript
import { get } from '@/utils/request'

export function captcha() {
  return get<{ key: string, svg: string }>('/api/captcha')
}
```

2. 在登录页面组件中调用

```vue
<script lang="ts" setup>
  import { captcha } from "@/apis/auth";

  // ...

  // 函数：刷新验证码数据
  const refreshCaptcha = async () => {
    try {
      const { key, svg } = await captcha();
      captchaData.captchaKey = key;
      captchaData.captchaImage = svg;
    } catch (e) { }
  };

  // 一进登录页面，即请求图形验证码
  refreshCaptcha()
</script>
```

以上代码编写完成后，即可在登录界面中看到图形验证码了。

---



### 抽出可复用状态及更新逻辑

> Vue 3 中使用 Composition API 后，可以采用的代码复用方式

Vue 3.0 中如果采用了 Composition API，可以将一些功能关联的响应式状态和更新这些状态的函数封装在独立的函数中，借助函数天然的可复用性，可以被任意组件调用。

这种用法来源于 React 框架的 Hooks 函数，所以在 Vue 3.0 中，也些函数也被称为 Hooks。

本章节会使用这种方式封装图形验证码相关的操作。



**操作步骤**

1. 创建 `src/hooks`目录，并在该目录下创建 `use-captcha.ts`

2. 将登录页面组件中的响应式状态 `captchaData` 、及函数 `refreshCaptcha` 挪到上面新建的 `use-captcha.ts`中

```typescript
import { reactive } from "vue";
import { captcha } from "../apis/auth";

/**
 * 自定义状态管理函数：验证码相关状态
 */
export function useCaptcha() {
  // 状态：验证码数据
  const captchaData = reactive({
    captchaKey: "", // 验证码唯一识别
    captchaImage: "", // 验证码图片
  });

  // 函数：刷新验证码数据
  const refreshCaptcha = async () => {
    try {
      const { key, svg } = await captcha();
      captchaData.captchaKey = key;
      captchaData.captchaImage = svg;
    } catch (e) { }
  };

  return { captchaData, refreshCaptcha };
}
```

3. 在登录页面组件中删除原先的 `captchaData` 及 `refreshCaptcha`代码，替换为从 `use-captcha.ts` 中获取的内容：

```vue
<script lang="ts" setup>
import { useCaptcha } from "../../../hooks/use-captcha";
// ...
  
// 获取验证码相关的状态和管理函数
const { captchaData, refreshCaptcha } = useCaptcha();
  
// ...
</script>
```



---



### 实现用户登录

> 完成点击登录按钮后的登录逻辑

**操作步骤**

1. 在 `src/apis/auth.ts` 中，添加如下 API 请求代码：

```typescript
export function login(data: {
  username: string;
  password: string;
  captchaKey: string;
  captchaCode: string;
}) {
  return post<string>('/api/login', data)
}
```

2. 在 `src/store/index.ts` 中，添加登录和更新 token 相关的 actions 和 mutations：

```typescript
import { createStore, Store } from 'vuex'
import { login } from '../apis/auth'

// 创建状态管理器实例
const store = createStore({
  state: {
    token: localStorage.getItem('token')
  },
  mutations: {
    // 设置token
    setToken (state, token) {
      state.token = token

      // localStorage本地缓存
      if (state.token) {
        localStorage.setItem('token', state.token)
      } else {
        localStorage.removeItem('token')
      }
    }
  },
  actions: {
    async login ({ commit }, loginParams) {
      const token = await login(loginParams)
      commit('setToken', token)
    }
  }
})

export default store
```

3. 在 `src/views/pub/Login/index.vue` 中，实现点击登录按钮的逻辑：

```vue
<script lang="ts" setup>
  import { useStore } from "vuex";
  import { useRouter } from "vue-router";

  const store = useStore()
  const router = useRouter()

  // ...

  // 事件：点击登录按钮
  const loginHandler = async () => {
    try {
      // 验证表单
      await loginForm.value.validate();

      // 执行登录
      await store.dispatch("login", {
        ...formData,
        captchaKey: captchaData.captchaKey,
      });

      // 登录成功，跳转到后台主页（文章管理）
      await router.replace("/my/articles");
    } catch (e) {
      // 发生错误后刷新图片验证码
      refreshCaptcha();
    }
  };

  // ...
</script>
```



---



### 实现后台页面的访问控制

> 使用路由守卫，实现后台页面只有成功登录后才能访问

**操作步骤**

1. 新建 `src/apis/profile.ts`，编写用户个人信息的 API 调用代码：

```typescript
import { get, put } from '../utils/request'

export function getUserProfile() {
  return get('/api/user/profile')
}
```

2. 在 `src/store/index.ts` 中，添加获取登录用户信息、及清理登录用户信息的 state、actions 和 mutations：

```typescript
import Vuex from 'vuex'
import { login } from '../apis/auth'
import { getUserProfile } from '../apis/profile'

// 创建状态管理器实例
const store = createStore({
  state: {
    token: localStorage.getItem('token'),
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}')
  },

  mutations: {
    // ...

    // 设置用户资料
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo

      if (state.userInfo.username) {
        localStorage.setItem('userInfo', JSON.stringify(state.userInfo))
      } else {
        localStorage.removeItem('userInfo')
      }
    }
  },

  actions: {
    // ...

    // 请求并设置用户资料
    async getUserInfo(store) {
      const profile = await getUserProfile()
      store.commit('setUserInfo', profile)
    },

    // 清除用户登录信息
    clearLogin (store) {
      store.commit('setToken', '')
      store.commit('setUserInfo', {})
    }
  }
})

// 导出状态管理器实例
export default store
```

3. 创建 `src/permission.ts`，在该模块中编写路由守卫：

```typescript
import router from './router/index'
import store from './store'

// 设置路由守卫
router.beforeEach(async (to, from, next) => {
  const token = store.state.token

  // 1. 有 Token 的情况
  if (token) {
    // 如果是登录页，则直接进入后台首页（即文章管理页）
    if (to.path === '/sign/login') {
      next('/my/articles')
    }
    // 如果是其他页面，则检查是否已经有用户信息
    else {
      const userInfo = store.state.userInfo

      // 如果已存在用户信息，则放行
      if (userInfo?.username) {
        next()
      }
      // 如果不存在用户信息，则获取
      else {
        try {
          // 获取成功，放行
          await store.dispatch('getUserInfo')
          next({ ...to, replace: true })
        } catch (e) {
          // 获取失败，则清空现有 token 等信息后跳到登录页
          store.dispatch('clearLogin')
          next('/sign/login')
        }
      }
    }
  }
  // 2. 没有 Token 的情况
  else {
    // 如果是后台页面，则跳转到登录页
    if (to.path.indexOf('/my') === 0) {
      next('/sign/login')
    }
    // 如果是公开页面，则放行进入
    else {
      next()
    }
  }
})
```

4. 在 `src/main.ts` 中引入

```typescript
import './permission'
```

实现以上的路由守卫，就可以根据 token 拦截未授权的页面访问（并自动清除用户信息后跳转到登录页）；并且在允许已登录的访问中，自动获取用户的详情信息。

5. 另外，我们需要完善一下请求模块 `request.ts` 中的响应拦截器：

```typescript
// 响应拦截器
http.interceptors.response.use(response => {
  return response
}, error => {
  // 统一错误处理：根据后端返回的错误代码，显示提示消息
  const response = error.response
  const data = response.data

  ElMessage.error(`${data.message}（错误代码：${data.code}）`)

  // 如果后端返回 401 未授权状态码，则清除登录信息后跳转登录页
  if (response.status === 401) {
    store.dispatch('clearLogin')
    return router.replace('/sign/login')
  }

  return Promise.reject(error)
})
```



## 封装布局页面

### 封装页面顶部页头组件

> 将页头封装成一个组件，并在页面布局组件中调用

页头上会显示Logo，用户头像，登录，注册、登出等按钮。

新建 `src/components/AppHeader.vue` => 静态结构

```jsx
<template>
  <nav class="top-nav">
    <div class="nav-container limit-width">
      <router-link class="logo" to="/">
        <span>简博客</span>
      </router-link>

      <!-- 未登录时显示的内容 -->
      <div class="logininfo">
        <router-link to="/sign/login">登录</router-link>
        <b>·</b>
        <router-link to="/sign/register">注册</router-link>
      </div>

      <!-- 已登录时显示的内容 -->
      <div class="userinfo">
        <span></span>
        <el-dropdown>
          <span class="el-dropdown-link">
            <div class="avatar">
              <img
                class="avatar-img"
                alt=""
              />
            </div>
            <i class="el-icon-caret-bottom el-icon--right"></i>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>

</script>

<style lang="scss" scoped>
.top-nav {
  background: #ffffff;

  .limit-width {
    min-width: 768px;
    max-width: 1440px;
    margin: 0 auto;
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;

    .logo {
      font-size: 28px;
      color: #ea6f5a;
    }

    .logininfo {
      a {
        color: #969696;
        padding: 0 10px;
      }
      b {
        color: #969696;
      }
    }

    .userinfo {
      display: flex;
      align-items: center;
      color: #969696;

      .avatar {
        width: 40px;
        height: 40px;
        border: 1px solid #dddddd;
        border-radius: 50%;
        padding: 1px;

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          vertical-align: middle;
        }
      }

      .el-dropdown-link {
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        padding: 6px 10px 6px 16px;

        &:hover {
          background-color: #f5f5f5;
        }
      }

      .el-icon-arrow-down {
        font-size: 12px;
      }
    }
  }
}
</style>
```



**操作步骤**

1. 处理用户信息 和 处理下拉菜单

```vue
<template>
  <nav class="top-nav">
    <div class="nav-container limit-width">
      <router-link class="logo" to="/">
        <span>简博客</span>
      </router-link>

      <!-- 未登录时显示的内容 -->
      <div class="logininfo" v-if="!profile?.username">
        <router-link to="/sign/login">登录</router-link>
        <b>·</b>
        <router-link to="/sign/register">注册</router-link>
      </div>

      <!-- 已登录时显示的内容 -->
      <div class="userinfo" v-else>
        <span>{{ profile?.nickname }}</span>
        <el-dropdown @command="commandHandler">
          <span class="el-dropdown-link">
            <div class="avatar">
              <img
                class="avatar-img"
                :src="getAvatarImage(profile?.avatar)"
                alt=""
              />
            </div>
            <i class="el-icon-caret-bottom el-icon--right"></i>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { getAvatarImage } from "@/utils/resource";

// 获取状态管理器
const store = useStore();

// 获取路由管理器
const router = useRouter();

// 计算属性：用户信息
const profile = computed(() => store.state.userInfo);

// 事件：下拉菜单
const commandHandler = (command: string) => {
  if (command === "profile") {
    router.push("/my/profile");
  } else if (command === "logout") {
    store.dispatch("clearLogin");
    router.push("/sign/login");
  }
};
</script>
```

2. 编写一个工具方法：从用户个人资料中获取完整头像图片路径，否则使用默认头像的图片路径

   新建 `src/utils/resource.ts`，并编写如下函数：

```jsx
import { baseURL } from "./request";
import defaultAvatar from "../assets/avatar.png";

/**
 * 获取头像全路径。如果 path 参数无值，则使用默认头像
 * @param path 从后端得到的头像文件的相对路径
 * @returns 
 */
export function getAvatarImage(path: string): string {
  return path ? baseURL + path : defaultAvatar
}
```



3. 在 `src/layouts/BlogLayout.vue`和`src/layouts/MyLayout.vue`两个布局组件中，调用页头组件

```vue
<template>
  <el-container>
    <!-- 顶部栏 -->
    <el-header class="fixed-header">
      <app-header />
    </el-header>

    <!-- ...... -->
  </el-container>
</template>

<script lang="ts" setup>
import AppHeader from "../components/AppHeader.vue";
</script>
```

4. 在 `src/App.vue`中，添加一些全局样式

```vue
<style lang="scss">
// 全局样式
html,
body {
  height: 100%;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, SF UI Display, Arial, PingFang SC,
    Hiragino Sans GB, Microsoft YaHei, WenQuanYi Micro Hei, sans-serif;
}

a {
  text-decoration: none;
}

.el-header {
  border-bottom: 1px solid #f0f0f0;
}

.fixed-header {
  position: sticky;
  top: 0;
  left: 0;
}
</style>
```



---



### 封装后台菜单栏组件

> 为登录后的后台管理页面，实现左侧菜单栏组件

**操作步骤**

1. 新建`src/components/MySideMenu.vue`

```vue
<template>
  <ul class="menu-list">
    <li class="menu-item">
      <router-link to="/my/articles">
        <el-icon><Tickets></Tickets></el-icon>我的文章
      </router-link>
    </li>
    <li class="menu-item">
      <router-link to="/my/profile">
        <el-icon><Setting></Setting></el-icon>个人设置
      </router-link>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { Tickets, Setting } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.menu-list {
  width: 280px;
  margin-top: 30px;
  list-style: none;

  .menu-item {
    a {
      display: block;
      padding: 10px 15px;
      color: #333;

      &.router-link-exact-active {
        background-color: #f0f0f0;
        border-radius: 4px;
      }
    }

    .menu-icon {
      padding: 8px;
      background: #a0a0a0;
      border-radius: 4px;
      color: #fff;
      font-weight: bold;
      font-size: 18px;
      margin-right: 10px;
    }
    .el-icon {
      vertical-align: middle;
      font-size: 30px;
      margin-right: 5px;
    }
  }
}
</style>
```

2. 在 `src/layouts/MyLayout/index.vue`中，调用菜单栏组件

```vue
<template>
  <el-container>
    <!-- 顶部栏 -->
    <!-- ... -->

    <el-container>
      <!-- 左边侧栏 -->
      <el-aside width="340px">
        <my-side-menu />
      </el-aside>

      <!-- 右边主体 -->
      <!-- ... -->
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import MySideMenu from "../components/MySideMenu.vue";
// ...
</script>
```



---



## 文章管理页面

章节目标：能够实现文章管理功能

**静态结构:**

```jsx
<template>
  <div class="article-container">
    <!-- =============== 搜索工具栏 =============== -->
    <div class="search-bar">
      <el-form
        ref="searchForm"
        label-width="100px"
        class="search-form"
        inline
      >
        <el-form-item>
          <el-input
            type="text"
            autocomplete="off"
            placeholder="请输入文章标题关键字"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-select
            placeholder="请选择文章分类"
          >
            <el-option label="全部分类" value=""></el-option>
            <el-option>
            </el-option>
            <template #prefix>
              <el-icon><files></files></el-icon>
            </template>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            plain
            type="primary"
          >
            <el-icon><search></search></el-icon>
            搜索
          </el-button>
        </el-form-item>
      </el-form>

      <div class="tool-buttons">
        <el-button
          plain
          type="success"
        >
          <el-icon><plus></plus></el-icon>
          创建文章
        </el-button>
      </div>
    </div>

    <!-- =============== 文章列表 =============== -->
    <el-table class="article-table">
      <el-table-column label="文章标题"></el-table-column>
      <el-table-column
        label="所属分类"
        width="200"
        align="center"
      >
      </el-table-column>
      <el-table-column
        label="创建时间"
        width="200"
        align="center"
      >
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <el-button
            type="text"
          >
            <el-icon><edit></edit></el-icon>
            编辑
          </el-button>

          <el-button
            type="text"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>


<script lang="ts" setup>
import { Search, Edit, Files, Plus, Delete } from '@element-plus/icons-vue'


</script>

<style lang="scss" scoped>
.article-container {
  padding-right: 30px;

  .search-bar {
    display: flex;
    margin-top: 10px;
    margin-bottom: 20px;
  }

  .article-table {
    margin-bottom: 30px;
  }
}
</style>
```

---

### 获取文章列表数据

1 新建 `src/apis/article.ts`，编写文章相关的 API 调用代码：

```typescript
import { get, post, put, del } from '../utils/request'

export function listArticles(data: {
  categoryId?: string;
  keyword?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  return get<{ total: number, items: any[] }>('/api/user/articles', {
    params: data
  })
}
```

2 编辑 `src/views/my/ArticleList/index.vue` 发送请求获取数据

```jsx
// 状态：文章列表分页数据
const listData = reactive({
  total: 0,
  items: [] as any[],
});
// 状态：查询文章列表的相关参数
const listParams = reactive({
  categoryId: "",
  keyword: "",
  pageNo: 1,
  pageSize: 5,
});
// 请求文章数据
const loadArticleList = async () => {
  const { total, items } = await listArticles(listParams);
  listData.total = total;
  listData.items = items;
  console.log(items)
}
```

3 结合数据动态渲染文章

```jsx
<!-- =============== 文章列表 =============== -->
<el-table class="article-table" :data="listData.items">
  <el-table-column prop="title" label="文章标题"></el-table-column>
  <el-table-column
    prop="category.name"
    label="所属分类"
    width="200"
    align="center"
  >
  </el-table-column>
  <el-table-column
    prop="createdAt"
    label="创建时间"
    width="200"
    align="center"
  >
  </el-table-column>
  <el-table-column label="操作" width="200" align="center">
    <template #default="scope">
      <el-button
        type="text"
      >
        <el-icon><edit></edit></el-icon>
        编辑
      </el-button>

      <el-button
        type="text"
      >
        <el-icon><delete></delete></el-icon>
        删除
      </el-button>
    </template>
  </el-table-column>
</el-table>
```



### 实现日期数据格式化

> 文章表格中有日期字段数据，当前未作格式化，我们需要实现一个日期格式化函数来进行格式化

**操作步骤**

1. 新建 `src/utils/format.ts`，利用 dayjs 实现一个日期格式化函数

```typescript
// 安装 Element-Plus 组件库时默认就会安装 dayjs，因此不需要额外安装
import dayjs from "dayjs";

/**
 * 将后端给出的字符串格式日期进行格式化
 * 例如：2021-07-07 08:08
 * @param date 字符串格式日期
 * @returns 
 */
export function formatDate(date: string): string {
  return dayjs(date).format("YYYY/MM/DD HH:mm");
};
```

2. 在 `src/views/my/ArticleList/index.vue` 中格式化日期

```vue
<template>
  <!-- ....... -->

	<el-table-column
        prop="createdAt"
        label="创建时间"
        width="200"
        align="center"
      >
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
  </el-table-column>

  <!-- ....... -->
</template>

<script lang="ts" setup>
import { formatDate } from "@/utils/format";
</script>
```



### 实现分页效果

1 准备分页结构

```jsx
<!-- =============== 分页栏 =============== -->
<el-pagination
  layout="total, sizes, prev, pager, next"
  :total="listData.total"
  :page-sizes="[5, 10, 15, 20]"
  v-model:pageSize="listParams.pageSize"
  v-model:currentPage="listParams.pageNo"
>
</el-pagination>
```

2  watch 监视参数的变化, 一旦变化, 重新发送请求渲染

```jsx
// 监听: 根据分页数据的变化, 加载文章数据
watch(
  [() => listParams.pageNo, () => listParams.pageSize], 
  () => loadArticleList(), 
  { immediate: true }
)
```



### 选择文章分类

**操作步骤**

1 新建 `src/apis/category.ts`，编写分类相关的 API 调用代码

```typescript
import { get } from '../utils/request'

export function listCategories() {
  return get<any[]>('/api/categories')
}
```

2 编辑 `src/views/my/ArticleList/index.vue` 发送请求获取数据

```vue
<script lang="ts" setup>
import { Search, Edit, Files, Plus } from '@element-plus/icons-vue'
import { ref } from 'vue';
import { listCategories } from '@/apis/category';

// 状态: 获取所有文章分类
const categories = ref<any[]>([])

// 请求文章分类数据
const loadCagetoryList = async () => {
  const items = await listCategories()
  categories.value = items
}
loadCagetoryList()
</script>
```

3 视图绑定

```jsx
<el-select
  v-model="listParams.categoryId"
  placeholder="请选择文章分类"
>
```



### 实现搜索功能

1 输入框视图绑定

```jsx
<el-input
  v-model="listParams.keyword"
  type="text"
  autocomplete="off"
  placeholder="请输入文章标题关键字"
></el-input>


<el-button
  plain
  type="primary"
  @click="searchHandler"
>
  <el-icon><search></search></el-icon>
  搜索
</el-button>
```

2 注册事件

```jsx
// 事件：点击搜索按钮
const searchHandler = () => {
  // 页码设为第一页
  listParams.pageNo = 1;
  loadArticleList();
};
```



---



### 创建弹窗组件：显示弹框

> 将用来作为新增或编辑文章的界面，封装成一个弹窗组件的形式

该弹窗组件可以传入三个 props 属性：

- categories：所有文章分类
- article：要编辑的文章
- visible：控制弹窗的显示、隐藏

该弹窗组件有一个自定义事件可以监听：

- complete：新建或编辑文章完成

**操作步骤**

1. 在 `src/apis/article.ts` 中，添加新增和编辑文章的 API 调用代码

```typescript
export function createArticle(data: {
  title: string,
  summary: string,
  content: string,
  categoryId: string,
}) {
  return post<boolean>('/api/user/articles', data)
}

export function updateArticle(data: {
  _id: string,
  title: string,
  summary: string,
  content: string,
  categoryId: string,
}) {
  return put<boolean>(`/api/user/articles/${data._id}`, data)
}

export function getArticle(id: string) {
  return get(`/api/user/articles/${id}`)
}
```

2. 新建 `src/views/my/ArticleList/components/CreateOrUpdateForm.vue`，编写弹框组件 (静态结构)

```jsx
<template>
  <!-- 弹窗 -->
  <el-dialog
    center
    fullscreen
    :title="'新增文章'"
    :show-close="true"
  >
    <!-- 弹窗中的表单 -->
    <el-form
      ref="dialogForm"
      label-width="100px"
      class="article-form"
      status-icon
    >
      <el-form-item label="文章标题" prop="title">
        <el-input
          type="text"
          autocomplete="off"
        ></el-input>
      </el-form-item>

      <el-form-item label="文章分类" prop="categoryId">
        <el-select>
          <el-option>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="文章概要" prop="summary">
        <el-input
          type="textarea"
          placeholder="请输入文章概要介绍"
          :rows="3"
        ></el-input>
      </el-form-item>

      <el-form-item label="文章正文" prop="content">
        富文本编辑器
      </el-form-item>
    </el-form>

    <!-- 弹窗底部的按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button type="default"> 取 消 </el-button>
        <el-button type="primary"> 确 定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>

</script>

<style lang="scss" scoped>
.article-form {
  width: 960px;
  margin: 0 auto;
}
</style>
```

3 准备状态

```jsx
import { watch } from 'vue';
import { reactive } from 'vue';

interface Category {
  createdAt: string,
  name: string,
  _id: string
}

// 定义组件的 props
const props = defineProps({
  categories: {
    type: Array as PropType<Category[]>,
    default: () => ({})
  },
  article: {
    type: Object,
    default: () => ({})
  },
  visible: {
    type: Boolean,
    default: false
  }
})

// 对话框界面状态
const dialogStatus = reactive({
  isVisible: false,
  isEdit: false
})

// 监听: props 的变化
watch([() => props.visible, () => props.article], (newVals) => {
  const [visible, article] = newVals
  // 设置对话框是否可见
  dialogStatus.isVisible = visible
  // 设置是否为编辑模式
  dialogStatus.isEdit = !!article._id
})
```

4 使用组件, 基本状态

```jsx
<create-or-update-form
  v-model:visible="dialogVisible"
  :article="dialogFormData"
  :categories="categories"
/>


// 状态：对话框显⽰、隐藏
const dialogVisible = ref<boolean>(false);
// 状态：对话框表单数据
const dialogFormData = reactive({
  _id: "",
  title: "",
  summary: "",
  content: "",
  categoryId: "",
});
```

5 给创建按钮注册点击事件

```jsx
<el-button
  plain
  type="success"
  @click="createHandler"
>
  <el-icon><plus></plus></el-icon>
  创建文章
</el-button>

// 事件: 点击创建按钮
const createHandler = () => {
  // 显示对话框
  dialogVisible.value = true
}
```

6 关闭状态

```jsx
<el-dialog
  center
  fullscreen
  v-model="dialogStatus.isVisible"
  :title="'新增文章'"
  :show-close="false"
  :before-close="cancelHandler"
>
```

```ts
// 事件触发器：列出本组件中允许触发的所有⾃定义事件
const emit = defineEmits(["update:visible"]);

// 函数：关闭对话框
const cancelHandler = () => {
  dialogStatus.isVisible = false;
  emit("update:visible", false);
};
```



### 创建弹窗组件：表单绑定

1. 表单数据

```jsx
// 状态：表单数据
const formData = reactive({
  _id: "",
  title: "",
  summary: "",
  content: "",
  categoryId: "",
});

// 表单验证规则
const formRules = {
  title: {
    required: true,
    trigger: "blur",
    message: "⽂章标题是必填项",
  },
  categoryId: {
    required: true,
    trigger: "blur",
    message: "⽂章分类是必填项",
  },
};
```

2. 表单绑定

```jsx
<el-form
  ref="dialogForm"
  label-width="100px"
  class="article-form"
  status-icon
  :model="formData"
  :rules="formRules"
>
  <el-form-item label="文章标题" prop="title">
    <el-input
      type="text"
      autocomplete="off"
      v-model="formData.title"
    ></el-input>
  </el-form-item>

  <el-form-item label="文章分类" prop="categoryId">
    <el-select
      placeholder="请选择文章分类"
      v-model="formData.categoryId"
    >
      <el-option
        v-for="category in categories"
        :key="category._id"
        :label="category.name"
        :value="category._id"
        >
        </el-option>
    </el-select>
  </el-form-item>

  <el-form-item label="文章概要" prop="summary">
    <el-input
      type="textarea"
      placeholder="请输入文章概要介绍"
      v-model="formData.summary"
      :rows="3"
    ></el-input>
  </el-form-item>

  <el-form-item label="文章正文" prop="content">
    富文本编辑器
  </el-form-item>
</el-form>
```



---

### 富文本编辑器

> 我们采用 TinyMCE 作为本项目的富文本编辑器

TinyMCE 官方网站：https://www.tiny.cloud

**操作步骤**

1. 安装依赖包

   ```bash
   npm i tinymce @tinymce/tinymce-vue --save
   ```


2. 下载中文语言包：https://www.tiny.cloud/get-tiny/language-packages/

3. 新建 `public/tinymce` 文件夹，然后将下载包解压，把里面的 `langs` 文件夹复制到  `public/tinymce`；再将`node_modules/tinymce/skins` 文件夹也复制到 `public/tinymce` 
4. 结构准备

```tsx
<el-form-item label="文章正文" prop="content">
  <editor
    api-key="lplp5c6jparolr0g3hns10f6esaa1fff8pd6zwv8q0g3smim"
    :init="editorOptions"
    v-model="formData.content"
  />
</el-form-item>
```

5. 配置项准备

```tsx
import Editor from "@tinymce/tinymce-vue";

// 状态：富⽂本编辑器 TinyMCE 的配置
const editorOptions = reactive({
  // 编辑器⾼度
  height: 500,
  // 不显⽰顶部菜单栏
  menubar: false,
  // 不显⽰底部 TinyMCE 的版权⽂字
  branding: false,
  // 界⾯语⾔包⽂件的路径
  language_url: '/tinymce/langs/zh_CN.js',
  // 界⾯显⽰语⾔
  language: 'zh_CN',
  // 界⾯使⽤的⽪肤⽂件路径
  skin_url: '/tinymce/skins/ui/oxide',
  // 启⽤的插件
  plugins: [
    'advlist autolink lists link image charmap print preview anchor',
    'searchreplace visualblocks code fullscreen',
    'insertdatetime media table paste code wordcount',
  ],
  // 启⽤的⼯具栏按钮
  toolbar: [
    'undo redo | formatselect | forecolor bold italic backcolor | ',
    'alignleft aligncenter alignright alignjustify | ',
    'bullist numlist outdent indent | ',
    'removeformat | fullscreen',
  ].join(''),
  // 编辑器初始显⽰内容
  contentValue: formData.content,
})
```



### 编辑的回显

1. 给创建和编辑注册点击事件

```jsx
// 事件：点击创建按钮
const createHandler = () => {
  // 重置数据
  dialogFormData._id = "";
  dialogFormData.title = "";
  dialogFormData.summary = "";
  dialogFormData.content = "";
  dialogFormData.categoryId = "";

  // 显示对话框
  dialogVisible.value = true;
};

// 事件：点击编辑按钮
const editHandler = async (row: any) => {
  // 请求当前文章详情数据，准备回显到对话框中
  const article = await getArticle(row._id);

  dialogFormData._id = row._id;
  dialogFormData.title = article.title;
  dialogFormData.summary = article.summary;
  dialogFormData.content = article.content;
  dialogFormData.categoryId = article.categoryId;

  // 显示对话框
  dialogVisible.value = true;
};
```

2. 监听变化时, 更新数据

```jsx
// 监听: props 的变化
watch([() => props.visible, () => props.article], (newVals) => {
  const [visible, article] = newVals
  console.log(visible)
  // 设置对话框是否可见
  dialogStatus.isVisible = visible
  // 设置是否为编辑模式
  dialogStatus.isEdit = !!article._id

  // 设置表单数据
  formData._id = article._id;
  formData.title = article.title;
  formData.summary = article.summary;
  formData.content = article.content;
  formData.categoryId = article.categoryId;
})
```

3. 控制标题

```tsx
<el-dialog
  center
  fullscreen
  v-model="dialogStatus.isVisible"
  :title="dialogStatus.isEdit ? '修改文章' : '新增文章'"
  :show-close="true"
  :before-close="cancelHandler"
>
```



---

### 实现文章的新增和编辑

> 在文章列表页面中使用创建的弹窗组件来完成文章的新增和编辑

**操作步骤**

1. 给确定按钮注册事件

```tsx
<el-button type="primary" @click="submitHandler"> 确 定 </el-button>
```

2. 表单验证,  判断执行不同的请求,  触发提交complete事件

```jsx
// 事件触发器：列出本组件中允许触发的所有⾃定义事件
const emit = defineEmits(['update:visible', 'complete'])

// 状态：表单引⽤
const dialogForm = ref<any>(null);

// 事件: 点击确认按钮
const submitHandler = async () => {
  // 表单验证
  await dialogForm.value.validate()
  // 执行新增或修改
  if (dialogStatus.isEdit) {
    await updateArticle(formData)
  } else {
    await createArticle(formData)
  }
  // 发送自定义事件
  emit('complete', dialogStatus.isEdit)

  // 关闭对话框
  cancelHandler()
}
```

3. 定义设置给弹窗的属性值和事件监听函数

```tsx
<create-or-update-form
  v-model:visible="dialogVisible"
  :article="dialogFormData"
  :categories="categories"
  @complete="completeHandler"
></create-or-update-form>

// 事件：新增或修改对话框操作完成
const completeHandler = (isEdit: boolean) => {
  // 刷新列表（新增模式时加载第一页，编辑模式时加载当前页）
  if (!isEdit) {
    listParams.pageNo = 1;
  }
  loadArticleList();
};
```

---



### 实现文章的图片上传

文档: http://tinymce.ax-z.cn/

> 当前弹窗中的富文本编辑器，不能为文章上传并嵌入图片，我们要实现这个功能

**操作步骤**

1. 新建 `src/apis/upload.ts`，编写图片上传的 API 调用代码

```typescript
import { post } from '../utils/request'

export function uploadImage(data: FormData) {
  return post(`/api/user/image/upload`, data)
}
```

2. 在 TinyMCE 的配置项变量 editorOptions 的 pluings 和 toolbar 属性中，添加 image 相关配置：

```js
 // 启用的插件
  plugins: [
    "advlist autolink lists link image charmap print preview anchor",
    "searchreplace visualblocks code fullscreen",
    "insertdatetime media table paste code wordcount  image",
  ],
    
  // 启用的工具栏按钮
  toolbar: [
    "undo redo | formatselect | forecolor bold italic backcolor | ",
    "alignleft aligncenter alignright alignjustify | ",
    "bullist numlist outdent indent | ",
    "removeformat | fullscreen image",
  ].join(""),
```

```scss
<style lang="scss">
// 全局样式
// 提升 tinymce 的弹出层的 z-index，否则会被 element-plus 弹窗盖住
.tox-tinymce-aux {
  z-index: 5000 !important;
}
</style>
```



3. 在 TinyMCE 的配置项变量 editorOptions 中添加文件上传的逻辑代码：

```typescript
import { uploadImage } from '@/apis/upload';
import { baseURL } from '@/utils/request';

// ...

// 状态：富文本编辑器 TinyMCE 的配置
const editorOptions = reactive({
  // ...
  
  // 自定义图片上传功能
  images_upload_handler: async (blobInfo: any, success: any, failure: any) => {
    try {
      // 获取要上传的文件，拼装成 FormData 格式的表单数据
      const fd = new FormData();
      fd.append("file", blobInfo.blob(), blobInfo.filename());

      // 调用接口，执行文件上传
      const result = await uploadImage(fd);

			// 将后端返回的上传后的图片路径（相对路径），拼接成完整路径
      // 然后调用 success 回调函数来通知 TinyMCE 编辑器该图片路径
      success(baseURL + result.location);
    } catch (e) {}
  },
});
```



---



### 实现文章的删除

> 点击文章表格后的删除按钮，删除当前行的文章

**操作步骤**

1. 在 `src/apis/article.ts` 中，添加根据ID删除一篇文章的 API 调用代码：

```typescript
export function removeArticle(id: string) {
  return del<boolean>(`/api/user/articles/${id}`)
}
```

2. 在文章列表页面中，添加对“删除” 按钮的事件监听：

```typescript
// 事件：点击删除按钮
const removeHandler = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认要删除这篇文章吗？", "提示");
    await removeArticle(row._id);
    await loadArticleList();
    ElMessage.success("文章删除成功！");
  } catch (e) {}
};
```



---



## 个人信息页面

章节目标：能实现个人资料功能

---

### 实现个人资料展示页

> 展示当前登录用户的信息

个人资料信息已在路由守卫中被获取及存入 Vuex 中了，我们可以在个人资料页直接使用 Vuex 中的数据来做展示。

**操作步骤**

1. 编辑 `src/views/my/UserProfile/index.vue` 页面代码：

```vue
<template>
  <div class="profile-container">
    <!-- 个人资料展示 -->
    <el-form label-width="100px" label-position="left">
      <el-form-item label="头像">
        <div class="avatar-container">
          <div class="avatar">
            <img
              class="avatar-img"
              :src="getAvatarImage(profile?.avatar)"
              alt=""
            />
          </div>
        </div>
      </el-form-item>

      <el-form-item label="账号">
        <div>{{ profile?.username }}</div>
      </el-form-item>

      <el-form-item label="昵称">
        <div class="form-item-inline">
          <div>{{ profile?.nickname }}</div>
        </div>
      </el-form-item>

      <el-form-item label="密码">
        <div class="form-item-inline">
          <div>********</div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { getAvatarImage } from "@/utils/resource";

// 获取状态管理器
const store = useStore();

// 用户信息
const profile = computed(() => store.state.userInfo);
</script>

<style lang="scss" scoped>
.profile-container {
  padding-right: 30px;

  .el-form-item {
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 5px;
    padding: 15px;
  }

  .form-item-inline {
    width: 200px;
    display: flex;
    justify-content: space-between;
  }

  .avatar-container {
    display: flex;
    width: 200px;
    justify-content: space-between;
    align-items: center;

    .avatar {
      width: 98px;
      height: 98px;
      border: 1px solid #dddddd;
      border-radius: 50%;
      padding: 1px;

      .avatar-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        vertical-align: middle;
      }
    }
  }
}
</style>
```



---

### 实现修改个人头像

> 上传新的个人头像图片

**操作步骤**

1. 在 `src/apis/profile.ts`中，添加用于更新用户头像地址的 API 调用函数

```typescript
export function updateAvatar(avatar: string) {
  return put<boolean>('/api/user/profile/avatar', { avatar })
}
```

2. 在 Vuex store 模块中编写一个将新头像地址更新到 Vuex 用户信息中的 actions 函数

```typescript
import { getUserProfile, updateAvatar } from '../apis/profile'

// 创建状态管理器实例
const store = new Vuex.Store({
  // ...

  actions: {
    // ...
    
    // 修改个人头像
    async updateProfileAvatar(store, avatar) {
      await updateAvatar(avatar)
      store.commit('setUserInfo', {
        ...store.state.userInfo,
        avatar
      })
    }
  }
}
```

3. 在个人资料页面的头像旁边，放一个上传组件

```vue
<div class="avatar">
  <img
    class="avatar-img"
    :src="getAvatarImage(profile?.avatar)"
    alt=""
  />
</div>

<el-upload
  class="avatar-uploader"
  action=""
  :show-file-list="false"
  :http-request="sendUploadRequest"
  :before-upload="beforeAvatarUpload"
>
  <el-button type="text"> 更换 </el-button>
</el-upload>
```

4. 编写上传组件的 before-upload 和 http-request 属性对应的函数：

- before-upload 会在真正上传前执行

- http-request 用来自定义发送请求上传的过程

```typescript
import { ElMessage } from "element-plus";
import { uploadImage } from "../../../apis/upload";

// ...

// 事件：上传前作一些图片合法性检查
const beforeAvatarUpload = (file: File) => {
  const isValidFormat = file.type === "image/jpeg" || file.type === "image/png";
  const isValidSize = file.size / 1024 / 1024 < 2;

  if (!isValidFormat) {
    ElMessage.error("上传头像图片只能是 JPG 或 PNG 格式!");
  }

  if (!isValidSize) {
    ElMessage.error("上传头像图片大小不能超过 2MB!");
  }

  return isValidFormat && isValidSize;
};

// 事件：请求上传头像
const sendUploadRequest = async (req: any) => {
  try {
    const file = req.file;

    // 组装 FormData 对象
    const formData = new FormData();
    formData.append("file", file, file.name);

    // 执行上传
    const result = await uploadImage(formData);

    // 更新 Vuex 中的用户信息
    store.dispatch("updateProfileAvatar", result.location);
  } catch (e) {}
};
```



---

### 实现修改个人基本资料

> 修改个人资料中的基本信息内容（对于本案例来说，其实只有一个字段，那就是 ”昵称“）

**操作步骤**

1. 封装修改个人基本信息的弹窗组件`src/views/my/UserProfile/components/EditBaseInfoForm.vue`

```vue
<template>
  <el-dialog
    center
    title="修改基本信息"
    width="30%"
    v-model="isVisible"
    :before-close="cancelHandler"
  >
    <el-form
      :model="formData"
      :rules="formRules"
      ref="dialogForm"
      label-width="100px"
      class="profile-form"
      status-icon
    >
      <el-form-item label="昵称" prop="nickname">
        <el-input
          type="text"
          v-model="formData.nickname"
          autocomplete="off"
        ></el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="default" @click="cancelHandler"> 取 消 </el-button>
        <el-button type="primary" @click="confirmHandler"> 确 定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useStore } from "vuex";

// 属性：定义组件的 Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

// 事件触发器：列出本组件中允许触发的所有自定义事件
const emit = defineEmits(["update:visible"]);

// 获取状态管理器
const store = useStore();

// 状态：表单数据
const formData = reactive({
  nickname: store.state.userInfo?.nickname,
});

// 表单验证规则
const formRules = {
  nickname: {
    required: true,
    trigger: "blur",
    message: "昵称是必填项",
  },
};

// 状态：对话框的显示、隐藏
const isVisible = ref<boolean>(false);

// 状态：表单引用
const dialogForm = ref<any>(null);

// 函数：关闭对话框
const closeDialog = () => {
  emit("update:visible", false);
};

// 事件：点击取消或关闭窗口
const cancelHandler = () => {
  closeDialog();
};

// 事件：点击确认按钮
const confirmHandler = async () => {
  try {
    // TODOS
  } catch (e) {}
};

// 监听：监听 Props 的变化
watch(
  () => props.visible,
  (newVal) => {
    // 设置对话框是否可见
    isVisible.value = newVal;
  }
);
</script>
```

2. 在个人资料页面中，导入并调用弹窗组件

```vue
<!-- 对话框：修改基本信息 -->
<edit-base-info-form v-model:visible="dialogEditBaseVisible" />
```

```vue
<script lang="ts" setup>
  import EditBaseInfoForm from "./components/EditBaseInfoForm.vue";
  //...

  // 状态：弹出框显示、隐藏
  const dialogEditBaseVisible = ref<boolean>(false);

	// ...
</script>
```

3. 在个人资料页面的昵称旁边，放一个修改按钮

```vue
<el-form-item label="昵称">
  <div class="form-item-inline">
    <div>{{ profile?.nickname }}</div>
    <el-button type="text" @click="editBaseInfoHandler"> 修改 </el-button>
  </div>
</el-form-item>
```

```vue
<script lang="ts" setup>
  // ...

  // 事件：点击修改基本信息按钮
  const editBaseInfoHandler = () => {
    dialogEditBaseVisible.value = true;
  };
</script>
```



4. 在 `src/apis/profile.ts`中，添加用于更新用户基本信息的 API 调用函数

```typescript
export function updateBaseInfo(data: {
  nickname: string;
}) {
  return put<boolean>('/api/user/profile/baseinfo', data)
}
```

5. 在 Vuex store 模块中编写一个更新用户基本信息的 actions 函数

```typescript
import { getUserProfile, updateAvatar, updateBaseInfo } from '../apis/profile'

// 创建状态管理器实例
const store = new Vuex.Store({
  // ...

  actions: {
    // ...
    
    // 修改个人基本信息
    async updateProfileBaseInfo(store, params) {
      await updateBaseInfo(params)
      store.commit('setUserInfo', {
        ...store.state.userInfo,
        ...params
      })
    },
  }
}
```

6. 修改完成

```jsx
// 事件：点击确认按钮
const confirmHandler = async () => {
  try {
    // 表单验证
    await dialogForm.value.validate();

    // 执行修改
    await store.dispatch("updateProfileBaseInfo", formData);

    ElMessage.success("个人基础信息修改成功");

    // 关闭对话框
    closeDialog();
  } catch (e) {}
};
```



---



### 实现修改登录密码

> 修改个人登录密码

**操作步骤**

1. 封装修改个人登录密码的弹窗组件`src/views/my/UserProfile/components/EditPasswordForm.vue`

```vue
<template>
  <el-dialog
    center
    title="修改密码"
    width="30%"
    v-model="isVisible"
    :before-close="cancelHandler"
  >
    <el-form
      :model="formData"
      :rules="formRules"
      ref="dialogForm"
      label-width="100px"
      class="password-form"
      status-icon
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input
          type="password"
          v-model="formData.oldPassword"
          autocomplete="off"
        ></el-input>
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
          type="password"
          v-model="formData.newPassword"
          autocomplete="off"
        ></el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="default" @click="cancelHandler"> 取 消 </el-button>
        <el-button type="primary" @click="confirmHandler"> 确 定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useStore } from "vuex";

// 属性：定义组件的 Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

// 事件触发器：列出本组件中允许触发的所有自定义事件
const emit = defineEmits(["update:visible"]);

// 获取状态管理器
const store = useStore();

// 状态：表单数据
const formData = reactive({
  oldPassword: "",
  newPassword: "",
});

// 表单验证规则
const formRules = {
  oldPassword: {
    required: true,
    trigger: "blur",
    message: "旧密码是必填项",
  },
  newPassword: {
    required: true,
    trigger: "blur",
    message: "新密码是必填项",
  },
};

// 状态：对话框的显示、隐藏
const isVisible = ref<boolean>(false);

// 状态：表单引用
const dialogForm = ref<any>(null);

// 函数：关闭对话框
const closeDialog = () => {
  isVisible.value = false;
  emit("update:visible", false);
};

// 事件：点击取消或关闭窗口
const cancelHandler = () => {
  closeDialog();
};

// 事件：点击确认按钮
const confirmHandler = async () => {
  try {
	// TODOS
  } catch (e) {}
};

// 监听：监听 Props 的变化
watch(
  () => props.visible,
  (newVal) => {
    // 设置对话框是否可见
    isVisible.value = newVal;
  }
);
</script>
```

2. 在个人资料页面中，导入并调用弹窗组件

```vue
<!-- 对话框：修改密码 -->
<edit-password-form v-model:visible="dialogEditPassVisible" />
```

```vue
<script lang="ts" setup>
  import EditPasswordForm from "./components/EditPasswordForm.vue";
  // ...

  const dialogEditPassVisible = ref<boolean>(false);

  // ...
</script>
```

3. 在个人资料页面的密码旁边，放一个修改按钮

```vue
<el-form-item label="密码">
  <div class="form-item-inline">
    <div>********</div>
    <el-button type="text" @click="editPasswordHandler"> 修改 </el-button>
  </div>
</el-form-item>
```

```vue
<script lang="ts" setup>
  // ...

  // 事件：点击修改密码按钮
  const editPasswordHandler = () => {
    dialogEditPassVisible.value = true;
  };
</script>
```

3. 在 `src/apis/profile.ts`中，添加用于更新用户登录密码的 API 调用函数

```typescript
export function updatePassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  return put<boolean>('/api/user/profile/password', data)
}
```

4. 在 Vuex store 模块中编写一个更新用户登录密码的 actions 函数

```typescript
import { getUserProfile, updateAvatar, updateBaseInfo, updatePassword } from '../apis/profile'

// 创建状态管理器实例
const store = new Vuex.Store({
  // ...

  actions: {
    // ...

    // 修改个人登录密码
    async updateProfilePassword(store, params) {
      await updatePassword(params)
    },
  }
}
```

5. 修改密码完成

```jsx
// 事件：点击确认按钮
const confirmHandler = async () => {
  try {
	// TODOS
    await dialogForm.value.validate();

    // 执行修改
    await store.dispatch("updateProfilePassword", formData);

    ElMessage.success("登录密码修改成功");

    // 关闭对话框
    closeDialog();
  } catch (e) {}
};
```



---



## 博客首页页面 (练习)

章节目标：能够实现模块首页功能

```jsx
<template>
  <div class="main-container">
    <!-- 文章列表 -->
    <div class="article-list">
      <!-- 文章列表项 -->
      <div
        class="article-item"
      >
        <!-- 列表项：左边区域 -->
        <div class="article-info">
          <router-link class="title" to="/">
            文章修改测试-9哈哈
          </router-link>

          <div class="summary">
            摘要嘎嘎
          </div>

          <div class="info">
            <span>
              小帅鹏33
            </span>
            <span>
              2021/12/11 16:06
            </span>
          </div>
        </div>

      </div>
    </div>

    <div class="article-empty-list" >
      <span>没有文章可以显示</span>
    </div>

    <!-- 文章分类侧边栏 -->
    文章分类侧边栏
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="scss" scoped>
.main-container {
  display: flex;
  width: 960px;
  margin: 0 auto;

  .article-list {
    flex: 1;
    padding-top: 15px;

    .article-item {
      display: flex;
      justify-content: space-between;
      margin: 0 0 15px;
      padding: 15px 2px 20px 0;
      border-bottom: 1px solid #f0f0f0;
      word-wrap: break-word;
      box-sizing: border-box;

      .article-info {
        flex: 1;
        margin-right: 20px;

        .title {
          margin: -7px 0 4px;
          display: inherit;
          font-size: 18px;
          font-weight: 700;
          line-height: 1.5;
          color: #333;
        }

        .summary {
          margin: 0 0 8px;
          font-size: 13px;
          line-height: 24px;
          color: #999;
        }

        .info {
          font-size: 12px;
          color: #b4b4b4;

          span {
            margin-right: 10px;
          }
        }
      }

      .thumbnail {
        width: 150px;
        height: 100px;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        background-position: center center;
        background-repeat: no-repeat;
        background-size: cover;
      }
    }
  }

  .article-empty-list {
    flex: 1;
    padding-top: 100px;
    text-align: center;
    color: #cfcfcf;
  }
}
</style>
```

---

### 实现博客首页分类列表组件

> 首页中展示所有文章分类的菜单

**操作步骤**

1. 新建`src/views/pub/Home/components/CategoryList.vue`

```vue
<template>
  <ul class="category-list">
    <li class="category-item">
      <router-link to="/"> 全部分类 </router-link>
    </li>
    <li
      class="category-item"
      v-for="category in categories"
      :key="category._id"
    >
      <router-link :to="`/categories/${category._id}`">
        {{ category.name }}
      </router-link>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { listCategories } from "@/api/category";

// 状态：所有文章分类
const categories = ref<any[]>([]);

// 函数：请求文章分类数据
const loadCategoryList = async () => {
  const items = await listCategories();
  categories.value = items;
};

loadCategoryList();
</script>

<style lang="scss" scoped>
.category-list {
  width: 240px;
  list-style: none;

  .category-item {
    a {
      display: block;
      padding: 10px 15px;
      color: #333;

      &.router-link-exact-active {
        color: #ea6f5a;
        font-weight: 500;
        background-color: #f0f0f0;
        border-radius: 4px;
      }
    }
  }
}
</style>
```



### 实现博客首页分类展示和文章列表

**操作步骤**

1. 新建`src/apis/blog.ts`，添加获取文章列表的 API 调用代码

```typescript
import { get } from '../utils/request'

export function listBlogArticles(data: {
  categoryId?: string;
  pageNo?: number;
  pageSize?: number;
}) {
  return get<{ total: number, items: any[] }>('/api/articles', {
    params: data
  })
}
```

2. 编辑`src/views/pub/Home/index.vue`

```vue
<template>
  <div class="main-container">
    <!-- 文章列表 -->
    <div class="article-list" v-if="listData.total > 0">
      <!-- 文章列表项 -->
      <div
        class="article-item"
        v-for="article in listData.items"
        :key="article._id"
      >
        <!-- 列表项：左边区域 -->
        <div class="article-info">
          <router-link class="title" :to="`/articles/${article._id}`">
            {{ article.title }}
          </router-link>

          <div class="summary">
            {{ article.summary }}
          </div>

          <div class="info">
            <span>
              {{ article.owner.nickname }}
            </span>
            <span>
              {{ formatDate(article.createdAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="article-empty-list" v-else>
      <span>没有文章可以显示</span>
    </div>

    <!-- 文章分类侧边栏 -->
    <category-list />
  </div>
</template>

<script lang="ts" setup>
import { reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { listBlogArticles } from "@/apis/blog";
import { formatDate } from "@/utils/format";
import CategoryList from "./components/CategoryList.vue";

// 状态：文章列表分页查询参数
const listParams = reactive({
  categoryId: "",
  pageNo: 1,
  pageSize: 10,
});

// 状态：文章列表分页数据
const listData = reactive({
  total: 0,
  items: [] as any[],
});

// 函数：加载文章分页数据
const loadArticleList = async () => {
  const { total, items } = await listBlogArticles(listParams);
  listData.total = total;
  listData.items = items;
};

// 路由参数
const route = useRoute();

// 监听：根据路由参数变化来刷新文章列表
watch(
  () => route.params.id,
  (newVal) => {
    listParams.categoryId = newVal as string || ''
    loadArticleList();
  },
  { immediate: true }
);
</script>
```



---

### 实现博客首页文章列表的分页功能

> 文章列表底部分页栏

**操作步骤**

1. 在文章列表下，放置分页组件

```vue
<template>
  <div class="main-container">
    <!-- 文章列表 -->
    <div class="article-list" v-if="listData.total > 0">
      <!-- 文章列表项 -->
      <!-- ...... -->

      <!-- 分页栏 -->
      <el-pagination
        layout="prev, pager, next"
        :hide-on-single-page="true"
        :total="listData.total"
        v-model:pageSize="listParams.pageSize"
        v-model:currentPage="listParams.pageNo"
      >
      </el-pagination>
    </div>

    <!-- ...... -->
  </div>
</template>
```

3. 监听分页参数来刷新列表数据

```vue
<script lang="ts" setup>
// ...

// 监听：根据分页参数变化来刷新文章列表
watch([() => listParams.pageNo, () => listParams.pageSize], () => {
  loadArticleList();
});
</script>
```





### 实现详情页

代码基础结构

```html
<template>
  <div class="main-container">
    <div class="article-detail">
      <!-- 文章标题 -->
      <h1 class="title">{{ article?.title }}</h1>

      <!-- 文章基本信息 -->
      <div class="infobar">
        <div class="avatar">
          <img
            class="avatar-img"
            :src="getAvatarImage(article?.owner?.avatar)"
            alt=""
          />
        </div>
        <div class="desc">
          <div class="nickname">{{ article?.owner?.nickname }}</div>
          <div class="other">
            <span>
              {{ formatDate(article?.createdAt) }}
            </span>
            <span>
              {{ article?.category?.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- 文章正文 -->
      <p class="content" v-html="article?.content"></p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { getArticleDetail } from "@/apis/blog";
import { formatDate } from "@/utils/format";
import { getAvatarImage } from "@/utils/resource";

// 状态：文章详情
const article = ref<any>(null);

// 函数：请求文章详情数据
const loadArticle = async () => {
  // TODO
};

loadArticle();
</script>

<style lang="scss" scoped>
.main-container {
  width: 960px;
  margin: 0 auto;

  .article-detail {
    padding: 32px;
    box-shadow: 0 5px 10px #f0f0f0;

    .title {
      font-size: 30px;
      font-weight: 700;
      word-break: break-word;
      color: #404040;
      text-rendering: optimizelegibility;
      margin-top: 0;
      margin-bottom: 0.5em;
    }

    .infobar {
      display: flex;
      margin-bottom: 32px;

      .avatar {
        width: 40px;
        height: 40px;
        border: 1px solid #dddddd;
        border-radius: 50%;
        padding: 1px;

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          vertical-align: middle;
        }
      }

      .desc {
        margin-left: 10px;
        .nickname {
          font-size: 16px;
          font-weight: 500;
          margin-right: 8px;
          color: #404040;
          margin-bottom: 6px;
        }
        .other {
          font-size: 13px;
          color: #969696;
          span {
            margin-right: 20px;
          }
        }
      }
    }

    .content {
      overflow: hidden;
      word-break: break-all;
      word-wrap: break-word;
    }
  }
}
</style>
```

实现功能:

1. 在`src/apis/blog.ts`中，添加获取文章列表的 API 调用代码

```typescript
export function getArticleDetail(id: string) {
  return get(`/api/articles/${id}`)
}
```

2. 处理参数, 发送请求, 渲染

```jsx
// 路由参数
const route = useRoute();

// 函数：请求文章详情数据
const loadArticle = async () => {
  // 获取路由参数：文章ID
  const id = route.params.id as string;
  // 查询详情
  const result = await getArticleDetail(id);
  article.value = result;
};
```





