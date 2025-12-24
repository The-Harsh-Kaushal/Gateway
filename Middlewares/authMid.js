const bcrypt = require("bcrypt");
const User = require("../Modals/User");

const LoginMiddleware = async (req, res, next) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({
      msg: "Credentials missing",
    });
  }

  try {
    // can use any of email or unique ID to login
    const AUser = await User.findOne({
      $or: [{ uniqueId: identifier }, { email: identifier }],
    });
    if (!AUser) {
      return res.status(400).json({
        msg: "no such user exsists",
      });
    }

    const compareHash = await bcrypt.compare(password, AUser.hashedPassword);
    if (!compareHash) {
      return res.status(401).json({
        msg: "Wrong Password",
      });
    }
    req.user = AUser;
    next();
  } catch (err) {
    throw err;
  }
};

const SignInMiddleware = async (req, res, next) => {
  const { uniqueId, email, password, fullname } = req.body;
  if (!uniqueId || !email || !password || !fullname) {
    return res.status(400).json({
      msg: "Fill all the required fields",
    });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName: fullname,
      uniqueId: uniqueId,
      email: email,
      hashedPassword: hashedPassword,
    });

    await newUser.save();
    req.user = newUser;
    next();
  } catch (err) {
    if (err.code === 11000) {
      if (err.keyPattern.uniqueId) {
        return res.status(400).json({ msg: "Unique ID is taken" });
      }
      if (err.keyPattern.email) {
        return res.status(400).json({ msg: "Email is already in use" });
      }
    }
    throw err;
  }
};

module.exports = { LoginMiddleware, SignInMiddleware };
