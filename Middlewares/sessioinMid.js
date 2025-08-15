const bcrypt = require("bcrypt");
const User = require("../Modals/User");
const jwt = require("jsonwebtoken");

const CreateSession = async (req, res, next) => {
  const user = req.user;

  const payload = {
    id: user._id,
    email: user.email,
    uniqueId: user.uniqueId,
  };

  try {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          session: {
            token: refreshToken,
          },
        },
      }
    );
    req.tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    next();
  } catch (err) {
    console.log("Error while creating a session ", err);
    return res.status(500).json({
      msg: "session creation failed",
    });
  }
};

const VerifySession = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "Token missing or malformed",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.log("JWT verification failed:", err.message);
    return res.status(401).json({
      msg: "Invalid or expired token",
    });
  }
};


const RefreshSession = async (req, res, next) => {
  const refreshToken = req.cookies["refreshToken"];
  if (!refreshToken) {
    return res.status(400).json({
      msg: "No refersh token present",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { iat, exp, ...rest } = payload;
    const exsistingUser = await User.findById(rest.id);
    if (!exsistingUser) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    const session = exsistingUser.session.find((s) => s.token === refreshToken);
    // if token is valid but not persent in db likely it's stolen so logout all sessions

    if (!session) {
      try {
        exsistingUser.session = [];
        exsistingUser.save();
        return res.status(403).json({
          msg: "Token is stolen Loging out of all sessions",
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json({
          msg: "Internal Server Error",
        });
      }
    }
    const newrefreshToken = jwt.sign(rest, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    const newaccessToken = jwt.sign(rest, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    session.token = newrefreshToken;
    await exsistingUser.save();
    req.token = {
      accessToken: newaccessToken,
      refreshToken: newrefreshToken,
    };
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      msg: "Invalid refresh token",
    });
  }
};
const logout = async (req, res, next) => {
  const refreshToken = req.cookies["refreshToken"];
  if (!refreshToken) {
    return res.status(401).json({
      msg: "error handling logout",
    });
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const exsistingUser = await User.findById(payload.id);
    if (!exsistingUser) {
      return res.status(404).json({
        msg: "user not found",
      });
    }
    exsistingUser.session = exsistingUser.session.filter(
      (s) => s.token !== refreshToken
    );
    await exsistingUser.save();
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "internal server error",
    });
  }
};
const logoutAll = async (req, res, next) => {
  const refreshToken = req.cookies["refreshToken"];
  if (!refreshToken) {
    return res.status(401).json({
      msg: "error handling logout",
    });
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const exsistingUser = await User.findById(payload.id);
    if (!exsistingUser) {
      return res.status(404).json({
        msg: "user not found",
      });
    }
    exsistingUser.session = [];
    await exsistingUser.save();
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "internal server error",
    });
  }
};
module.exports = {
  CreateSession,
  VerifySession,
  RefreshSession,
  logout,
  logoutAll,
};
