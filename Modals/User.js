const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uniqueId: { type: String, unique: true, required: true },
  fullName: { type: String, required: true },
  email : {type: String , required: true},
  hashedPassword: { type: String, required: true },
  session: [
    {
      token: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date,
      device: String,
    },
  ],
  roles: { type: String, default: "user" },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User',UserSchema)
module.exports = User
