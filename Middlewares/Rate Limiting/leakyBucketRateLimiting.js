const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { redis } = require("../../Redis/RedisClient");
const fs = require("fs");
const path = require("path");


//read the lua script
let luaScript;

try {
  luaScript = fs.readFileSync(
    path.resolve(__dirname, "../../Redis/lua/bucketScripting.lua"),
    "utf8"
  );
} catch (err) {
  console.error("❌ Failed to load Redis Lua script:", err.message);
  process.exit(1); 
}
//lua script 2
let luaScript2;
try {
  luaScript = fs.readFileSync(
    path.resolve(__dirname, "../../Redis/lua/RestbucketScript.lua"),
    "utf8"
  );
} catch (err) {
  console.error("❌ Failed to load Redis Lua script:", err.message);
  process.exit(1); 
}
// load into redis, get SHA
const sha = await redis.scriptLoad(luaScript);
const sha2 = await redis.scriptLoad(luaScript2);

// reate limiter for authentication
function AuthLB(AuthCapacity, Auth_win_size_ms, IP_factor, Expiration_factor) {
  return async (req, res, next) => {
    //setting default values
    if (!AuthCapacity) AuthCapacity = 10;
    if (!Auth_win_size_ms) Auth_win_size_ms = 6000;
    if (!IP_factor) IP_factor = 10;
    if (!Expiration_factor) Expiration_factor = 2;

    // getting that cookie for random devices
    const cookie = req.cookies["pseudo-session"];
    const user_ip = req.ip;

    // we will check if the cookie exsist in the pool if not create one
    let u_id = cookie;
    if (!cookie) {
      u_id = crypto.randomBytes(64).toString("hex");
      res.cookie("pseudo-session", u_id, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60,
      });
    }
    // now the time to run lua script
    const allowed = await redis.evalSha(sha, {
      keys: [`bucket:PC:${u_id}`, `bucket:IP:${user_ip}`],
      arguments: [
        AuthCapacity,
        Auth_win_size_ms,
        Date.now(),
        IP_factor,
        Expiration_factor,
      ],
    });
    if (allowed) return next();

    return res.status(429).json({
      msg: "No more req for u ",
    });
  };
}
function RestLB(AuthCapacity, Auth_win_size_ms, Prefix, Expiration_factor) {
  return async function (req, res, next) {

    // defaults
    if (!AuthCapacity) AuthCapacity = 10;
    if (!Auth_win_size_ms) Auth_win_size_ms = 6000;
    if (!Prefix) Prefix = "AT";
    if (!Expiration_factor) Expiration_factor = 2;

    // extract access token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      return res.status(401).json({ msg: "Invalid or expired token" });
    }

    // ✅ extract unique identity from token
    const uniqueId = payload.sub; // or payload.userId

    if (!uniqueId) {
      return res.status(401).json({ msg: "Invalid token payload" });
    }

    // rate limit
    const allowed = await redis.evalSha(sha2, {
      keys: [`bucket:${Prefix}:${uniqueId}`],
      arguments: [
        AuthCapacity,
        Auth_win_size_ms,
        Date.now(),
        Expiration_factor,
      ],
    });

    if (allowed) return next();

    return res.status(429).json({
      msg: "No more requests for you",
    });
  };
}



module.exports = { AuthLB, RestLB };
