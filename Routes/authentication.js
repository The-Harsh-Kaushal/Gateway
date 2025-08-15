const express = require("express");
const router = express.Router();
const { LoginMiddleware, SignInMiddleware } = require("../Middlewares/authMid");
const { CreateSession } = require("../Middlewares/sessioinMid");
const { OAuth2Google } = require("../Middlewares/OAuth2/auth2Mid");

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

router.get("/google", (req, res) => {
  res.status(200).json({
    url: `${process.env.GOOGLE_OAUTH2_URL}`,
  });
});
router.get("/google/callback", OAuth2Google,CreateSession, (req, res) => {
  return res.status(200).json({
    msg: "hell yeah!",
  });
});

module.exports = router;
