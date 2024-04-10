const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema
const refundSchema = new Schema({
  dateCancelled: {
    type: Date,
    required: true,
  },
  idNum: {
    type: mongoose.Schema.Types.Number,
    ref: "User",
    required: true,
  },
  transactionNumber: {
    type: String,
    required: true,
    unique: true,
  },
  approval: {
    type: String,
    enum: ["pending", "approved", "declined"],
    default: "pending",
  },
  reason: {
    type: String,
    required: true,
  },
  itemsPurchased: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      quantity: {
        type: Number,
      },
    },
  ],
});

// Create and export the model
const Refund = mongoose.model("Refund", refundSchema);
module.exports = Refund;
