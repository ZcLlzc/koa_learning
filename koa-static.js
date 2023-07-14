const Koa = require("koa");
const koaStatic = require("koa-static");
const app = new Koa();

// 将 public 目录，直接开放给用户（用户可以直接通过路径，访问文件夹内的所有文件）
app.use(koaStatic("./public"));
app.listen(3000, () => {
  console.log("当前服务器,http://localhost:3000");
});
