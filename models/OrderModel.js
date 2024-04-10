const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
  },
  datePurchased: {
    type: Date,
    default: Date.now,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [
      "Complete",
      "Paid",
      "Waiting for Pickup",
      "Pending User Confirmation",
      "Cancelled",
    ],
    default: "Paid",
    required: true,
  },
  itemsPurchased: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: Number,
    },
  ],
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
