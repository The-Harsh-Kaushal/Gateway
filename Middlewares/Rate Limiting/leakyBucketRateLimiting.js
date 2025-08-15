const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const LB_Map = new Map();
// a helper function to do redundent task
// this is a helper fn that will help both the auth and rest it takes id and othre parameters where id can be anything to out needs
function LBHelper(res, id, limit, Window_size_MS) {
  const getElement = LB_Map.get(id);

  const resetTime = Math.floor(Window_size_MS / limit);
  if (getElement.lastReset + resetTime <= Date.now()) {
    const inc_sizeby = Math.floor(
      (Date.now() - getElement.lastReset) / resetTime
    );
    getElement.currentSize =
      getElement.currentSize + inc_sizeby > limit
        ? limit
        : getElement.currentSize + inc_sizeby;
  }
  res.setHeader("RateLimit-Limit", limit);
  res.setHeader(
    "RateLimit-Reset",
    (limit - getElement.currentSize) * resetTime
  );
  res.setHeader("RateLimit-Remaining", getElement.currentSize);
  if (getElement.currentSize === 0) {
    return false;
  }
  getElement.currentSize -= 1;
  return true;
}

// reate limiter for authentication
const AuthLB = (req, res, next) => {
  const cookie = req.cookies["pseudo-session"];
  let u_id;
  // these two variable decide how many req in one window (limit ), and what's the full size of window (window_size_ms)
  const limit = 10;
  const Window_Size_Ms = 60000;
  if (!cookie || !LB_Map.has(cookie)) {
    u_id = crypto.randomBytes(64).toString("hex");
    LB_Map.set(u_id, {
      currentSize: limit,
      lastReset: Date.now(),
    });
    res.cookie("pseudo-session", u_id, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60,
    });
  } else {
    u_id = cookie;
  }
  if (LBHelper(res, u_id, limit, Window_Size_Ms)) {
    return next();
  }
  return res.status(429).json({
    msg: "No more req for u ",
  });
};

const RestLB = (req, res, next) => {
  const cookie = req.cookies["pseudo-session"];
  if (cookie) {
    res.clearCookie("pseudo-session", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    LB_Map.delete(cookie);
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("BEARER ")) {
    return res.status(401).json({ msg: "Token missing or malformed" });
  }
  const token = authHeader.split(" ")[1];
  const limit = 100;
  const Window_Size_Ms = 600000;
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    LB_Map.set(payload.uniqueId, {
      currentSize: limit,
      lastReset: Date.now(),
    });
    if (LBHelper(res, payload.uniqueId, limit, Window_Size_Ms)) {
      return next();
    }
    return res.status(429).json({ msg: "No more  requests for you" });
  } catch (err) {
    console.log(err.msg);
    return res.status(500).json({
      msg: "token is invalid",
    });
  }
};

module.exports = { AuthLB, RestLB };
