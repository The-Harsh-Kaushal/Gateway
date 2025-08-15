const express = require("express");
const helmet = require('helmet');
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authenticationRoutes = require("./Routes/authentication");
const sessionRoutes = require("./Routes/session");
const { VerifySession } = require("./Middlewares/sessioinMid");
const { AuthLB, RestLB } = require("./Middlewares/Rate Limiting/leakyBucketRateLimiting");

// const { RestSRL, AuthSRL } = require("./Middlewares/Rate Limiting/staticRateLimiting");

require("dotenv").config();

const app = express();
//security middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use("/auth", AuthSRL);
// app.use("/session", RestSRL);
app.use('/auth',AuthLB);
app.use("/session",RestLB);
app.use("/auth", authenticationRoutes);
app.use("/session", sessionRoutes);
app.use(express.static('./static'));

const DB = mongoose
  .connect(`${process.env.MONGO_DB_URI}`)
  .then(() => console.log("connection to DB sucessfull"))
  .catch((err) => console.log("unable to connect to DB      " + err));

app.listen(5000, () => {
  console.log("app is listening at port 5000.........");
});
