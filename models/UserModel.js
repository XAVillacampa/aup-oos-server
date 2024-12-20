const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  idNum: { type: Number, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  phoneNumber: { type: String, required: true },
  pwd: { type: String, required: true },
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: Number,
      price: Number,
    },
  ],
  role: {
    type: String,
    default: function () {
      // Set default role based on idNum
      if (this.idNum.toString().length === 7) {
        return "student";
      } else if (this.idNum.toString().length === 8) {
        return "staff";
      } else {
        return "student"; // Default role if idNum is neither 7 nor 8
      }
    },
    enum: ["student", "staff", "employee", "admin"], // Adding additional roles without condition
  },
  tempPrice: { type: Number, default: 0 },
});

userSchema.statics.getUserById = async function (userId) {
  return this.findById(userId);
};

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
