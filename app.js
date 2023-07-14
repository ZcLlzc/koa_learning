//  1.引入 koa
const koa = require("koa");

// 2.创建 koa 实例
const app = new koa();

// 3.创建一个中间件,所有的请求和响应都可以在这个中间件中处理
/* 
  ctx:context 是 koa 提供的上下文对象,表示一次对话的上下文(包含http请求和响应)
  加工这个对象,可以返回用户信息
*/
app.use((ctx) => {
  // ctx.request 请求; ctx.response 响应
  ctx.response.body = "Hello World";
});

// 4.启动服务器
app.listen(3000, () => {
  console.log("当前服务器,http://localhost:3000");
});

