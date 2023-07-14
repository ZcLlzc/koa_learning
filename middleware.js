const koa = require("koa");
const app = new koa();
// app.use(中间件)中间件就是一个函数
app.use(async (ctx, next) => {
  console.log(11111);
  await next();
  console.log(11111);

});

app.use(async (ctx, next) => {
  console.log(2222);
  await next();
  console.log(2222);

});

app.use(async (ctx, next) => {
  console.log(3333);
  await next();
  console.log(3333);

});

app.listen(1000, () => {
  console.log("当前服务器,http://localhost:1000");
});

//! 洋葱圈模型,进入执行 async 后代码, next() 出去执行后面的中间件,然后再处理next()后面的代码 (顺序 11111->2222->3333->3333->2222->11111)
//! 主要解决数据之间依赖的问题