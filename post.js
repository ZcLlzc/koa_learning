const koa = require("koa");
const app = new koa();
app.use((ctx) => {
  // ctx.request ctx.response  koa 的请求和响应对象
  // ctx.req ; ctx.res   node.js 原生的请求对象和响应对象
  let paramsStr = ""; //参数字符串
  //(1) 监听 原生 node.js request 对象的 data 事件
  // 每有一段数据过来,都会触发一次 data 数据量大的时候,会触发多次 data 事件
  ctx.req.on("data", (data) => {
    paramsStr += data;
  });
  //(2) 监听 原生 node.js request 对象的 end 事件
  ctx.req.on("end", () =>  {
    //  name=%E5%A5%A5%E7%89%B9%E6%9B%BC&age=18
    //  URLSearchParams {'name'=>'奥特曼','age's=>'18'}
    //  params.get(key) 根据键获取
    //  params.has(key) 根据键判断
    //  params.keys() 拿到所有的键,返回的是一个 ES6 Iterator ['name','age'] 可通过 for of 遍历
    const params = new URLSearchParams(paramsStr);
    console.log(params);
    for (const [name, age] of params) {
      console.log(name, age);
    }
    console.log(paramsStr);
  });
});

app.listen(1000, () => {
  console.log("当前服务器,http://localhost:1000");
});
