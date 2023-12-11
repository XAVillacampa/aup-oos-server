const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    photo: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
    totalQuantity: { type: Number, required: true },
    category: { type: String },
  },
  { timestamps: true }
);

const productModel = mongoose.model("Product", productSchema);
module.exports = productModel;
