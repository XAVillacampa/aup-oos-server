const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  idNum: { type: Number, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  pwd: { type: String, required: true },
});

userSchema.statics.getUserById = async function (userId) {
  return this.findById(userId);
};

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
