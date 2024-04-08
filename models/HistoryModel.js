const mongoose = require("mongoose");

const orderHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  datePurchased: {
    type: Date,
    default: Date.now,
    required: true,
  },
  amountSpent: {
    type: Number,
    required: true,
  },
  methodOfPayment: {
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
    required: true,
  },
  itemsPurchased: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
});

const OrderHistory = mongoose.model("OrderHistory", orderHistorySchema);
module.exports = OrderHistory;
