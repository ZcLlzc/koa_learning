const koa = require("koa");
const app = new koa();
app.use((ctx) => {
  console.log(ctx.request.query); // 可以拿到传过来的数据,对象格式 { age: '26', name: 'tom' }
  console.log(ctx.request.querystring); // 可以拿到传过来的数据,字符串格式  age=26&name=tom
  ctx.response.body = "11111";  // ! 常用的简洁写法 ctx.body 可以省略中间 response  (有的不能简写)  
});
app.listen(1000, () => {
  console.log("当前服务器,http://localhost:1000");
});
