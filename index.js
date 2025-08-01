const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authenticationRoutes = require("./Routes/authentication");
const sessionRoutes = require("./Routes/session");
const { VerifySession } = require("./Middlewares/sessioinMid");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/auth", authenticationRoutes);
app.use("/session", sessionRoutes);

app.get("/", VerifySession, (req, res) => {
  res.status(200).json({
    msg: "sucessfull",
  });
});
const DB = mongoose
  .connect(`${process.env.MONGO_DB_URI}`)
  .then(() => console.log("connection to DB sucessfull"))
  .catch((err) => console.log("unable to connect to DB      " + err));

app.listen(5000, () => {
  console.log("app is listening at port 5000.........");
});
