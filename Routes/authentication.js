const express = require("express");
const router = express.Router();
const { LoginMiddleware, SignInMiddleware } = require("../Middlewares/authMid");
const { CreateSession } = require("../Middlewares/sessioinMid");

router.post("/login", LoginMiddleware, CreateSession, (req, res) => {
  const tokens = req.tokens;
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/session",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.status(200).json({
    msg: "sucessfull Login",
    accessToken: tokens.accessToken,
  });
});

router.post("/signin", SignInMiddleware, CreateSession, (req, res) => {
  const tokens = req.tokens;
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/session",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.status(200).json({
    msg: "sucessfull SignIn",
    accessToken: tokens.accessToken,
  });
});


module.exports = router;
