const SRL_Map = new Map();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const path = require("path");

function handleRateLimit(res, id, limit) {
  const mapElement = SRL_Map.get(id);
  // reseting the window
  const Window_Size_Ms = 60 * 10 * 1000; // 10 min
  if (mapElement.lastreset + Window_Size_Ms <= Date.now()) {
    mapElement.count = 0;
    mapElement.lastreset = Date.now();
  }
  res.setHeader("RateLimit-Limit", limit);
  res.setHeader(
    "RateLimit-Reset",
    Math.ceil((600000 - (Date.now() - mapElement.lastreset)) / 1000)
  );
  res.setHeader("RateLimit-Remaining", limit - mapElement.count);
  if (mapElement.count >= limit) {
    return true;
  } else {
    mapElement.count += 1;
    return false;
  }
}

const AuthSRL = (req, res, next) => {
  const cookie = req.cookies["pseudo-session"];
  let u_id;
  //if cookie doesn't exsist  create one
  if (!cookie || !SRL_Map.has(cookie)) {
    u_id = crypto.randomBytes(64).toString("hex");
    SRL_Map.set(u_id, {
      count: 0,
      lastreset: Date.now(),
    });
    // sending back the cookie
    res.cookie("pseudo-session", u_id, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
    });
  } else {
    u_id = cookie;
  }
  if (handleRateLimit(res, u_id, 10)) {
    return res.status(429).json({
      msg: "No more requests for u ",
    });
  } else {
    next();
  }
};
// As u can see that i'm doing jwt extracting here and will do also in session , it's bad in production phase but here it's for testing , didn't wanted the gateway to have a limit , so i leave it this way

const RestSRL = (req, res, next) => {
  // Cleanup step (optional session cleanup logic)
  const toDel = req.cookies["pseudo-session"];
  if (toDel) {
    SRL_Map.delete(toDel);
    res.clearCookie("pseudo-session", {
      httpOnly: true,
      secure: false, // set to true in production (HTTPS)
      sameSite: "strict",
    });
  }

  // Step 1: Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("BEARER ")) {
    return res.status(401).json({ msg: "Token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  // Step 2: Verify token
  let payload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    console.error("JWT error in RestSRL:", err.message);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }

  // Step 3: Init or use rate-limiting map
  if (!SRL_Map.has(payload.uniqueId)) {
    SRL_Map.set(payload.uniqueId, {
      count: 0,
      lastreset: Date.now(),
    });
  }

  // Step 4: Handle rate limiting
  if (handleRateLimit(res, payload.uniqueId, 100)) {
    return res.status(429).json({ msg: "Too many requests" });
  }

  // Step 5: Proceed to next middleware
  next();
};

module.exports = { AuthSRL, RestSRL };
