# KOA 基础

**课程目标：掌握基于koa2搭建web应用的基础**

---

# 框架介绍与环境搭建

## koa2 基本介绍

**本章目标: 认识 KOA** 

> Koa 和 Express 一样，都是基于 node.js 的 Web 应用开发框架。
>
> Koa 2 是 Koa 的 2.0 版本。

<img src="KOA 基础.assets/image-20210526115054161.png" alt="image-20210526115054161" style="zoom:50%;" />

[koa](https://koajs.com/)：下一代的 node.js Web 框架！

- 由 Express 框架原班人马设计和开发
- 比 Express 更有表现力、更健壮（异步处理支持 async / await，所以可以用 try / catch 来更好的处理异常）
- 框架核心默认不带有任何中间件，更精简、更快速（而 Express 默认自带了很多的中间件）
- 更强大的中间件模型（洋葱圈模型）

典型应用场景：

- 开发 REST API
- 开发 WebSocket API
- 开发服务端渲染的页面

本章问题：

1. koa 框架可以用来做什么？
2. koa 框架默认自带中间件吗？

---



## Node.JS 环境安装

**本章目标: 完成NodeJS环境安装**

> 开发和运行 koa 必须依赖 node.js，因此需要先安装它

koa 2 支持 async 函数，但是 node.js 7.6 以后才原生支持 async， NodeJS 7.6+

目前 node.js 稳定版已经是 14+ 了，因此大家安装最新的稳定版即可。

[node.js 稳定版下载地址](https://nodejs.org/en/download/)



**安装步骤**

一路下一步即可。推荐不要安装在包含中文的路径下。

**安装验证**

打开命令行，执行以下命令

```bash
node -v

# 如能看到输出一个版本号，如 v14.17.0 即代表安装成功
```



---



## 创建 Hello World 程序

**本章目标:   使用 koa 框架编写一个最简单的 API，访问时页面响应 hello world**

**步骤：**

1. 创建新的工程目录，比如：hello 目录

2. 安装依赖包

```bash
npm i koa
```

3. 创建代码文件，比如：app.js 文件

```js
// 1. 引入 koa
const Koa = require('koa')

// 2. 创建 koa 实例
const app = new Koa()

// 3. 创建一个中间件，所有的请求都会执行到这个中间件进行处理
//   Koa 提供一个 Context 对象，表示一次对话的上下文（包括 HTTP 请求和 HTTP 回复）。
//   通过加工这个对象，就可以控制返回给用户的内容。
app.use(async ctx => {
  // 为方便起见许多上下文的访问器和方法直接委托给它们的 ctx.request 或 ctx.response
  // 例如: ctx.body => ctx.response.body
    
  // 设置响应体  ctx.body = 'xxx'
  ctx.response.body = 'Hello,World'
})

// 4. 启动 koa 实例所关联的 http 服务器，并监听在 3000 端口上向外提供服务
app.listen(3000, () => {
  // http 服务器启动成功后执行本回调函数
  console.log('请访问 http://localhost:3000')
})

```

4. 在命令行执行

```bash
node server.js
```

5. 在浏览器访问 http://localhost:3000 

---



# Web 应用开发基础

## 处理get请求参数

**本章目标:  学习 koa中 如何处理 get 请求参数 **

> 在中间件中获取 GET 请求发送的查询字符串参数

中间件函数的第一个参数 `ctx` 中包含了请求和响应相关的操作，我们可以通过它的 `query` 属性来获取请求的查询字符串参数：

```js
app.use(async ctx => {
  // 方式一：获取对象形式的查询字符串参数
  console.log("查询字符串参数(对象形式)", ctx.request.query)   				
  
  // 方式二：获取原始字符串形式的查询字符串参数
  console.log("查询字符串参数(字符串形式)", ctx.request.querystring)   
  
  // ...
})
```



---



## 处理post请求参数

**本节目标: 学会处理 POST 请求参数**

> 在中间件中获取 POST 请求通过请求体发送的参数数据

获取 POST 请求发送的请求体参数，相对较为繁琐，大致思路为：

1. 监听 node.js 原生请求对象的 `data` 事件，从请求体中获取数据，并将所有数据拼合起来（因为如果请求体中携带的数据量较大，就会分几次来触发 data 事件，逐步获取）
2. 监听 node.js 原生请求对象的 `end`事件，获知请求体数据被完全获取

代码示例：

```js
// ...

app.use(async ctx => {
  let paramStr = ''

  // 1. 监听 node.js 原生 Request 对象的 data 事件，获取请求体数据
  ctx.req.on('data', (data) => {
    // 从请求体中获取数据，并拼接成一整个字符串
    paramStr += data
  })

  // 2. 监听 node.js 原生 Request 对象的 end 事件，结束请求体数据获取
  ctx.req.on('end', () => {
    // paramStr 是查询字符串格式的数据 可以用 new URLSearchParams 解析
    // 语法: var URLSearchParams = new URLSearchParams(init);
    const params = new URLSearchParams(paramStr)
    
    console.log('请求体参数(字符串形式)', paramStr);
    console.log('请求体参数(对象形式)', params);
  })

	// ...
})
```

`URLSearchParams` 语法说明:

```jsx
const params = new URLSearchParams('k=%E5%85%B3%E9%94%AE%E5%AD%97&p=1');
console.log(params.get('k'));   // 返回字符串“关键字”，支持自动 UTF-8 解码
console.log(params.get('p'));   // 返回字符串“1”
console.log(params.get('xxx')); // 如果没有 xxx 这个键，则返回 null
console.log(params.has('xxx')); // 当然也可以通过 has() 方法查询是否存在指定的键
console.log(params.keys());     // 返回一个 ES6 Iterator，内含 ['k', 'p']
console.log(params.values());   // 返一个 ES6 Iterator，内含 ['关键字', '1']
```

MDN: https://developer.mozilla.org/zh-CN/docs/Web/API/URLSearchParams/URLSearchParams

知乎:  https://zhuanlan.zhihu.com/p/29581070

---



## 响应一个页面

**本节目标:  收到请求后，给客户端响应一个 HTML 内容**

方式一：直接响应一个 HTML 字符串给客户端

```js
app.use(async ctx => {
  // 为响应体设置 HTML 字符串内容
  ctx.body = `
    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    	<title>Document</title>
    </head>

    <body>
    	<h1>你好，世界</h1>
    </body>

    </html>
	`
})
```



方式二：读取 html 文件后，将读取到的 HTML 字符串响应给客户端

```html
<!-- 编写 index.html 文件 -->

<!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>

  <body>
    <h1>你好，世界</h1>
  </body>

</html>
```

```js
// 导入文件读取模块
const fs = require('fs')

// 读取 html 文件的工具函数
function getHtmlFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err)
      } else {
	    // 读取的文件数据是 Buffer 形式，要用 toString() 转成字符串
        resolve(data.toString())
      }
    })
  })
}

app.use(async ctx => {
  // 读取 index.html 文件后，设置到响应体
  ctx.body = await getHtmlFile('./index.html')
})
```



---



## 处理静态资源

**本节目标:  收到请求后，给客户端响应静态资源内容，比如图片**

处理静态资源的思路，和之前响应 html 文件给客户端是类似的，也是先读取文件，再设置给响应体。

以下是响应一张图片的实例：

1. 先在项目目录中建立一个 static 目录，并放置一张图片文件（本例中是 01.jpg）
2. 编写下面的代码，实现读取图片并响应给客户端的操作

```js
// 导入文件读取模块
const fs = require('fs')

// 获取静态资源文件的
function getImageFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err)
      } else {
        // 这里保持 Buffer 格式数据，因为图片是二进制数据，不要转成字符串
        resolve(data)
      }
    })
  })
}

app.use(async ctx => {
  // 【重要】正确设置静态资源的 Content-Type 响应头，否则在浏览器中只会下载文件，不能查看到图片
  ctx.set('Content-Type', 'image/jpeg')

  // 在响应体中设置读取到的图片文件数据
  ctx.body = await getImageFile('./static/01.jpg')
})
```

---



# 中间件

## 基本概念和执行过程

**本节目标: 了解什么是中间件，以及它的作用**

**基本概念**

中间件，其实就是一系列用来  **对请求进行处理**  的**函数**。

### 中间件概念理解

为了理解中间件，我们先来看一下我们现实生活中的例子
![image-20210106221658922](assets/image-20210106221658922.png)

处理污水的这三个中间处理环节,就可以叫做中间件。



### Koa 中间件执行模型-洋葱圈模型

**本节目标: 理解Koa中间件执行模型 - 洋葱圈模型**

在 Koa 中可以为 Koa 实例添加多个中间件，让一个请求可以经过多个中间件函数的处理。

中间件函数的格式为：

```js
function someMiddleware(ctx, next) {
  // ... 对请求进行处理的逻辑 ...
  
}
```

每个中间件函数都有两个参数：

- ctx - 请求上下文对象，它包含和请求和响应相关的数据和操作
- next - 是一个函数，调用后会执行下一个中间件

创建好中间件函数后，可以将它添加到 Koa 实例上：

```js
app.use(someMiddleware)
```

**Koa 中间件的执行模型**

<img src="KOA 基础.assets/6383319-09c1061cf194e0b8.png" alt="6383319-09c1061cf194e0b8" style="zoom:80%;" />



上面为 Koa 框架的中间件模型示意图，看上去像个洋葱，所以我们称它为《洋葱圈模型》。

它的含义就是说：

```
Koa 中间件的执行就像洋葱一样，最早被 use 的中间件会放在最外层，而后续被 use 的中间件会往里层放；

当接收到一个请求的时候，处理顺序是：

1. 从左到右从洋葱的最外层到最里层，也就是从最早 use 的中间件到最后 use 的中间件依次执行；
2. 在到达最里层中间件后，会继续向右逐层往外执行，直到最外层中间件，然后返回 response
```

示例代码：

```js
app.use(async (ctx, next) => {
    console.log('>>>>>>>> A 111')
    await next()
    console.log('>>>>>>>> A 222')
})

app.use(async (ctx, next) => {
    console.log('>>>>>>>> B 111')
    await next()
    console.log('>>>>>>>> B 222')
})
```

当接收请求后，我们可以看到控制台打印如下结果：

```
>>>>>>>> A 111
>>>>>>>> B 111
>>>>>>>> B 222
>>>>>>>> A 222
```

由此可知，一般情况下 Koa 的中间件都会执行两次：

- 调用 next 之前为第一次。在调用 next 后，会把控制权传递给往里层的下一个中间件
- 当里层不再有任何中间件、或未调用 next 函数时，就开始依次往外层中间件执行，执行的是外层中间件中调用 next 函数之后的代码



**本章问题**

1. 中间件函数,  有哪两个形参？
2. Koa 中中间件执行的模型叫什么？

### Koa洋葱圈设计理解

<img src="KOA 基础.assets/6383319-09c1061cf194e0b8.png" alt="6383319-09c1061cf194e0b8" style="zoom:80%;" />

两个现象:

- **中间件的执行了两次**
- **执行顺序奇怪，以next函数为分界点：先use的中间件，next前的逻辑先执行，但next后的逻辑反而后执行**

思考: 为什么 Koa 要这么设计? 正常不应该是中间件按顺序从开始到结束执行吗？

说明: 

- 如果说使用中间件的场景, 不存在前后依赖的情况，从头到尾按顺序链式调用  =>  完全没问题。

- 但是, 如何存在依赖的情况呢?  **比如:  前一个中间件部分代码, 依赖于下一个中间件的处理结果?**

  链式一次执行就无法实现了!

结论:

- **next 前的逻辑 : 进行前期处理**
- **调用next，将控制流交给下个中间件，并await其完成，直到后面没有中间件或者没有next函数执行为止**
- **完成后一层层回溯执行各个中间件的后期处理（next 后的逻辑）**





## 用 koa-body 处理 POST 传参

**本节目标: 使用 koa-body 中间件 处理 POST 传参**

> 我们自己来处理获取 POST 请求的参数比较繁琐，实际开发中可以使用封装好的开源中间件

我们可以在 [Koa 官方wiki](https://github.com/koajs/koa/wiki) 上找到很多优秀的开源中间件。而 [koa-body](https://github.com/koajs/koa-body) 是一个专门用于获取通过请求体传递的数据的中间件。

使用步骤：

1. 安装依赖包

```bash
npm i koa-body
```

2. 引入并使用 koa-body

```js
// 引入 koa-body
const koaBody = require('koa-body')

// ...

// 为 Koa 实例设置 koa-body 中间件
app.use(koaBody())

app.use(async ctx => {
  // 通过 ctx.request.body 获取请求体参数
  console.log('请求体参数', ctx.request.body)
  ctx.body = 'Hello'
})
```



---



## 用 koa-views 和 EJS 渲染页面

**本节目标: 在 Koa 中使用模板引擎 EJS 来进行页面的动态渲染**

在 Koa 中，我们也可以使用模板引擎，通过模板语法将数据动态渲染成html页面内容，然后发送到客户端去。

[koa-views](https://github.com/queckezz/koa-views) 是一个支持使用多种模板引擎来渲染页面的中间件，在本章中我们要使用 EJS 模板。

使用步骤：

1. 安装 koa-views 中间件 和 ejs 模板引擎

```bash
npm i koa-views ejs
```

2. 引入并使用中间件

```js
// 引入 koa-views
var views = require('koa-views');

// 配置和应用 koa-views 中间件（这里配置使用了 ejs 模板引擎，以及模板文件的存放目录）
app.use(views(__dirname + '/views', { extension: 'ejs' }))

// 引入 koa-views 后，就可以使用 ctx.render 函数渲染 ejs 模板文件了
app.use(async ctx => {
  // render 函数的第一个参数是模板文件名；第二个参数是要渲染到模板中的动态数据
  await ctx.render('test', {
    name: '小明',
    age: 18,
    books: ['三国演义', '红楼梦', '西游记', '水浒传']
  })
})
```

模板文件 `views/test.ejs`

```ejs
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <div>姓名：<%= name %></div>
    <div>年龄：<%= age %></div>
    <ul>
        <% books.forEach(function (book) { %>
            <li><%= book %></li>
        <% }) %>
    </ul>
</body>

</html>
```

---



## 用 koa-static 处理静态资源

**本节目标: koa-static中间件, 处理静态资源**

> 我们自己处理静态资源的话，代码会较为繁琐，因此实际开发中可以借助封装好开源中间件，比如 koa-static

[查看 koa-static 中间件](https://github.com/koajs/static) 

使用步骤：

1. 安装依赖包

```bash
npm i koa-static
```

2. 创建 static 目录，并放入一些静态资源文件（图片等）

3. 配置中间件

```js
// 引入 koa-body
const koaStatic = require('koa-static')

// ...

// 调用 koaStatic() 能自定义一些配置，并返回一个真正的 koa-static 中间件函数，然后设置给 Koa 实例使用
app.use(koaStatic('./static'))
```



---



## 用 koa-body 处理文件上传

**本节目标: 使用 koa-body 实现文件上传接口,  处理文件上传**

> 通过 koa-body 中间件，从请求体中读取客户端上传的二进制文件数据

通过使用 koa-body 中间件，不光能方便的获取请求体中的普通文本参数，也可获取二进制的文件数据，因此可以处理文件上传的场景。

使用步骤：

1. 配置 koa-body，使其支持处理文件上传

```js
// 引入 koa-body
const koaBody = require('koa-body')

// 调用 koaBody() 并进行文件上传处理相关的配置
app.use(koaBody({
    // 开启文件上传支持
    multipart: true,
  
    // 上传文件相关配置
    formidable: {
        // 文件上传到的目录
        uploadDir: './upload',
      
        // 保留上传文件的后缀名（默认为 false，所有上传的文件都会被去除后缀名)
        keepExtensions: true
    }
}))
```

2. 在我们自己的中间件中，获取客户端通过 FormData 传递过来的文件及其他参数

```js
app.use(async ctx => {
    // 获取上传的文件信息
    console.log('请求体中的文件', ctx.request.files)

    // 获取请求体中的其他参数
    console.log('请求体中的其他参数', ctx.request.body)

    ctx.body = 'Hello'
})
```



---



## 用 koa-router 实现后端路由

**本节目标: 使用 koa-router 实现服务端路由**

> 了解如何使用 koa-router 方便的实现服务端路由

自己实现不同的路由示例：

```js
const Koa = require('koa')
const app = new Koa()

app.use(async ctx => {
  // 获取客户端请求的 URL 路径
  const url = ctx.url
  const method = ctx.method

  // 根据路径来判断具体要做的业务逻辑
  if (method === 'GET' && url === '/login') {
    ctx.body = '这是登录页'
  } else if (method === 'POST' && url === '/login') {
    ctx.body = '登录处理成功'
  } else if (method === 'GET' && url === '/register') {
    ctx.body = '这是注册页'
  } else if (method === 'POST' && url === '/register') {
    ctx.body = '注册处理成功'
  } else {
    ctx.body = '404 Not Found'
  }
})

app.listen(3000, () => {
  console.log('请访问 http://localhost:3000')
})
```

> 以上做法的弊端是：随着路由路径的增加，中间件代码变得很复杂。
>
> 而借助 [koa-router](https://github.com/koajs/router) 中间件，可以很清晰的创建和管理多个路由。



使用步骤：

1. 安装依赖包

```
npm i @koa/router
```

2. 引入 koa-router 并创建 Router 实例

```js
// 引入 koa-router
const Router = require('@koa/router')

// 创建 Router 实例
const router = new Router()
```

3. 在 Router 实例上创建路由处理器

```js
// 静态路由 GET /login
router.get('/login', async ctx => {
    ctx.body = '这是登录页'
})

// 静态路由 POST /login
router.post('/login', async ctx => {
    ctx.body = '登录处理成功'
})

// 动态路由 GET /articles/123
router.get('/articles/:id', async ctx => {
    const id = ctx.params.id
    console.log(">>>>>>>> 动态路由参数 ID：", id);
    ctx.body = `ID 为 ${id} 的内容`
})
```

4. 根据 router 生成路由相关的实际中间件函数，并设置给 Koa 实例

```js
app.use(router.routes())
```


