const koa = require("koa");
const { koaBody } = require("koa-body");
const koaStatic = require("koa-static");
const app = new koa();
app.use(koaStatic("./uploadFiles"));
app.use(koaBody());
const router = require("./router")

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




app.use(router.routes());
app.listen(3000, () => console.log("services:http://localhost:3000"));
