const koa = require("koa");
const { koaBody } = require("koa-body");
const koaStatic = require("koa-static");
const app = new koa();

// 开放 uploadFiles 文件夹
app.use(koaStatic("./uploadFiles"));

// 处理 post 请求，配置参数,但不好处理图片（没有配全参数）
app.use(
  koaBody({
    // 开启文件上传支持
    multipart: true,
    // 配置文件上传相关
    formidable: {
      // 文件上传的目录
      uploadDir: "./uploadFiles/uploads",
      // 默认不保留后缀名，需要保留后缀名
      keepExtensions: true,
    },
  })
);

// 编写后台接口，进行测试
/* 
1.登录接口
2.文件上传接口
*/
app.use((ctx) => {
  console.log(ctx);
  if (ctx.method === "POST" && ctx.url === "/login") {
    console.log("Start login！");
    console.log(ctx.request.body);
    let { username, password } = ctx.request.body;
    console.log("💕 ~ username", username, password);
    if(username==='tom'&&password==='123'){
    ctx.body = { status: 200, message: "ok!" };
    }else{
    ctx.body = { status: 401, message: "error!" };
    }
  }

  if (ctx.method === "POST" && ctx.url === "/upload") {
    console.log("Start uploadFiles！");
    console.log(ctx.request.files);
    ctx.body = {
      status: 200,
      message: "ok!",
      imageUrl:
        ctx.request.files.avatar?._writeStream.path.split("uploadFiles")[1], //! 这里返回的图片路径，需要返回当前开放的文件层级的路径
    };
  }
});

app.listen(3000, () => console.log("services:http://localhost:3000"));
