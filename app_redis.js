const koa = require("koa");
const app = new koa();
// 1、引入 ioredis
const Redis = require("ioredis");

const redis = new Redis({
  port: 6379,
  host: "127.0.0.1",
});


app.use(async (ctx) => {
  // 经过很久的数据库数据查询
  // 如果存了就用缓存，咩有就去查询

  let result = await redis.get("arrList"); //异步
  console.log("💕 ~ result", result);
  if (!result) {
    const arr = [
      { id: 1, name: "tom", age: 20 },
      { id: 2, name: "tom1", age: 21 },
      { id: 3, name: "tom2", age: 22 },
      { id: 4, name: "tom3", age: 23 },
    ];
    result = arr;
    await redis.set("arrList", JSON.stringify(arr)); // 异步
  } else {
    result = JSON.parse(result);
  }
  ctx.body = result;
});

app.listen(3000, () => console.log("services:http://localhost:3000"));
