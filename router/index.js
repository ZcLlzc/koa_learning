const Router = require("@koa/router");
const router = new Router();

router.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body;
  if (username === "tom" && password === "123") {
    ctx.body = { status: 200, message: "ok!" };
  } else {
    ctx.body = { status: 401, message: "error!" };
  }
});
// ~2.上传接口
router.post("/uploadFile", async (ctx) => {
console.log("💕 ~ ctx", ctx);
ctx.body = {
  status: 200,
  message: "ok!",
  imageUrl:
    ctx.request.files.avatar?._writeStream.path.split("uploadFiles")[1], //! 这里返回的图片路径，需要返回当前开放的文件层级的路径
};
});
// ~3.注册接口
router.get("/info", async (ctx) => {
ctx.body = {
  status: 200,
  message: "ok!",
  userObj: {
    name: "kenvin",
    age: "20",
  },
};
});


// 指定一个url匹配
// router
//   .get("/", async (ctx) => {
//     ctx.type = "html";
//     ctx.body = "<h1>hello world!</h1>";
//   })
//   .get("/users", async (ctx) => {
//     ctx.body = "获取用户列表";
//   })
//   .get("/users/:id", async (ctx) => {
//     console.log("💕 ~ ctx", ctx);
//     const { id } = ctx.params;
//     ctx.body = `获取id为${id}的用户`;
//   })
//   .post("/users", async (ctx) => {
//     ctx.body = `创建用户`;
//   })
//   .put("/users/:id", async (ctx) => {
//     const { id } = ctx.params;
//     ctx.body = `修改id为${id}的用户`;
//   })
//   .del("/users/:id", async (ctx) => {
//     const { id } = ctx.params;
//     ctx.body = `删除id为${id}的用户`;
//   })
//   .all("/users/:id", async (ctx) => {
//     ctx.body = ctx.params;
//   });
module.exports = router;