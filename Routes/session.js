const express = require("express");
const { RefreshSession, logout, logoutAll } = require("../Middlewares/sessioinMid");
const router = express.Router();

router.get("/refresh", RefreshSession, async (req, res,) => {
  const token = req.token;
  res.cookie("refreshToken", token.refreshToken, {
    httpOnly: true,
    path: "/session",
    secure: false,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return res.status(200).json({
    msg: " sucessfully refreshed",
    accessToken: token.accessToken,
  });
});
router.get('/logout',logout,async(req,res,)=>{
    res.status(200).json({
        msg: " Logout sucessfull"
    })
})
router.get('/logoutall',logoutAll,(req,res)=>{
    res.status(200).json({
        msg: "Lougt All sucessfull"
    })
})

router.get("/hello", (req, res) => {
  res.status(200).json({
    msg: "sucessfull ",
  });
});
module.exports = router;
