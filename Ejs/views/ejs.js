const koa = require("koa");
const views = require("koa-views");
const app = new koa();

// 配置应用 koa-view 中间件 (可以配置模板存放目录)
// views 方法:
// 参数一:配置模板存放目录
// 参数二：配置项，可以配置后缀名

// 一旦 view 中间件,配置完,ctx就会多一个 render 方法
// render方法 => ctx.render(模板文件名，数据源)
app.use(views(__dirname ,{extension:'ejs'}));//配置完后缀名可以不用写文件后缀

app.use(async (ctx) => {
  const obj = {
    name: "",
    age: 18,
    friends: ["tom", "jerry", "kevin"],
    weight: 130
  };
  // 基于数据渲染
  await ctx.render("test1.ejs", obj);
});

app.listen(1000, () => {
  console.log("当前服务器,http://localhost:1000");
});
