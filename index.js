const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authenticationRoutes = require("./Routes/authentication");
const sessionRoutes = require("./Routes/session");
const { VerifySession } = require("./Middlewares/sessioinMid");
const {
  AuthLB,
  RestLB,
} = require("./Middlewares/Rate Limiting/leakyBucketRateLimiting");
const { redis, connectRedis } = require("./RedisClient");

require("dotenv").config();

const app = express();
//security middleware
app.use(helmet());
//translating middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/auth", AuthLB, authenticationRoutes);
app.use("/session/refresh", RestLB, sessionRoutes);

app.use(express.static("./static"));

async function startServer() {
  try {
    await connectRedis();

    await mongoose.connect(`${process.env.MONGO_DB_URI}`);
    console.log("connection to DB sucessfull");

    app.listen(5000, () => {
      console.log("app is listening at port 5000.........");
    });
  } catch (err) {
    console.log("StartUp failed : ", err);
    process.exit(1);
  }
}
