const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => console.log("Redis Error : ", err));
async function connectRedis() {
  await redis.connect();
  console.log("Redis is UP");
}
module.exports = { redis, connectRedis };
