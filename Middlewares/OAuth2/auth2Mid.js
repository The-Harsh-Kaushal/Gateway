const axios = require("axios");
const User = require("../../Modals/User");
const jwt = require('jsonwebtoken');
async function OAuth2Helper(
  URL1,
  URL2,
  redirect_uri,
  client_id,
  client_secret,
  req
) {
  const code = req.query.code;
  try {
    const tokenResponse = await axios.post(
      URL1,
      new URLSearchParams({
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, id_token } = tokenResponse.data;
    const userInfo = await axios.get(URL2, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const { name, email, id, verified_email } = userInfo.data;
    const newUser = new User({
      uniqueId: id,
      fullName: name,
      email: email,
      oauth2: {
        provided: true,
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      isVerified: verified_email,
    });
    await newUser.save();
    req.user = newUser;
    // console.log(req.user);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
const OAuth2Google = async (req, res, next) => {
  const URL1 = "https://oauth2.googleapis.com/token";
  const URL2 = "https://www.googleapis.com/oauth2/v2/userinfo";
  const redirect_uri = "http://localhost:5000/auth/google/callback";
  if (
    await OAuth2Helper(
      URL1,
      URL2,
      redirect_uri,
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_ID,
      req
    )
  ) {
    next();
  } else {
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
};
const OAuth2GoogleRefresh = async (req, res, next) => {
  const refreshToken = req.cookies["refreshToken"];
  if (!refreshToken) {
    return res.status(400).json({
      msg: "No refersh token present",
    });
  }

  try {
    try{
      let payload;
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET,(error,decoded)=>{
         if(err){
          console.log(err);
          return res.status(500).json({msg : "internal server flaud"});
         }
         payload = decoded;
       });
    const { iat, exp, ...rest } = payload;
    const exsistingUser = await User.findById(rest.id);
    if (!exsistingUser) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    if(!exsistingUser.oauth2.provided){
     return next();
    }
    }
    catch(err){
        console.log(err);
        return res.status(404).json({msg : "user not found"});
    }
    
    const GoogleRefreshToken = exsistingUser.oauth2.refreshToken;
    const resp = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: GoogleRefreshToken,
        grant_type: "refresh_token",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    next();
  } catch (err) {
    console.log(err.response);
    return res.status(500).json({ msg: "Internal servor error" });
  }
};

module.exports = { OAuth2Google,OAuth2GoogleRefresh };
