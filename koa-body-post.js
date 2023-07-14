const koa = require("koa");
const { koaBody } = require("koa-body");
// koa-body 的使用
/* 
1.引包
2.挂载在 koa 的实例上
*/
const app = new koa();
app.use(koaBody());
app.use(async (ctx) => {
  // ctx.req.on('data',()=>...)
  // ctx.req.on('end',()=>...)
  // 中间件,koa-body 处理,通过 ctx.request.body 拿到参数
  console.log("请求体参数", ctx.request.body);
  ctx.body = "hello"; // 这里的简写是响应体
});
app.listen(1000, () => {
  console.log("端口1000,http://localhost:1000");
});
