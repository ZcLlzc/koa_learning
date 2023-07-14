const koa = require("koa");
const path = require("path"); // 绝对路径
const app = new koa();
// 导入文件读写模块
const fs = require("fs");
// 封装一个读取 html 的函数
function getHTMLFile(params) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, params), (err, data) => {
      if (err) return console.log(err);
      console.log(data.toString); //读取的数据 data 是 Buffer 格式文件要用toString转换
      resolve(data.toString());
    });
  });
}
// 封装一个读取 html 的函数
function getImageFile(params) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, params), (err, data) => {
      console.log("💕 ~ path.join(__dirname:", path.join(__dirname));
      if (err) return console.log(err);
      resolve(data); //图片资源 Buffer 格式文件,不需要转换
    });
  });
}
app.use(async (ctx) => {
  // ctx.body = await getHTMLFile("./test.html");  // koa 在一个异步(耗时)操作结束后,把结果返回,需要用 async await 阻塞,否则会直接返回 Not Found

  //  指定 图片的格式
  // !重要:需要正确设置静态资源文件(图片)的 content-type 响应头
  // !否则,只会下载,不能查看图片 后面有个中间件包 mime 处理这个
  ctx.set("Content-Type", "image/jpg");
  ctx.body = await getImageFile("./static/EVA终.jpg");
});

app.listen(1000, () => {
  console.log("当前服务器,http://localhost:1000");
});
