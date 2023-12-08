const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  orderID: { type: Number },
  products: [
    {
      productID: { type: Number },
      quantity: { type: Number },
    },
  ],
});

const cartModel = mongoose.model("tempCart", cartSchema);
module.exports = cartModel;
